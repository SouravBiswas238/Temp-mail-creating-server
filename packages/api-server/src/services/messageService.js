import { Message } from "../mongoClient.js";
import { requireOwnedAddress } from "./addressValidation.js";

export { InvalidAddressError } from "./addressValidation.js";

const LIST_FIELDS = "to from fromDisplay subject text receivedAt read size attachments";

export async function listMessages(rawAddress) {
  const address = requireOwnedAddress(rawAddress);
  const docs = await Message.find({ to: address }, LIST_FIELDS).sort({ receivedAt: -1 }).lean();
  return docs.map(toSummaryDTO);
}

// Ownership check: a message can only ever be returned/deleted if its stored
// `to` matches the address the caller supplied. There is no auth in this
// system - knowledge of the address IS the access control - so this check is
// what stops someone from reading arbitrary mail by guessing/enumerating
// Mongo ObjectIds.
export async function getMessage(rawAddress, id) {
  const address = requireOwnedAddress(rawAddress);
  const doc = await Message.findOne({ _id: id, to: address }).lean();
  if (!doc) return null;
  await Message.updateOne({ _id: id }, { $set: { read: true } });
  return toDetailDTO(doc);
}

export async function deleteMessage(rawAddress, id) {
  const address = requireOwnedAddress(rawAddress);
  const result = await Message.deleteOne({ _id: id, to: address });
  return result.deletedCount > 0;
}

export async function deleteInbox(rawAddress) {
  const address = requireOwnedAddress(rawAddress);
  const result = await Message.deleteMany({ to: address });
  return result.deletedCount;
}

export async function countMessagesSince(rawAddress, sinceDate) {
  const address = requireOwnedAddress(rawAddress);
  return Message.countDocuments({ to: address, receivedAt: { $gt: sinceDate } });
}

function toSummaryDTO(doc) {
  return {
    id: String(doc._id),
    from: doc.fromDisplay || doc.from,
    subject: doc.subject,
    receivedAt: doc.receivedAt,
    read: doc.read,
    hasAttachments: (doc.attachments || []).length > 0,
    snippet: (doc.text || "").replace(/\s+/g, " ").trim().slice(0, 140),
  };
}

function toDetailDTO(doc) {
  return {
    id: String(doc._id),
    to: doc.to,
    from: doc.fromDisplay || doc.from,
    subject: doc.subject,
    text: doc.text,
    html: doc.html,
    attachments: doc.attachments || [],
    receivedAt: doc.receivedAt,
    read: doc.read,
  };
}
