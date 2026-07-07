"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/avatar";

type ConversationItem = { id: string; name: string; preview?: string; time?: string };

function Row({ href, name, preview, time, shape }: ConversationItem & { href: string; shape: "circle" | "square" }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${active ? "bg-ecowas-green-tint" : "hover:bg-paper"}`}
    >
      <Avatar name={name} shape={shape} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{shape === "square" ? `# ${name}` : name}</p>
        {preview ? <p className="truncate text-xs text-ink-muted">{preview}</p> : null}
      </div>
      {time ? <span className="shrink-0 text-[11px] text-ink-muted">{time}</span> : null}
    </Link>
  );
}

export function ConversationList({
  channels,
  dms,
  dict,
}: {
  channels: ConversationItem[];
  dms: ConversationItem[];
  dict: { title: string; officeChannels: string; directMessages: string };
}) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-semibold text-ink">{dict.title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {channels.length > 0 ? (
          <div>
            <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {dict.officeChannels}
            </p>
            {channels.map((c) => (
              <Row key={c.id} href={`/messages/office/${c.id}`} shape="square" {...c} />
            ))}
          </div>
        ) : null}

        {dms.length > 0 ? (
          <div>
            <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {dict.directMessages}
            </p>
            {dms.map((d) => (
              <Row key={d.id} href={`/messages/dm/${d.id}`} shape="circle" {...d} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
