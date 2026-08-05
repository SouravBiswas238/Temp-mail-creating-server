const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `request failed: ${res.status}`);
    error.status = res.status;
    error.code = body.error;
    throw error;
  }
  if (res.status === 204) return null;
  return res.json();
}

function jsonBody(body) {
  return { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function authHeaders(token) {
  return token ? { "X-Mailbox-Token": token } : {};
}

export function fetchMessages(address, token) {
  return request(`/messages?address=${encodeURIComponent(address)}`, { headers: authHeaders(token) }).then(
    (d) => d.messages
  );
}

export function fetchMessage(address, id, token) {
  return request(`/messages/${id}?address=${encodeURIComponent(address)}`, { headers: authHeaders(token) }).then(
    (d) => d.message
  );
}

export function deleteMessage(address, id, token) {
  return request(`/messages/${id}?address=${encodeURIComponent(address)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function clearInbox(address, token) {
  return request(`/messages?address=${encodeURIComponent(address)}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function eventsUrl(address, token) {
  const params = new URLSearchParams({ address });
  if (token) params.set("token", token);
  return `${BASE_URL}/events?${params.toString()}`;
}

export function getPinStatus(address) {
  return request(`/mailbox/pin-status?address=${encodeURIComponent(address)}`);
}

export function getMailboxSettings(address) {
  return request(`/mailbox/settings?address=${encodeURIComponent(address)}`);
}

export function setMailboxLifetime(address, lifetimeSeconds) {
  return request(`/mailbox/lifetime`, jsonBody({ address, lifetimeSeconds }));
}

export function setMailboxPin(address, pin, currentPin) {
  return request(`/mailbox/pin`, jsonBody({ address, pin, currentPin }));
}

export function verifyMailboxPin(address, pin) {
  return request(`/mailbox/verify-pin`, jsonBody({ address, pin }));
}
