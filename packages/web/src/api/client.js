const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function fetchMessages(address) {
  return request(`/messages?address=${encodeURIComponent(address)}`).then((d) => d.messages);
}

export function fetchMessage(address, id) {
  return request(`/messages/${id}?address=${encodeURIComponent(address)}`).then((d) => d.message);
}

export function deleteMessage(address, id) {
  return request(`/messages/${id}?address=${encodeURIComponent(address)}`, { method: "DELETE" });
}

export function clearInbox(address) {
  return request(`/messages?address=${encodeURIComponent(address)}`, { method: "DELETE" });
}

export function eventsUrl(address) {
  return `${BASE_URL}/events?address=${encodeURIComponent(address)}`;
}
