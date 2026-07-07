import { notFound } from "next/navigation";
import { getCurrentProfile, getDirectMessages, getStaffDirectory } from "@/lib/data";
import { ChatPanel } from "@/components/chat-panel";
import { postDirectMessage } from "../../actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function DirectMessagePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const staff = await getStaffDirectory();
  const other = staff.find((s) => s.id === userId);
  if (!other) notFound();

  const messages = await getDirectMessages(profile.id, userId);
  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <ChatPanel
      title={other.full_name}
      messages={messages}
      staffById={staffById}
      currentUserId={profile.id}
      action={postDirectMessage}
      hiddenFieldName="recipient_id"
      hiddenFieldValue={userId}
      placeholder={dict.messages.messageUserPlaceholder.replace("{name}", other.full_name)}
      noMessagesYet={dict.messages.noMessagesYet}
      unknownSender={dict.documentDetail.unknownPerson}
      sendLabel={dict.common.send}
    />
  );
}
