import { parseOwnedDomains } from "@tempmail/shared/src/domainConfig.js";

export const config = {
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/tempmail",
  ownedDomains: parseOwnedDomains(process.env.MAIL_DOMAIN || "localhost"),
  port: Number(process.env.SMTP_PORT || 2525),
  maxMessageSize: Number(process.env.SMTP_MAX_MESSAGE_SIZE || 10 * 1024 * 1024),
  maxRecipients: Number(process.env.SMTP_MAX_RECIPIENTS || 5),
  maxConnectionsPerIpPerMinute: Number(process.env.SMTP_MAX_CONNECTIONS_PER_IP_PER_MIN || 20),
  tlsKeyPath: process.env.SMTP_TLS_KEY_PATH || null,
  tlsCertPath: process.env.SMTP_TLS_CERT_PATH || null,
  messageTtlSeconds: Number(process.env.MESSAGE_TTL_SECONDS || 864000),
};
