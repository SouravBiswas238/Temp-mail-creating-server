import { useState } from "react";
import { verifyMailboxPin } from "../api/client.js";

export default function PinPrompt({ address, onUnlocked }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, expiresAt } = await verifyMailboxPin(address, pin);
      onUnlocked(token, expiresAt);
    } catch (err) {
      setError(err.code === "incorrect PIN" || err.message === "incorrect PIN" ? "Incorrect PIN" : err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z"
          />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">This mailbox is PIN-protected</p>
        <p className="mt-1 text-xs text-slate-500">Enter the PIN to view its inbox.</p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-2">
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          autoFocus
          className="rounded-lg px-3 py-2.5 text-center text-sm text-slate-900 ring-1 ring-slate-300 outline-none transition focus:ring-2 focus:ring-indigo-500"
        />
        {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !pin}
          className="rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Checking..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
