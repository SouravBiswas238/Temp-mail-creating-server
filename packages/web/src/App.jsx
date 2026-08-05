import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { clearInbox, getPinStatus } from "./api/client.js";
import AddressBar from "./components/AddressBar.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import InboxList from "./components/InboxList.jsx";
import MessageViewer from "./components/MessageViewer.jsx";
import PinPrompt from "./components/PinPrompt.jsx";
import SettingsDialog from "./components/SettingsDialog.jsx";
import { useAddress } from "./hooks/useAddress.js";
import { useMailboxToken } from "./hooks/useMailboxToken.js";

export default function App() {
  const { address, domain, regenerate, setLocalPart } = useAddress();
  const { token, saveToken, clearToken } = useMailboxToken(address);
  const [openMessageId, setOpenMessageId] = useState(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: pinStatus } = useQuery({
    queryKey: ["pin-status", address],
    queryFn: () => getPinStatus(address),
    enabled: Boolean(address),
  });
  const isLocked = Boolean(pinStatus?.hasPin) && !token;

  const handleRegenerate = () => {
    setOpenMessageId(null);
    regenerate();
  };

  const handleLocalPartChange = (localPart) => {
    setOpenMessageId(null);
    setLocalPart(localPart);
  };

  const handleClearInbox = async () => {
    setConfirmClearOpen(false);
    await clearInbox(address, token);
    queryClient.invalidateQueries({ queryKey: ["messages", address] });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["messages", address] });
  };

  const handleUnlocked = (newToken, expiresAt) => {
    saveToken(newToken, expiresAt);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10 lg:max-w-5xl lg:px-8">
        <header className="mb-6 flex items-center gap-3 sm:mb-8">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Tempmail</h1>
            <p className="text-xs text-slate-500 sm:text-sm">Disposable inbox, no sign-up required</p>
          </div>
        </header>

        <div className="space-y-6">
          <AddressBar
            address={address}
            domain={domain}
            onRegenerate={handleRegenerate}
            onLocalPartChange={handleLocalPartChange}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          {isLocked ? (
            <PinPrompt address={address} onUnlocked={handleUnlocked} />
          ) : (
            <section>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">Inbox</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 active:bg-slate-800"
                  >
                    Clear inbox
                  </button>
                </div>
              </div>

              <InboxList
                address={address}
                token={token}
                onOpenMessage={setOpenMessageId}
                onPinRequired={clearToken}
              />
            </section>
          )}
        </div>

        <MessageViewer
          address={address}
          token={token}
          messageId={openMessageId}
          onClose={() => setOpenMessageId(null)}
          onDeleted={() => queryClient.invalidateQueries({ queryKey: ["messages", address] })}
        />

        <ConfirmDialog
          open={confirmClearOpen}
          title="Clear inbox?"
          message="This permanently deletes every message in this inbox. This can't be undone."
          confirmLabel="Clear inbox"
          onConfirm={handleClearInbox}
          onCancel={() => setConfirmClearOpen(false)}
        />

        <SettingsDialog address={address} open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  );
}
