"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import type { PositionRole } from "@/lib/supabase/types";

export async function createPosition(formData: FormData) {
  const orgUnitId = String(formData.get("org_unit_id") ?? "");
  const profileId = String(formData.get("profile_id") ?? "");
  const role = String(formData.get("role") ?? "") as PositionRole;
  if (!orgUnitId || !profileId || !role) throw new Error("Office, person, and role are required");

  const supabase = await createClient();
  const { error } = await supabase.from("positions").insert({ org_unit_id: orgUnitId, profile_id: profileId, role });
  if (error) throw error;

  revalidatePath("/team");
}

export async function endPosition(formData: FormData) {
  const positionId = String(formData.get("position_id") ?? "");
  if (!positionId) throw new Error("Missing position");

  const supabase = await createClient();
  const { error } = await supabase
    .from("positions")
    .update({ end_date: new Date().toISOString().slice(0, 10) })
    .eq("id", positionId);
  if (error) throw error;

  revalidatePath("/team");
}

export async function setLeaveStatus(formData: FormData) {
  const profileId = String(formData.get("profile_id") ?? "");
  const onLeave = formData.get("on_leave") === "on";
  const leaveStart = String(formData.get("leave_start") ?? "") || null;
  const leaveEnd = String(formData.get("leave_end") ?? "") || null;
  if (!profileId) throw new Error("Missing profile");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ on_leave: onLeave, leave_start: leaveStart, leave_end: leaveEnd })
    .eq("id", profileId);
  if (error) throw error;

  revalidatePath("/team");
}

export async function assignDelegation(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const originalPositionId = String(formData.get("original_position_id") ?? "");
  const delegatePositionId = String(formData.get("delegate_position_id") ?? "");
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "");
  if (!originalPositionId || !delegatePositionId || !startDate || !endDate) {
    throw new Error("All fields are required");
  }
  if (originalPositionId === delegatePositionId) throw new Error("The delegate must be a different position");

  const supabase = await createClient();
  const { error } = await supabase.from("delegations").insert({
    original_position_id: originalPositionId,
    delegate_position_id: delegatePositionId,
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
