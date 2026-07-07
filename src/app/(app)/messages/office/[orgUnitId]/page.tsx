import { notFound } from "next/navigation";
import { getCurrentProfile, getOfficeMessages, getOrgUnits, getStaffDirectory } from "@/lib/data";
import { ChatPanel } from "@/components/chat-panel";
import { postOfficeMessage } from "../../actions";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function OfficeChannelPage({ params }: { params: Promise<{ orgUnitId: string }> }) {
  const { orgUnitId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const dict = await getDictionary();
  const [orgUnits, messages, staff] = await Promise.all([getOrgUnits(), getOfficeMessages(orgUnitId), getStaffDirectory()]);
  const orgUnit = orgUnits.find((ou) => ou.id === orgUnitId);
  if (!orgUnit) notFound();

  const staffById = new Map(staff.map((s) => [s.id, s]));

  return (
    <ChatPanel
      title={`# ${orgUnit.name}`}
      avatarName={orgUnit.name}
      avatarShape="square"
      messages={messages}
      staffById={staffById}
      currentUserId={profile.id}
      action={postOfficeMessage}
      hiddenFieldName="org_unit_id"
      hiddenFieldValue={orgUnitId}
      placeholder={dict.messages.messageOfficePlaceholder}
      noMessagesYet={dict.messages.noMessagesYet}
      unknownSender={dict.documentDetail.unknownPerson}
      sendLabel={dict.common.send}
    />
  );
}
