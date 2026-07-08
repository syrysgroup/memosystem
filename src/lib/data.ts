import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Message } from "@/lib/supabase/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function getMyActivePositions(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("profile_id", profileId)
    .is("end_date", null);
  if (error) throw error;
  return data;
}

export async function getOrgUnits(currentOnly = true) {
  const supabase = await createClient();
  let query = supabase.from("org_units").select("*").order("name");
  if (currentOnly) query = query.is("effective_to", null);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPositionTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("position_types")
    .select("*")
    .is("effective_to", null)
    .order("title");
  if (error) throw error;
  return data;
}

export async function getDocumentTypes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_types")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data;
}

export async function getMyQueueDocuments(positionIds: string[]) {
  if (positionIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents_with_status")
    .select("*")
    .or(
      `current_digital_custodian_id.in.(${positionIds.join(",")}),current_physical_custodian_id.in.(${positionIds.join(",")})`
    )
    .order("days_in_office", { ascending: false });
  if (error) throw error;
  return data;
}

export async function findDocumentByCode(uniqueCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents_with_status")
    .select("*")
    .eq("unique_code", uniqueCode.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function decodeUniqueCodeOrigin(uniqueCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decode_unique_code_origin", {
    p_unique_code: uniqueCode.trim(),
  });
  if (error) throw error;
  return data as string | null;
}

export async function getDocumentDetail(documentId: string) {
  const supabase = await createClient();
  const [{ data: document, error: docError }, { data: movements, error: movError }, { data: minutes, error: minError }, { data: attachments }] =
    await Promise.all([
      supabase.from("documents_with_status").select("*").eq("id", documentId).single(),
      supabase.from("movement_events").select("*").eq("document_id", documentId).order("occurred_at", { ascending: false }),
      supabase.from("minutes").select("*").eq("document_id", documentId).order("created_at", { ascending: true }),
      supabase.from("document_attachments").select("*").eq("document_id", documentId).order("uploaded_at"),
    ]);
  if (docError) throw docError;
  if (movError) throw movError;
  if (minError) throw minError;
  return { document, movements: movements ?? [], minutes: minutes ?? [], attachments: attachments ?? [] };
}

export async function getAttachmentUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("document-attachments")
    .createSignedUrl(storagePath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

export async function getAvatarUrl(storagePath: string | null) {
  if (!storagePath) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("profile-photos")
    .createSignedUrl(storagePath, 60 * 10);
  if (error) return null;
  return data.signedUrl;
}

export async function getStaffDirectory() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function getAllPositions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .order("start_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getActivePositionsForOrgUnits(orgUnitIds: string[]) {
  if (orgUnitIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .in("org_unit_id", orgUnitIds)
    .is("end_date", null);
  if (error) throw error;
  return data;
}

export async function getOrgUnitDescendantIds(rootOrgUnitId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("org_unit_descendants", { root: rootOrgUnitId });
  if (error) throw error;
  return (data ?? []).map((d) => d.id);
}

export async function getActiveDelegationsAsDelegate(delegatePositionIds: string[]) {
  if (delegatePositionIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delegations")
    .select("*")
    .in("delegate_position_id", delegatePositionIds)
    .eq("status", "active");
  if (error) throw error;
  return data;
}

export async function getPositionsByIds(positionIds: string[]) {
  const ids = [...new Set(positionIds)].filter(Boolean);
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("positions").select("*").in("id", ids);
  if (error) throw error;
  return data;
}

export async function getProfilesByIds(profileIds: string[]) {
  const ids = [...new Set(profileIds)].filter(Boolean);
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  return data;
}

export async function getDocumentType(documentTypeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("document_types").select("*").eq("id", documentTypeId).single();
  if (error) throw error;
  return data;
}

export async function getActiveDelegationsForPositions(positionIds: string[]) {
  if (positionIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delegations")
    .select("*")
    .in("original_position_id", positionIds)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getGrantsForGrantee(profileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grants")
    .select("*")
    .eq("grantee_profile_id", profileId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllGrants() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("grants").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getReportingLineSummary(rootOrgUnitId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reporting_line_summary", { root_org_unit_id: rootOrgUnitId });
  if (error) throw error;
  return data ?? [];
}

export async function getReportingLineDrilldown(rootOrgUnitId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reporting_line_drilldown", { root_org_unit_id: rootOrgUnitId });
  if (error) throw error;
  return data ?? [];
}

// Channels a profile currently belongs to: every org unit they hold a
// current position in, plus (for head/office_manager positions) every
// descendant org unit in the current organogram — mirrors is_channel_member.
export async function getMyChannelOrgUnitIds(profileId: string) {
  const positions = await getMyActivePositions(profileId);
  const idSets = await Promise.all(
    positions.map((p) =>
      p.role === "head" || p.role === "office_manager" ? getOrgUnitDescendantIds(p.org_unit_id) : Promise.resolve([p.org_unit_id])
    )
  );
  return [...new Set(idSets.flat())];
}

export async function getOfficeMessages(orgUnitId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("org_unit_id", orgUnitId)
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data;
}

export async function getDirectMessages(userId: string, otherUserId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .is("org_unit_id", null)
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw error;
  return data;
}

// Latest message per office channel and per DM contact, for the WhatsApp-style
// conversation list (preview text + recency sort). Reduced client-side since
// PostgREST doesn't do "distinct on" via the JS client.
export async function getConversationPreviews(profileId: string, channelOrgUnitIds: string[]) {
  const supabase = await createClient();

  const [{ data: channelMsgs, error: chErr }, { data: dmMsgs, error: dmErr }] = await Promise.all([
    channelOrgUnitIds.length > 0
      ? supabase
          .from("messages")
          .select("*")
          .in("org_unit_id", channelOrgUnitIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("messages")
      .select("*")
      .is("org_unit_id", null)
      .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`)
      .order("created_at", { ascending: false }),
  ]);
  if (chErr) throw chErr;
  if (dmErr) throw dmErr;

  const channelPreview = new Map<string, Message>();
  for (const m of channelMsgs ?? []) {
    if (m.org_unit_id && !channelPreview.has(m.org_unit_id)) channelPreview.set(m.org_unit_id, m);
  }

  const dmPreview = new Map<string, Message>();
  for (const m of dmMsgs ?? []) {
    const otherId = m.sender_id === profileId ? m.recipient_id : m.sender_id;
    if (otherId && !dmPreview.has(otherId)) dmPreview.set(otherId, m);
  }

  return { channelPreview, dmPreview };
}
