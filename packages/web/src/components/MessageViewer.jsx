import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { useMemo, useState } from "react";
import { deleteMessage, fetchMessage } from "../api/client.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

// Email HTML is fully attacker-controlled (arbitrary <script>, onerror handlers,
// forms, etc. from whoever sends mail to this address). Two layers of defense:
// 1. DOMPurify strips scripts/event-handlers/dangerous URLs before we ever hand
//    the markup to the DOM.
// 2. The sanitized result is still rendered inside a sandboxed <iframe> with
//    no `allow-scripts`, so even a DOMPurify bypass can't execute in the page
//    or reach the app's own DOM/cookies, and the email's CSS is fully contained.
function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
  });
}

function TabButton({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export default function MessageViewer({ address, token, messageId, onClose, onDeleted }) {
  const [view, setView] = useState("html");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: message, isLoading } = useQuery({
    queryKey: ["message", address, messageId, token],
    queryFn: () => fetchMessage(address, messageId, token),
    enabled: Boolean(messageId),
  });

  const sanitizedHtml = useMemo(() => (message?.html ? sanitizeHtml(message.html) : null), [message]);

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    await deleteMessage(address, messageId, token);
    onDeleted?.(messageId);
    onClose();
  };

  return (
    <Dialog open={Boolean(messageId)} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-stretch justify-center sm:items-center sm:p-4">
        <DialogPanel
          transition
          className="flex w-full flex-col overflow-y-auto bg-white shadow-xl duration-200 data-closed:scale-95 data-closed:opacity-0 sm:max-h-[85vh] sm:max-w-2xl sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <h3 className="text-sm font-semibold text-slate-900">Message</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading || !message ? (
            <div className="flex flex-1 items-center justify-center py-16">
              <span
                className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
                aria-hidden="true"
              />
            </div>
          ) : (
            <>
              <div className="space-y-1 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div className="truncate text-sm">
                  <span className="font-medium text-slate-500">From: </span>
                  <span className="text-slate-900">{message.from}</span>
                </div>
                <div className="truncate text-sm">
                  <span className="font-medium text-slate-500">Subject: </span>
                  <span className="text-slate-900">{message.subject}</span>
                </div>
                <div className="text-xs text-slate-400">{new Date(message.receivedAt).toLocaleString()}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
                <TabButton active={view === "html"} disabled={!sanitizedHtml} onClick={() => setView("html")}>
                  HTML
                </TabButton>
                <TabButton active={view === "text"} onClick={() => setView("text")}>
                  Plain text
                </TabButton>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="ml-auto rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>

              <div className="flex-1 px-4 pb-4 sm:px-6">
                {view === "html" && sanitizedHtml ? (
                  <iframe
                    title="message-html"
                    className="h-[50vh] w-full rounded-lg border border-slate-200 sm:h-[400px]"
                    sandbox="allow-same-origin"
                    srcDoc={sanitizedHtml}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap break-words text-sm text-slate-700">{message.text}</pre>
                )}
              </div>

              {message.attachments?.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
                  <p className="mb-1 text-xs font-medium text-slate-500">Attachments</p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {message.attachments.map((a) => (
                      <li key={a.contentId || a.filename}>
                        {a.filename} ({Math.round(a.size / 1024)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </DialogPanel>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete this message?"
        message="This permanently deletes the message. This can't be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Dialog>
  );
}
