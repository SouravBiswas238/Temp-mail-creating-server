import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchMessages } from "../api/client.js";
import { useInboxUpdates } from "../hooks/useInboxUpdates.js";
import MessageRow from "./MessageRow.jsx";

function StateCard({ children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"
      aria-hidden="true"
    />
  );
}

export default function InboxList({ address, token, onOpenMessage, onPinRequired }) {
  useInboxUpdates(address, token);

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["messages", address, token],
    queryFn: () => fetchMessages(address, token),
    enabled: Boolean(address),
  });

  // A previously-unlocked token can expire mid-session; drop back to the
  // PIN prompt instead of showing a generic error in that case.
  useEffect(() => {
    if (error?.code === "pin_required") onPinRequired?.();
  }, [error, onPinRequired]);

  if (isLoading) {
    return (
      <StateCard>
        <Spinner />
        <p className="text-sm text-slate-500">Loading inbox...</p>
      </StateCard>
    );
  }

  if (error) {
    return (
      <StateCard>
        <p className="text-sm font-medium text-rose-600">Failed to load inbox</p>
        <p className="text-xs text-slate-500">{error.message}</p>
      </StateCard>
    );
  }

  if (messages.length === 0) {
    return (
      <StateCard>
        <Spinner />
        <p className="text-sm text-slate-500">Waiting for mail...</p>
      </StateCard>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              From
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Subject
            </th>
            <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell md:w-40 lg:w-56">
              Preview
            </th>
            <th scope="col" className="hidden whitespace-nowrap px-4 py-3 font-medium sm:table-cell">
              Received
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} onOpen={onOpenMessage} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
