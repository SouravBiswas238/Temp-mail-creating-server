import { Router } from "express";
import { InvalidAddressError } from "../services/addressValidation.js";
import { checkAccess, resolveCanonicalAddress } from "../services/mailboxService.js";
import { deleteInbox, deleteMessage, getMessage, listMessages } from "../services/messageService.js";

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

// Resolves the (possibly secret-alias) address to its canonical form and
// checks the PIN, if one is set. Returns the canonical address on success,
// or null after already sending a 401 response.
async function requireUnlockedAddress(req, res) {
  const address = await resolveCanonicalAddress(req.query.address);
  const token = req.header("x-mailbox-token") || req.query.token;
  const allowed = await checkAccess(address, token);
  if (!allowed) {
    res.status(401).json({ error: "pin_required" });
    return null;
  }
  return address;
}

messagesRouter.get("/", async (req, res, next) => {
  try {
    const address = await requireUnlockedAddress(req, res);
    if (!address) return;
    const messages = await listMessages(address);
    res.json({ messages });
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});

messagesRouter.get("/:id", async (req, res, next) => {
  try {
    const address = await requireUnlockedAddress(req, res);
    if (!address) return;
    const message = await getMessage(address, req.params.id);
    if (!message) return res.status(404).json({ error: "message not found" });
    res.json({ message });
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});

messagesRouter.delete("/:id", async (req, res, next) => {
  try {
    const address = await requireUnlockedAddress(req, res);
    if (!address) return;
    const deleted = await deleteMessage(address, req.params.id);
    if (!deleted) return res.status(404).json({ error: "message not found" });
    res.status(204).end();
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});

messagesRouter.delete("/", async (req, res, next) => {
  try {
    const address = await requireUnlockedAddress(req, res);
    if (!address) return;
    const deletedCount = await deleteInbox(address);
    res.json({ deletedCount });
  } catch (err) {
    handleInvalidAddress(err, res, next);
  }
});
