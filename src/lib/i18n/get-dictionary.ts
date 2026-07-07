import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import type { Dictionary } from "./dictionary";
import en from "./dictionaries/en";
import fr from "./dictionaries/fr";
import pt from "./dictionaries/pt";

const DICTIONARIES: Record<Locale, Dictionary> = { en, fr, pt };

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return DICTIONARIES[locale];
}

/** Fills `{placeholders}` in a translated string, e.g. formatMessage(t.welcome, { name: "Amara" }). */
export function formatMessage(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}
