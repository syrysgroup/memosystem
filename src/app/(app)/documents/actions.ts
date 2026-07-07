"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findDocumentByCode, getCurrentProfile } from "@/lib/data";
import type {
  DecisionStatus,
  DeliveryFailureReason,
  DigitalStatus,
  PhysicalStatus,
} from "@/lib/supabase/types";

export async function trackDocument(formData: FormData) {
  const code = String(formData.get("unique_code") ?? "").trim();
  if (!code) redirect("/dashboard");

  const document = await findDocumentByCode(code);
  if (!document) {
    redirect(`/dashboard?notfound=${encodeURIComponent(code)}`);
  }
  redirect(`/documents/${document.id}`);
}

export async function createDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentTypeId = String(formData.get("document_type_id") ?? "");
  const originatingPositionId = String(formData.get("originating_position_id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;

  if (!documentTypeId || !originatingPositionId || !subject) {
    throw new Error("Document type, originating position, and subject are required");
  }

  const supabase = await createClient();
  // No RETURNING here on purpose: RLS's SELECT policy for documents
  // (has_document_chain_access) queries `documents` itself, and a STABLE
  // function evaluated as part of the same INSERT statement's implicit
  // RETURNING check only sees the pre-statement snapshot — it can't see the
  // row this very statement is creating. Insert with a known id, then let
  // the detail page's own (later, separate) request fetch it fresh.
  const id = randomUUID();
  const { error } = await supabase.from("documents").insert({
    id,
    document_type_id: documentTypeId,
    originating_position_id: originatingPositionId,
    subject,
    summary,
  });
  if (error) throw error;

  redirect(`/documents/${id}`);
}

export async function routeDigital(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const digitalStatus = String(formData.get("digital_status") ?? "") as DigitalStatus;
  const toPositionId = String(formData.get("to_position_id") ?? "");
  if (!documentId || !digitalStatus || !toPositionId) {
    throw new Error("Status and destination position are required");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ digital_status: digitalStatus, current_digital_custodian_id: toPositionId })
    .eq("id", documentId);
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function routePhysical(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const physicalStatus = String(formData.get("physical_status") ?? "") as PhysicalStatus;
  const toPositionId = String(formData.get("to_position_id") ?? "");
  const failureReason = (String(formData.get("physical_failure_reason") ?? "") || null) as DeliveryFailureReason | null;
  const failureNote = String(formData.get("physical_failure_note") ?? "").trim() || null;

  if (!documentId || !physicalStatus || !toPositionId) {
    throw new Error("Status and destination position are required");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      physical_status: physicalStatus,
      current_physical_custodian_id: toPositionId,
      physical_failure_reason: physicalStatus === "delivery_failed" ? failureReason : null,
      physical_failure_note: physicalStatus === "delivery_failed" ? failureNote : null,
    })
    .eq("id", documentId);
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function makeDecision(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const decisionStatus = String(formData.get("decision_status") ?? "") as DecisionStatus;
  const decisionSummary = String(formData.get("decision_summary") ?? "").trim();
  const decisionNumber = String(formData.get("decision_number") ?? "").trim() || null;

  if (!documentId || !decisionStatus || !decisionSummary) {
    throw new Error("Decision outcome and summary are required");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ decision_status: decisionStatus, decision_summary: decisionSummary, decision_number: decisionNumber })
    .eq("id", documentId);
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function addMinute(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const authorPositionId = String(formData.get("author_position_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!documentId || !authorPositionId || !content) throw new Error("A minute body is required");

  const supabase = await createClient();
  const { error } = await supabase.from("minutes").insert({
    document_id: documentId,
    author_position_id: authorPositionId,
    content,
  });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function uploadAttachment(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const documentId = String(formData.get("document_id") ?? "");
  const kind = String(formData.get("kind") ?? "other");
  const file = formData.get("file") as File | null;
  if (!documentId || !file || file.size === 0) throw new Error("A file is required");

  const supabase = await createClient();
  const storagePath = `${documentId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("document-attachments").upload(storagePath, file);
  if (uploadError) throw uploadError;

  const { error } = await supabase.from("document_attachments").insert({
    document_id: documentId,
    storage_path: storagePath,
    file_name: file.name,
    kind: kind as never,
    uploaded_by: profile.id,
  });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}

export async function supersedeCircular(formData: FormData) {
  const documentId = String(formData.get("document_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!documentId || !reason) throw new Error("A reason is required");

  const supabase = await createClient();
  const { error } = await supabase.rpc("supersede_circular", { p_document_id: documentId, p_reason: reason });
  if (error) throw error;

  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}
