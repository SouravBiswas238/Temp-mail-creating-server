import { useEffect, useRef, useState } from "react";
import CopyButton from "./CopyButton.jsx";

const DEBOUNCE_MS = 600;

export default function AddressBar({ address, domain, onRegenerate, onLocalPartChange, onOpenSettings }) {
  const currentLocalPart = address.split("@")[0];
  const [inputValue, setInputValue] = useState(currentLocalPart);
  const debounceRef = useRef(null);

  // Keep the field in sync when the address changes from outside this
  // component (regenerate button, or the domain-mismatch auto-reset).
  useEffect(() => {
    setInputValue(currentLocalPart);
  }, [currentLocalPart]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onLocalPartChange(value);
    }, DEBOUNCE_MS);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
      <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Your temporary address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg ring-1 ring-slate-300 transition focus-within:ring-2 focus-within:ring-indigo-500">
          <input
            className="min-w-0 flex-1 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none sm:text-base"
            value={inputValue}
            onChange={handleChange}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            aria-label="Mailbox name"
          />
          <span className="flex items-center whitespace-nowrap border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 sm:text-base">
            @{domain}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-shrink-0">
          <CopyButton value={address} />
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
          >
            New address
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Mailbox settings"
            title="Mailbox settings"
            className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2.5 text-slate-600 shadow-sm transition hover:bg-slate-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
