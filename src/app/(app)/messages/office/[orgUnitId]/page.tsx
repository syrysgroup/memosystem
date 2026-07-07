import { notFound } from "next/navigation";
import { getCurrentProfile, getOfficeMessages, getOrgUnits, getStaffDirectory } from "@/lib/data";
import { ChatPanel } from "@/components/chat-panel";
import { postOfficeMessage } from "../../actions";

export default async function OfficeChannelPage({ params }: { params: Promise<{ orgUnitId: string }> }) {
  const { orgUnitId } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return null;

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
      placeholder="Message your office…"
    />
  );
}
