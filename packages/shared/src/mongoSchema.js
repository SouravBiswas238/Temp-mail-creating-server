import mongoose from "mongoose";

const { Schema } = mongoose;

const AttachmentSchema = new Schema(
  {
    filename: String,
    contentType: String,
    size: Number,
    contentId: String,
  },
  { _id: false }
);

const MessageSchema = new Schema({
  to: { type: String, required: true, lowercase: true, index: true },
  from: { type: String, required: true, lowercase: true },
  fromDisplay: { type: String, default: "" },
  subject: { type: String, default: "(no subject)" },
  text: { type: String, default: "" },
  html: { type: String, default: null },
  attachments: { type: [AttachmentSchema], default: [] },
  messageId: { type: String, default: null },
  size: { type: Number, default: 0 },
  receivedAt: { type: Date, default: Date.now },
  // Per-mailbox expiry (see mailboxSchema.js MailboxSettings.lifetimeSeconds),
  // computed at insert time. Using an explicit date + expireAfterSeconds: 0
  // (expire exactly at this date) instead of a flat expireAfterSeconds on
  // receivedAt, since Mongo TTL indexes only support one fixed window per
  // index and different mailboxes can choose different lifetimes.
  expiresAt: { type: Date, required: true },
  read: { type: Boolean, default: false },
});

export function buildMessageSchema() {
  const schema = MessageSchema.clone();
  schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  schema.index({ to: 1, receivedAt: -1 });
  return schema;
}

export function getMessageModel() {
  if (mongoose.models.Message) return mongoose.models.Message;
  return mongoose.model("Message", buildMessageSchema());
}
