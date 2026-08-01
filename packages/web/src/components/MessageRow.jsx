export default function MessageRow({ message, onOpen }) {
  const receivedAt = new Date(message.receivedAt).toLocaleString();
  return (
    <li className={`message-row ${message.read ? "read" : "unread"}`} onClick={() => onOpen(message.id)}>
      <span className="message-from">{message.from}</span>
      <span className="message-subject">{message.subject}</span>
      <span className="message-snippet">{message.snippet}</span>
      <span className="message-date">{receivedAt}</span>
    </li>
  );
}
