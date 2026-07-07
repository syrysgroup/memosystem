"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconDocumentPlus,
  IconInbox,
  IconChat,
  IconChart,
  IconUsers,
  IconTeam,
  IconShield,
} from "@/components/icons";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { href: "/documents/new", label: "New Document", icon: IconDocumentPlus },
  { href: "/registry", label: "Registry", icon: IconInbox },
  { href: "/messages", label: "Messages", icon: IconChat },
  { href: "/reports", label: "Reports", icon: IconChart },
  { href: "/directory", label: "Directory", icon: IconUsers },
  { href: "/team", label: "My Team", icon: IconTeam },
  { href: "/audit-grants", label: "Audit Grants", icon: IconShield },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-ecowas-green bg-ecowas-green-tint text-ecowas-green"
                : "border-transparent text-ink-muted hover:bg-ecowas-green-tint/60 hover:text-ecowas-green"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
