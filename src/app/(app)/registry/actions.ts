"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import type { CorrespondenceChannel } from "@/lib/supabase/types";

async function findRegistryOrgUnitId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.from("org_units").select("id").eq("is_registry", true).single();
  if (error) throw new Error("No office is marked as the registry yet — ask an admin to set one.");
  return data.id as string;
}

export async function logIncomingLetter(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const correspondentName = String(formData.get("correspondent_name") ?? "").trim() || null;
  const correspondentOrg = String(formData.get("correspondent_organization") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;
  const channel = String(formData.get("channel") ?? "physical") as CorrespondenceChannel;
  const destinationOrgUnitId = String(formData.get("destination_org_unit_id") ?? "") || null;
  const file = formData.get("file") as File | null;

  if (!title) throw new Error("Title is required");

  const supabase = await createClient();
  const registryOrgUnitId = await findRegistryOrgUnitId(supabase);

  const { data: docType, error: typeError } = await supabase
    .from("document_types")
    .select("id")
    .eq("code_prefix", "LTR-IN")
    .single();
  if (typeError) throw typeError;

  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({
      document_type_id: docType.id,
      title,
      summary,
      origin_org_unit_id: registryOrgUnitId,
      current_org_unit_id: registryOrgUnitId,
      created_by: profile.id,
      has_physical_copy: channel === "physical" || channel === "courier",
    })
    .select("id")
    .single();
  if (docError) throw docError;

  const { error: metaError } = await supabase.from("document_external_meta").insert({
    document_id: document.id,
    direction: "incoming",
    channel,
    correspondent_name: correspondentName,
    correspondent_organization: correspondentOrg,
    contact_email: contactEmail,
    contact_phone: contactPhone,
  });
  if (metaError) throw metaError;

  if (file && file.size > 0) {
    const storagePath = `${document.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("document-attachments").upload(storagePath, file);
    if (!uploadError) {
      await supabase.from("document_attachments").insert({
        document_id: document.id,
        storage_path: storagePath,
        file_name: file.name,
        kind: "scan",
        uploaded_by: profile.id,
      });
    }
  }

  if (destinationOrgUnitId && destinationOrgUnitId !== registryOrgUnitId) {
    await supabase.from("document_movements").insert({
      document_id: document.id,
      from_org_unit_id: registryOrgUnitId,
      to_org_unit_id: destinationOrgUnitId,
      mode: channel === "email" ? "digital" : "both",
      sent_by: profile.id,
      remarks: "Routed by Registry on intake",
    });
  }

  redirect(`/documents/${document.id}`);
}

export async function recordDispatchAcknowledgment(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const referenceCode = String(formData.get("reference_code") ?? "").trim();
  const channel = String(formData.get("channel") ?? "courier") as CorrespondenceChannel;
  const correspondentName = String(formData.get("correspondent_name") ?? "").trim() || null;
  const correspondentOrg = String(formData.get("correspondent_organization") ?? "").trim() || null;
  const file = formData.get("file") as File | null;
  if (!referenceCode) throw new Error("Document reference code is required");

  const supabase = await createClient();
  const { data: matchedDoc, error: matchError } = await supabase
    .from("documents")
    .select("id")
    .eq("reference_code", referenceCode)
    .single();
  if (matchError || !matchedDoc) throw new Error(`No document found for reference code "${referenceCode}"`);
  const documentId = matchedDoc.id;

  let ackScanPath: string | null = null;
  if (file && file.size > 0) {
    const storagePath = `${documentId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("document-attachments").upload(storagePath, file);
    if (!uploadError) {
      ackScanPath = storagePath;
      await supabase.from("document_attachments").insert({
        document_id: documentId,
        storage_path: storagePath,
        file_name: file.name,
        kind: "acknowledgment",
        uploaded_by: profile.id,
      });
    }
  }

  const { error } = await supabase.from("document_external_meta").upsert({
    document_id: documentId,
    direction: "outgoing",
    channel,
    correspondent_name: correspondentName,
    correspondent_organization: correspondentOrg,
    dispatch_ack_received: true,
    dispatch_ack_received_at: new Date().toISOString(),
    ...(ackScanPath ? { dispatch_ack_scan_path: ackScanPath } : {}),
  });
  if (error) throw error;

  await supabase.from("documents").update({ status: "dispatched" }).eq("id", documentId);

  revalidatePath("/registry");
  revalidatePath(`/documents/${documentId}`);
  redirect(`/documents/${documentId}`);
}
