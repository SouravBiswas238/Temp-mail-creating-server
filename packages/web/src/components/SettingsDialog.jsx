import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getMailboxSettings, setMailboxLifetime, setMailboxPin } from "../api/client.js";
import CopyButton from "./CopyButton.jsx";

const LIFETIME_OPTIONS = [
  { label: "2 days", seconds: 172800 },
  { label: "7 days", seconds: 604800 },
  { label: "10 days", seconds: 864000 },
];

export default function SettingsDialog({ address, open, onClose }) {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["mailbox-settings", address],
    queryFn: () => getMailboxSettings(address),
    enabled: open && Boolean(address),
  });

  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pinError, setPinError] = useState(null);
  const [pinSaved, setPinSaved] = useState(false);
  const [pinSaving, setPinSaving] = useState(false);

  // Reset the PIN form each time the dialog is (re)opened for a mailbox.
  useEffect(() => {
    if (open) {
      setCurrentPin("");
      setNewPin("");
      setPinError(null);
      setPinSaved(false);
    }
  }, [open, address]);

  const handleLifetimeSelect = async (seconds) => {
    await setMailboxLifetime(address, seconds);
    queryClient.invalidateQueries({ queryKey: ["mailbox-settings", address] });
  };

  const handlePinSave = async (e) => {
    e.preventDefault();
    setPinError(null);
    setPinSaving(true);
    try {
      await setMailboxPin(address, newPin, currentPin);
      setPinSaved(true);
      setCurrentPin("");
      setNewPin("");
      queryClient.invalidateQueries({ queryKey: ["mailbox-settings", address] });
      queryClient.invalidateQueries({ queryKey: ["pin-status", address] });
    } catch (err) {
      setPinError(err.message);
    } finally {
      setPinSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-stretch justify-center sm:items-center sm:p-4">
        <DialogPanel
          transition
          className="flex w-full flex-col overflow-y-auto bg-white shadow-xl duration-200 data-closed:scale-95 data-closed:opacity-0 sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
            <DialogTitle className="text-sm font-semibold text-slate-900">Settings</DialogTitle>
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

          <div className="space-y-6 px-4 py-5 sm:px-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">Choose mailbox lifetime</p>
              <div className="flex flex-wrap gap-2">
                {LIFETIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.seconds}
                    type="button"
                    onClick={() => handleLifetimeSelect(opt.seconds)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      settings?.lifetimeSeconds === opt.seconds
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Messages received after this mailbox's lifetime elapses are deleted automatically.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">Set PIN-code</p>
              <form onSubmit={handlePinSave} className="space-y-2">
                {settings?.hasPin && (
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Current PIN"
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-300 outline-none transition focus:ring-2 focus:ring-indigo-500"
                  />
                )}
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={settings?.hasPin ? "New PIN (leave blank to remove)" : "PIN-code"}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-300 outline-none transition focus:ring-2 focus:ring-indigo-500"
                />
                {pinError && <p className="text-xs font-medium text-rose-600">{pinError}</p>}
                {pinSaved && !pinError && <p className="text-xs font-medium text-emerald-600">Saved.</p>}
                <button
                  type="submit"
                  disabled={pinSaving}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {pinSaving ? "Saving..." : "Save"}
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <p className="mb-2 text-sm font-semibold text-slate-900">Secret address</p>
              <p className="mb-2 text-xs text-slate-500">
                Mail sent to this address also lands in this inbox. Keep it private.
              </p>
              {settings?.secretAddress ? (
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-200">
                    {settings.secretAddress}
                  </code>
                  <CopyButton value={settings.secretAddress} />
                </div>
              ) : (
                <p className="text-xs text-slate-400">Loading...</p>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
