import { useState } from "react";

export default function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable - silently no-op
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium shadow-sm transition ${
        copied ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-800 text-white hover:bg-slate-900"
      }`}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
