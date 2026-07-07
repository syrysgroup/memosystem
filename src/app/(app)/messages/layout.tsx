import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getMyChannelOrgUnitIds,
  getOrgUnits,
  getStaffDirectory,
  getConversationPreviews,
} from "@/lib/data";
import { ConversationList } from "@/components/conversation-list";

function formatPreviewTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default async function MessagesLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const [channelIds, orgUnits, staff] = await Promise.all([
    getMyChannelOrgUnitIds(profile.id),
    getOrgUnits(),
    getStaffDirectory(),
  ]);
  const { channelPreview, dmPreview } = await getConversationPreviews(profile.id, channelIds);

  const channels = orgUnits
    .filter((ou) => channelIds.includes(ou.id))
    .map((ou) => {
      const preview = channelPreview.get(ou.id);
      return {
        id: ou.id,
        name: ou.name,
        preview: preview?.body,
        time: preview ? formatPreviewTime(preview.created_at) : undefined,
        sortKey: preview?.created_at ?? "",
      };
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const dms = staff
    .filter((s) => s.id !== profile.id)
    .map((s) => {
      const preview = dmPreview.get(s.id);
      return {
        id: s.id,
        name: s.full_name,
        preview: preview?.body,
        time: preview ? formatPreviewTime(preview.created_at) : undefined,
        sortKey: preview?.created_at ?? "",
      };
    })
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border border-border">
      <ConversationList channels={channels} dms={dms} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
