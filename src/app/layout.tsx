import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { getLocale } from "@/lib/i18n/get-dictionary";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ECOWAS Memo & Document Tracking System",
  description: "Institutional memo, correspondence, and document movement tracking",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
