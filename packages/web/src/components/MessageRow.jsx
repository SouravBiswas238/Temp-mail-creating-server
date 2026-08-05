export default function MessageRow({ message, onOpen }) {
  const receivedAt = new Date(message.receivedAt).toLocaleString();
  const isUnread = !message.read;
  const emphasis = isUnread ? "font-semibold text-slate-900" : "font-normal text-slate-600";

  return (
    <tr onClick={() => onOpen(message.id)} className="cursor-pointer transition hover:bg-indigo-50/60">
      <td className="max-w-[8rem] truncate px-4 py-3 sm:max-w-[12rem]">
        <span className="flex items-center gap-2">
          {isUnread && (
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-600" aria-hidden="true" />
          )}
          <span className={`truncate ${emphasis}`}>{message.from}</span>
        </span>
      </td>
      <td className="max-w-[9rem] px-4 py-3 sm:max-w-[10rem] md:max-w-[12rem] lg:max-w-[18rem]">
        <div className={`truncate ${emphasis}`}>{message.subject}</div>
        <div className="mt-0.5 truncate text-xs text-slate-400 sm:hidden">{receivedAt}</div>
        <div className="mt-0.5 truncate text-xs text-slate-400 md:hidden">{message.snippet}</div>
      </td>
      <td className="hidden truncate px-4 py-3 text-slate-500 md:table-cell md:max-w-[10rem] lg:max-w-[14rem]">
        {message.snippet}
      </td>
      <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-slate-400 sm:table-cell">{receivedAt}</td>
    </tr>
  );
}
