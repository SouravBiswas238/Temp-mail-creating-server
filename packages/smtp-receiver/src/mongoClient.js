import mongoose from "mongoose";
import { getMessageModel } from "@tempmail/shared/src/mongoSchema.js";
import { config } from "./config.js";

let connected = false;

export async function connectMongo() {
  if (connected) return;
  await mongoose.connect(config.mongoUri);
  connected = true;
}

export const Message = getMessageModel(config.messageTtlSeconds);
