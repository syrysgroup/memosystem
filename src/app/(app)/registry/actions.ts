"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export async function logIncomingLetter(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const originatingPositionId = String(formData.get("originating_position_id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const correspondentName = String(formData.get("correspondent_name") ?? "").trim();
  const correspondentOrg = String(formData.get("correspondent_organization") ?? "").trim();
  const file = formData.get("file") as File | null;
  if (!originatingPositionId || !subject) throw new Error("Subject and originating position are required");

  const summary = [correspondentName && `From: ${correspondentName}`, correspondentOrg && `(${correspondentOrg})`]
    .filter(Boolean)
    .join(" ");

  const supabase = await createClient();
  const { data: docType, error: typeError } = await supabase
    .from("document_types")
    .select("id")
    .eq("code", "LTR-IN")
    .single();
  if (typeError) throw typeError;

  const id = randomUUID();
  const { error } = await supabase.from("documents").insert({
    id,
    document_type_id: docType.id,
    originating_position_id: originatingPositionId,
    subject,
    summary: summary || null,
  });
  if (error) throw error;

  if (file && file.size > 0) {
    const storagePath = `${id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("document-attachments").upload(storagePath, file);
    if (!uploadError) {
      await supabase.from("document_attachments").insert({
        document_id: id,
        storage_path: storagePath,
        file_name: file.name,
        kind: "scan",
        uploaded_by: profile.id,
      });
    }
  }

  redirect(`/documents/${id}`);
}
