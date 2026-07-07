import { notFound } from "next/navigation";
import { getCurrentProfile, getOfficeMessages, getOrgUnits, getStaffDirectory } from "@/lib/data";
import { MessageThread } from "@/components/message-thread";
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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-ink"># {orgUnit.name}</h1>
      <MessageThread messages={messages} staffById={staffById} currentUserId={profile.id} />
      <form action={postOfficeMessage} className="flex gap-2">
        <input type="hidden" name="org_unit_id" value={orgUnitId} />
        <input
          name="body"
          required
          placeholder="Message your office…"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-ecowas-green px-4 py-2 text-sm font-medium text-white">
          Send
        </button>
      </form>
    </div>
  );
}
