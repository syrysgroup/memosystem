"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export async function issueGrant(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const granteeProfileId = String(formData.get("grantee_profile_id") ?? "");
  const auditPeriodStart = String(formData.get("audit_period_start") ?? "");
  const auditPeriodEnd = String(formData.get("audit_period_end") ?? "");
  const lengthDays = Number(formData.get("length_days") ?? 30);
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!granteeProfileId || !auditPeriodStart || !auditPeriodEnd || !lengthDays) {
    throw new Error("Grantee, audited period, and grant length are required");
  }
  if (lengthDays > 90) throw new Error("A single grant cannot exceed 90 days");

  const expiresAt = new Date(Date.now() + lengthDays * 24 * 60 * 60 * 1000).toISOString();

  const supabase = await createClient();
  const { error } = await supabase.from("grants").insert({
    grantee_profile_id: granteeProfileId,
    audit_period_start: auditPeriodStart,
    audit_period_end: auditPeriodEnd,
    expires_at: expiresAt,
    original_length_days: lengthDays,
    issued_by: profile.id,
    reason,
  });
  if (error) throw error;

  revalidatePath("/audit-grants");
}

export async function extendGrant(formData: FormData) {
  const grantId = String(formData.get("grant_id") ?? "");
  if (!grantId) throw new Error("Missing grant");

  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_auto_extend", { p_grant_id: grantId });
  if (error) throw error;

  revalidatePath("/audit-grants");
}

export async function revokeGrant(formData: FormData) {
  const grantId = String(formData.get("grant_id") ?? "");
  if (!grantId) throw new Error("Missing grant");

  const supabase = await createClient();
  const { error } = await supabase.from("grants").update({ status: "revoked" }).eq("id", grantId);
  if (error) throw error;

  revalidatePath("/audit-grants");
}
