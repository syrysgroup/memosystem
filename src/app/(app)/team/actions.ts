"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";

export async function setLeaveStatus(formData: FormData) {
  const userId = String(formData.get("user_id") ?? "");
  const onLeave = formData.get("on_leave") === "on";
  const leaveStart = String(formData.get("leave_start") ?? "") || null;
  const leaveEnd = String(formData.get("leave_end") ?? "") || null;
  if (!userId) throw new Error("Missing user");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ on_leave: onLeave, leave_start: leaveStart, leave_end: leaveEnd })
    .eq("id", userId);
  if (error) throw error;

  revalidatePath("/team");
}

export async function assignDelegation(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const absentUserId = String(formData.get("absent_user_id") ?? "");
  const delegateUserId = String(formData.get("delegate_user_id") ?? "");
  const orgUnitId = String(formData.get("org_unit_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");

  if (!absentUserId || !delegateUserId || !orgUnitId || !startDate || !endDate) {
    throw new Error("All fields are required");
  }
  if (absentUserId === delegateUserId) {
    throw new Error("The delegate must be a different person");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("delegations").insert({
    absent_user_id: absentUserId,
    delegate_user_id: delegateUserId,
    org_unit_id: orgUnitId,
    start_date: startDate,
    end_date: endDate,
    created_by: profile.id,
    status: "active",
  });
  if (error) throw error;

  revalidatePath("/team");
}

export async function endDelegation(formData: FormData) {
  const delegationId = String(formData.get("delegation_id") ?? "");
  if (!delegationId) throw new Error("Missing delegation");

  const supabase = await createClient();
  const { error } = await supabase
    .from("delegations")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("id", delegationId);
  if (error) throw error;

  revalidatePath("/team");
}
