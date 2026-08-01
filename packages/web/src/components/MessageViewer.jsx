import { useQuery } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import { useMemo, useState } from "react";
import { deleteMessage, fetchMessage } from "../api/client.js";

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

export default function MessageViewer({ address, messageId, onClose, onDeleted }) {
  const [view, setView] = useState("html");

  const { data: message, isLoading } = useQuery({
    queryKey: ["message", address, messageId],
    queryFn: () => fetchMessage(address, messageId),
    enabled: Boolean(messageId),
  });

  const sanitizedHtml = useMemo(() => (message?.html ? sanitizeHtml(message.html) : null), [message]);

  if (!messageId) return null;

  const handleDelete = async () => {
    await deleteMessage(address, messageId);
    onDeleted?.(messageId);
    onClose();
  };

  return (
    <div className="message-viewer-overlay" onClick={onClose}>
      <div className="message-viewer" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn btn-close" onClick={onClose}>
          Close
        </button>
        {isLoading || !message ? (
          <div className="inbox-state">Loading...</div>
        ) : (
          <>
            <div className="message-header">
              <div>
                <strong>From:</strong> {message.from}
              </div>
              <div>
                <strong>Subject:</strong> {message.subject}
              </div>
              <div>
                <strong>Received:</strong> {new Date(message.receivedAt).toLocaleString()}
              </div>
            </div>

            <div className="message-tabs">
              <button
                type="button"
                className={view === "html" ? "tab active" : "tab"}
                onClick={() => setView("html")}
                disabled={!sanitizedHtml}
              >
                HTML
              </button>
              <button
                type="button"
                className={view === "text" ? "tab active" : "tab"}
                onClick={() => setView("text")}
              >
                Plain text
              </button>
              <button type="button" className="btn btn-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>

            <div className="message-body">
              {view === "html" && sanitizedHtml ? (
                <iframe
                  title="message-html"
                  className="message-html-frame"
                  sandbox="allow-same-origin"
                  srcDoc={sanitizedHtml}
                />
              ) : (
                <pre className="message-text">{message.text}</pre>
              )}
            </div>

            {message.attachments?.length > 0 && (
              <div className="message-attachments">
                <strong>Attachments:</strong>
                <ul>
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
      </div>
    </div>
  );
}
