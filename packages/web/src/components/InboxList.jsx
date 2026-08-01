import { useQuery } from "@tanstack/react-query";
import { fetchMessages } from "../api/client.js";
import { useInboxUpdates } from "../hooks/useInboxUpdates.js";
import MessageRow from "./MessageRow.jsx";

export default function InboxList({ address, onOpenMessage }) {
  useInboxUpdates(address);

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["messages", address],
    queryFn: () => fetchMessages(address),
    enabled: Boolean(address),
  });

  if (isLoading) {
    return <div className="inbox-state">Loading...</div>;
  }

  if (error) {
    return <div className="inbox-state inbox-error">Failed to load inbox: {error.message}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="inbox-state">
        <span className="spinner" aria-hidden="true" />
        Waiting for mail...
      </div>
    );
  }

  return (
    <ul className="inbox-list">
      {messages.map((message) => (
        <MessageRow key={message.id} message={message} onOpen={onOpenMessage} />
      ))}
    </ul>
  );
}
