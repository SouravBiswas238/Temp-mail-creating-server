import fs from "node:fs";
import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { DEFAULT_LIFETIME_SECONDS } from "@tempmail/shared/src/mailboxSchema.js";
import { isOwnedAddress, normalizeAddress } from "@tempmail/shared/src/domainConfig.js";
import { config } from "./config.js";
import { MailboxSettings, Message } from "./mongoClient.js";
import { createConnectionRateLimiter } from "./rateLimiter.js";

const connectionLimiter = createConnectionRateLimiter({
  maxPerWindow: config.maxConnectionsPerIpPerMinute,
});

function remoteIp(session) {
  return session.remoteAddress || "unknown";
}

// A recipient may be either a mailbox's canonical address or its secret
// alias (see mailboxSchema.js) - both must deliver into the same inbox.
// Resolves whichever was used down to { canonical, lifetimeSeconds }.
async function resolveRecipient(to) {
  const settings = await MailboxSettings.findOne({
    $or: [{ address: to }, { secretAlias: to }],
  }).lean();

  if (!settings) return { canonical: to, lifetimeSeconds: DEFAULT_LIFETIME_SECONDS };
  return { canonical: settings.address, lifetimeSeconds: settings.lifetimeSeconds };
}

export function createSmtpServer(logger) {
  const tlsOptions = {};
  if (config.tlsKeyPath && config.tlsCertPath) {
    tlsOptions.key = fs.readFileSync(config.tlsKeyPath);
    tlsOptions.cert = fs.readFileSync(config.tlsCertPath);
  }

  const server = new SMTPServer({
    ...tlsOptions,
    // Opportunistic TLS only when certs are configured; never require AUTH -
    // this is a receive-only server, so there is no legitimate use for AUTH,
    // and AUTH is exactly what would let it be abused to send/relay mail.
    disabledCommands: ["AUTH", ...(tlsOptions.key ? [] : ["STARTTLS"])],
    authOptional: true,
    size: config.maxMessageSize,
    logger: false,

    onConnect(session, callback) {
      const ip = remoteIp(session);
      if (!connectionLimiter.allow(ip)) {
        logger.warn({ ip }, "connection rate limit exceeded, dropping");
        return callback(new Error("421 Too many connections, try again later"));
      }
      callback();
    },

    onMailFrom(_address, _session, callback) {
      // Receive-only: accept any sender. We don't authenticate inbound senders
      // (that's what SPF/DKIM checking on the receiving side would be for,
      // out of scope here) - we just never forward/relay, which is the actual
      // anti-abuse boundary, enforced in onRcptTo below.
      callback();
    },

    onRcptTo(address, session, callback) {
      const recipientCount = (session.envelope.rcptTo || []).length;
      if (recipientCount >= config.maxRecipients) {
        return callback(new Error("452 Too many recipients"));
      }
      if (!isOwnedAddress(address.address, config.ownedDomains)) {
        logger.info({ address: address.address }, "rejected recipient: domain not owned");
        return callback(new Error("550 5.1.1 No such user/domain here"));
      }
      callback();
    },

    onData(stream, session, callback) {
      let size = 0;
      stream.on("data", (chunk) => {
        size += chunk.length;
      });

      simpleParser(stream)
        .then(async (parsed) => {
          const rawRecipients = (session.envelope.rcptTo || [])
            .map((r) => normalizeAddress(r.address))
            .filter((addr) => addr && isOwnedAddress(addr, config.ownedDomains));

          if (rawRecipients.length === 0) {
            // Shouldn't happen since onRcptTo already filtered, but never write
            // a message with no valid owned recipient.
            return callback();
          }

          const resolved = await Promise.all(rawRecipients.map(resolveRecipient));

          const fromAddress = parsed.from?.value?.[0]?.address || session.envelope.mailFrom?.address || "unknown";
          const receivedAt = new Date();

          await Promise.all(
            resolved.map(({ canonical, lifetimeSeconds }) =>
              Message.create({
                to: canonical,
                from: fromAddress.toLowerCase(),
                fromDisplay: parsed.from?.text || fromAddress,
                subject: parsed.subject || "(no subject)",
                text: parsed.text || "",
                html: parsed.html || null,
                attachments: (parsed.attachments || []).map((a) => ({
                  filename: a.filename,
                  contentType: a.contentType,
                  size: a.size,
                  contentId: a.contentId,
                })),
                messageId: parsed.messageId || null,
                size,
                receivedAt,
                expiresAt: new Date(receivedAt.getTime() + lifetimeSeconds * 1000),
              })
            )
          );

          logger.info(
            { to: resolved.map((r) => r.canonical), from: fromAddress, size },
            "message stored"
          );
          callback();
        })
        .catch((err) => {
          logger.error({ err }, "failed to parse/store message");
          callback(new Error("451 Temporary failure processing message"));
        });
    },
  });

  return server;
}
