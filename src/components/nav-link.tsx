"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex border-b-2 border-ecowas-green py-3 font-semibold text-ecowas-green whitespace-nowrap"
          : "inline-flex border-b-2 border-transparent py-3 text-ink-muted whitespace-nowrap hover:text-ecowas-green"
      }
    >
      {children}
    </Link>
  );
}
