import { Router } from "express";
import {
  InvalidAddressError,
  deleteInbox,
  deleteMessage,
  getMessage,
  listMessages,
} from "../services/messageService.js";

export const messagesRouter = Router();

function handleInvalidAddress(err, res, next) {
  if (err instanceof InvalidAddressError) {
    return res.status(400).json({ error: "invalid or unsupported address" });
  }
  if (err.name === "CastError") {
    return res.status(404).json({ error: "message not found" });
  }
  next(err);
}

messagesRouter.get("/", async (req, res, next) => {
  try {
    const messages = await listMessages(req.query.address);
    res.json({ messages });
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});

messagesRouter.get("/:id", async (req, res, next) => {
  try {
    const message = await getMessage(req.query.address, req.params.id);
    if (!message) return res.status(404).json({ error: "message not found" });
    res.json({ message });
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});

messagesRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await deleteMessage(req.query.address, req.params.id);
    if (!deleted) return res.status(404).json({ error: "message not found" });
    res.status(204).end();
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});

messagesRouter.delete("/", async (req, res, next) => {
  try {
    const deletedCount = await deleteInbox(req.query.address);
    res.json({ deletedCount });
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});
