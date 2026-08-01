import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { clearInbox } from "./api/client.js";
import AddressBar from "./components/AddressBar.jsx";
import InboxList from "./components/InboxList.jsx";
import MessageViewer from "./components/MessageViewer.jsx";
import { useAddress } from "./hooks/useAddress.js";

export default function App() {
  const { address, regenerate } = useAddress();
  const [openMessageId, setOpenMessageId] = useState(null);
  const queryClient = useQueryClient();

  const handleRegenerate = () => {
    setOpenMessageId(null);
    regenerate();
  };

  const handleClearInbox = async () => {
    await clearInbox(address);
    queryClient.invalidateQueries({ queryKey: ["messages", address] });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>tempmail</h1>
      </header>

      <AddressBar address={address} onRegenerate={handleRegenerate} />

      <div className="inbox-toolbar">
        <h2>Inbox</h2>
        <button type="button" className="btn btn-clear" onClick={handleClearInbox}>
          Clear inbox
        </button>
      </div>

      <InboxList address={address} onOpenMessage={setOpenMessageId} />

      <MessageViewer
        address={address}
        messageId={openMessageId}
        onClose={() => setOpenMessageId(null)}
        onDeleted={() => queryClient.invalidateQueries({ queryKey: ["messages", address] })}
      />
    </div>
  );
}
