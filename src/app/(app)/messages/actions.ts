"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export async function postOfficeMessage(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const orgUnitId = String(formData.get("org_unit_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!orgUnitId || !body) throw new Error("Message body is required");

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    org_unit_id: orgUnitId,
    sender_id: profile.id,
    body,
  });
  if (error) throw error;

  revalidatePath(`/messages/office/${orgUnitId}`);
  redirect(`/messages/office/${orgUnitId}`);
}

export async function postDirectMessage(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const recipientId = String(formData.get("recipient_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!recipientId || !body) throw new Error("Message body is required");

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    recipient_id: recipientId,
    sender_id: profile.id,
    body,
  });
  if (error) throw error;

  revalidatePath(`/messages/dm/${recipientId}`);
  redirect(`/messages/dm/${recipientId}`);
}
