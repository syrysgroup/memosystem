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
    <div className="flex h-96 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-surface p-4">
      {messages.length === 0 ? (
        <p className="text-sm text-ink-muted">No messages yet — say hello.</p>
      ) : (
        messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          const senderName = staffById.get(m.sender_id)?.full_name ?? "Unknown";
          return (
            <div key={m.id} className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isMine ? "self-end bg-ecowas-green text-white" : "self-start bg-ecowas-green-tint text-ink"}`}>
              {!isMine ? <p className="mb-0.5 text-xs font-medium text-ink-muted">{senderName}</p> : null}
              <p>{m.body}</p>
              <p className={`mt-1 text-[10px] ${isMine ? "text-ink-muted" : "text-ink-muted"}`}>
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          );
        })
      )}
    </div>
  );
}
