import { IconChat } from "@/components/icons";

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-paper text-center text-ink-muted">
      <IconChat className="mb-3 h-12 w-12 opacity-40" />
      <p className="text-sm">Select a conversation to start messaging.</p>
    </div>
  );
}
