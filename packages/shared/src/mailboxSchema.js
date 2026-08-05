import mongoose from "mongoose";

const { Schema } = mongoose;

export const DEFAULT_LIFETIME_SECONDS = 864000; // 10 days
export const ALLOWED_LIFETIME_SECONDS = [172800, 604800, 864000]; // 2 / 7 / 10 days

const MailboxSettingsSchema = new Schema({
  address: { type: String, required: true, lowercase: true, unique: true, index: true },
  secretAlias: { type: String, required: true, lowercase: true, unique: true, index: true },
  pinHash: { type: String, default: null },
  lifetimeSeconds: { type: Number, default: DEFAULT_LIFETIME_SECONDS },
  updatedAt: { type: Date, default: Date.now },
});

export function getMailboxSettingsModel() {
  if (mongoose.models.MailboxSettings) return mongoose.models.MailboxSettings;
  return mongoose.model("MailboxSettings", MailboxSettingsSchema);
}
