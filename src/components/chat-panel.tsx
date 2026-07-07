"use client";

import { useEffect, useRef } from "react";
import { Avatar } from "@/components/avatar";
import { IconSend } from "@/components/icons";
import type { Message, Profile } from "@/lib/supabase/types";

function formatBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel({
  title,
  avatarName,
  avatarShape = "circle",
  messages,
  staffById,
  currentUserId,
  action,
  hiddenFieldName,
  hiddenFieldValue,
  placeholder,
  noMessagesYet,
  unknownSender,
  sendLabel,
}: {
  title: string;
  avatarName?: string;
  avatarShape?: "circle" | "square";
  messages: Message[];
  staffById: Map<string, Profile>;
  currentUserId: string;
  action: (formData: FormData) => void | Promise<void>;
  hiddenFieldName: string;
  hiddenFieldValue: string;
  placeholder: string;
  noMessagesYet: string;
  unknownSender: string;
  sendLabel: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Avatar name={avatarName ?? title} shape={avatarShape} />
        <h1 className="font-semibold text-ink">{title}</h1>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto bg-paper px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-ink-muted">{noMessagesYet}</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            const senderName = staffById.get(m.sender_id)?.full_name ?? unknownSender;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                    isMine ? "rounded-br-sm bg-ecowas-green text-white" : "rounded-bl-sm bg-surface text-ink"
                  }`}
                >
                  {!isMine ? <p className="mb-0.5 text-xs font-semibold text-ecowas-brown">{senderName}</p> : null}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-right text-[10px] ${isMine ? "text-white/70" : "text-ink-muted"}`}>
                    {formatBubbleTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form action={action} className="flex items-center gap-2 border-t border-border bg-surface p-3">
        <input type="hidden" name={hiddenFieldName} value={hiddenFieldValue} />
        <input
          name="body"
          required
          autoComplete="off"
          placeholder={placeholder}
          className="flex-1 rounded-full border border-border bg-paper px-4 py-2 text-sm focus:border-ecowas-green focus:outline-none"
        />
        <button
          type="submit"
          aria-label={sendLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ecowas-green text-white hover:bg-ecowas-green-dark"
        >
          <IconSend className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
