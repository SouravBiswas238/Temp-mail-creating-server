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
    <button type="button" className="btn btn-copy" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
