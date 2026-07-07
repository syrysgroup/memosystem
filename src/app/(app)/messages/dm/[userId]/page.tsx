import { notFound } from "next/navigation";
import { getCurrentProfile, getDirectMessages, getStaffDirectory } from "@/lib/data";
import { MessageThread } from "@/components/message-thread";
import { postDirectMessage } from "../../actions";

export default async function DirectMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const staff = await getStaffDirectory();
  const other = staff.find((s) => s.id === userId);
  if (!other) notFound();

  const messages = await getDirectMessages(profile.id, userId);
  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink">{other.full_name}</h1>
      <MessageThread messages={messages} staffById={staffById} currentUserId={profile.id} />
      <form action={postDirectMessage} className="flex gap-2">
        <input type="hidden" name="recipient_id" value={userId} />
        <input
          name="body"
          required
          placeholder={`Message ${other.full_name}…`}
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
          Send
        </button>
      </form>
    </div>
  );
}
