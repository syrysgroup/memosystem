import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

export async function getOrgUnits() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("org_units").select("*").order("name");
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

export async function getOfficeDocuments(orgUnitId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents_with_status")
    .select("*")
    .eq("current_org_unit_id", orgUnitId)
    .order("last_moved_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function findDocumentByReferenceCode(referenceCode: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents_with_status")
    .select("*")
    .eq("reference_code", referenceCode.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDocumentDetail(documentId: string) {
  const supabase = await createClient();
  const [{ data: document, error: docError }, { data: movements, error: movError }, { data: externalMeta }, { data: attachments }] =
    await Promise.all([
      supabase.from("documents_with_status").select("*").eq("id", documentId).single(),
      supabase
        .from("document_movements")
        .select("*")
        .eq("document_id", documentId)
        .order("sent_at", { ascending: false }),
      supabase.from("document_external_meta").select("*").eq("document_id", documentId).maybeSingle(),
      supabase.from("document_attachments").select("*").eq("document_id", documentId).order("uploaded_at"),
    ]);
  if (docError) throw docError;
  if (movError) throw movError;
  return { document, movements: movements ?? [], externalMeta, attachments: attachments ?? [] };
}

export async function getAttachmentUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("document-attachments")
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

export async function getTeamMembers(rootOrgUnitId: string) {
  const supabase = await createClient();
  const { data: descendants, error: descError } = await supabase.rpc("org_unit_descendants", {
    root: rootOrgUnitId,
  });
  if (descError) throw descError;

  const ids = (descendants ?? []).map((d: { id: string }) => d.id);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("org_unit_id", ids)
    .order("full_name");
  if (error) throw error;
  return data;
}

export async function getActiveDelegationsForUnits(orgUnitIds: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delegations")
    .select("*")
    .in("org_unit_id", orgUnitIds)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getChannelOrgUnits(rootOrgUnitId: string) {
  const supabase = await createClient();
  const { data: descendants, error: descError } = await supabase.rpc("org_unit_descendants", {
    root: rootOrgUnitId,
  });
  if (descError) throw descError;

  const ids = (descendants ?? []).map((d: { id: string }) => d.id);
  const { data, error } = await supabase.from("org_units").select("*").in("id", ids).order("name");
  if (error) throw error;
  return data;
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

export async function getDocumentComments(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_comments")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getDocumentShares(documentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_shares")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSharesSharedWithMe(userId: string) {
  const supabase = await createClient();
  const { data: shares, error } = await supabase
    .from("document_shares")
    .select("*")
    .eq("shared_with_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  if (shares.length === 0) return [];

  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, reference_code, title")
    .in(
      "id",
      shares.map((s) => s.document_id)
    );
  if (docsError) throw docsError;

  const docsById = new Map(docs.map((d) => [d.id, d]));
  return shares.map((s) => ({ ...s, document: docsById.get(s.document_id) }));
}
