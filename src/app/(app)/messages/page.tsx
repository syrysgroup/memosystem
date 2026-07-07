import { IconChat } from "@/components/icons";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function MessagesIndexPage() {
  const dict = await getDictionary();
  return (
    <div className="flex h-full flex-col items-center justify-center bg-paper text-center text-ink-muted">
      <IconChat className="mb-3 h-12 w-12 opacity-40" />
      <p className="text-sm">{dict.messages.selectConversation}</p>
    </div>
  );
}
