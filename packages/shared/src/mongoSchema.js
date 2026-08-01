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
  read: { type: Boolean, default: false },
});

// TTL index: MongoDB's background monitor removes documents once
// `receivedAt` + expireAfterSeconds has passed. No app-level cleanup needed.
// The window is configurable via MESSAGE_TTL_SECONDS so it can be shortened in tests.
export function buildMessageSchema(ttlSeconds) {
  const schema = MessageSchema.clone();
  schema.index({ receivedAt: 1 }, { expireAfterSeconds: ttlSeconds });
  schema.index({ to: 1, receivedAt: -1 });
  return schema;
}

export function getMessageModel(ttlSeconds) {
  if (mongoose.models.Message) return mongoose.models.Message;
  return mongoose.model("Message", buildMessageSchema(ttlSeconds));
}
