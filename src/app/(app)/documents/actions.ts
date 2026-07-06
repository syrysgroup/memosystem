"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findDocumentByReferenceCode, getCurrentProfile } from "@/lib/data";
import type { AttachmentKind, DocumentStatus } from "@/lib/supabase/types";

export async function trackDocument(formData: FormData) {
  const code = String(formData.get("reference_code") ?? "").trim();
  if (!code) redirect("/dashboard");

  const document = await findDocumentByReferenceCode(code);
  if (!document) {
    redirect(`/dashboard?notfound=${encodeURIComponent(code)}`);
  }
  redirect(`/documents/${document.id}`);
}

export async function createDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentTypeId = String(formData.get("document_type_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const hasPhysicalCopy = formData.get("has_physical_copy") === "on";

  if (!documentTypeId || !title) {
    throw new Error("Document type and title are required");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({
      document_type_id: documentTypeId,
      title,
      summary,
      origin_org_unit_id: profile.org_unit_id,
      current_org_unit_id: profile.org_unit_id,
      created_by: profile.id,
      has_physical_copy: hasPhysicalCopy,
    })
    .select("id")
    .single();

  if (error) throw error;
  redirect(`/documents/${data.id}`);
}

export async function routeDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentId = String(formData.get("document_id") ?? "");
  const toOrgUnitId = String(formData.get("to_org_unit_id") ?? "");
  const mode = String(formData.get("mode") ?? "digital") as "digital" | "physical" | "both";
  const remarks = String(formData.get("remarks") ?? "").trim() || null;

  if (!documentId || !toOrgUnitId) {
    throw new Error("Destination office is required");
  }

  const supabase = await createClient();
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("current_org_unit_id")
    .eq("id", documentId)
    .single();
  if (docError) throw docError;

  const { error } = await supabase.from("document_movements").insert({
    document_id: documentId,
    from_org_unit_id: document.current_org_unit_id,
    to_org_unit_id: toOrgUnitId,
    mode,
    sent_by: profile.id,
    remarks,
  });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function updateDocumentStatus(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const status = String(formData.get("status") ?? "") as DocumentStatus;
  if (!documentId || !status) throw new Error("Missing document or status");

  const supabase = await createClient();
  const { error } = await supabase.from("documents").update({ status }).eq("id", documentId);
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function uploadAttachment(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentId = String(formData.get("document_id") ?? "");
  const kind = String(formData.get("kind") ?? "other") as AttachmentKind;
  const file = formData.get("file") as File | null;
  if (!documentId || !file || file.size === 0) {
    throw new Error("A file is required");
  }

  const supabase = await createClient();
  const storagePath = `${documentId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("document-attachments")
    .upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("document_attachments").insert({
    document_id: documentId,
    storage_path: storagePath,
    file_name: file.name,
    kind,
    uploaded_by: profile.id,
  });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function acknowledgeMovement(formData: FormData) {
  const movementId = String(formData.get("movement_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("document_movements")
    .update({ received_by: profile.id, received_at: new Date().toISOString() })
    .eq("id", movementId);
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function addDocumentComment(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentId = String(formData.get("document_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!documentId || !body) throw new Error("A comment body is required");

  const supabase = await createClient();
  const { error } = await supabase.from("document_comments").insert({
    document_id: documentId,
    author_id: profile.id,
    body,
  });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function shareDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentId = String(formData.get("document_id") ?? "");
  const sharedWithUserId = String(formData.get("shared_with_user_id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!documentId || !sharedWithUserId) throw new Error("Choose a colleague to share with");
  if (sharedWithUserId === profile.id) throw new Error("Choose someone other than yourself");

  const supabase = await createClient();
  const { error } = await supabase.from("document_shares").insert({
    document_id: documentId,
    shared_by: profile.id,
    shared_with_user_id: sharedWithUserId,
    note,
  });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function markShareRead(formData: FormData) {
  const shareId = String(formData.get("share_id") ?? "");
  const documentId = String(formData.get("document_id") ?? "");
  if (!shareId) throw new Error("Missing share");

  const supabase = await createClient();
  const { error } = await supabase
    .from("document_shares")
    .update({ read_at: new Date().toISOString() })
    .eq("id", shareId);
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/dashboard");
}
