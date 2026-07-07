import type { Message, Profile } from "@/lib/supabase/types";

export function MessageThread({
  messages,
  staffById,
  currentUserId,
}: {
  messages: Message[];
  staffById: Map<string, Profile>;
  currentUserId: string;
}) {
  return (
    <div className="flex h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
      {messages.length === 0 ? (
        <p className="text-sm text-slate-400">No messages yet — say hello.</p>
      ) : (
        messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          const senderName = staffById.get(m.sender_id)?.full_name ?? "Unknown";
          return (
            <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMine ? "self-end bg-slate-900 text-white" : "self-start bg-slate-100 text-slate-900"}`}>
              {!isMine ? <p className="mb-0.5 text-xs font-medium text-slate-500">{senderName}</p> : null}
              <p>{m.body}</p>
              <p className={`mt-1 text-[10px] ${isMine ? "text-slate-300" : "text-slate-400"}`}>
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
