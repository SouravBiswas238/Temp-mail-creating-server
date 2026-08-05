import { createHmac, timingSafeEqual } from "node:crypto";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64, secret) {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

/** Stateless PIN-unlock session token: base64url(payload) + "." + HMAC signature. */
export function signToken({ address, exp }, secret) {
  const payloadB64 = base64url(JSON.stringify({ address, exp }));
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

/** Returns the decoded { address, exp } if the token is validly signed and unexpired, else null. */
export function verifyToken(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
  return payload;
}
