"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/actions";
import { LOCALES, type Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({ current, className = "" }: { current: Locale; className?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function change(locale: Locale) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          disabled={isPending}
          aria-current={l === current}
          className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase transition-colors ${
            l === current ? "bg-ecowas-green text-white" : "text-ink-muted hover:bg-ecowas-green-tint"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
