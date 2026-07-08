"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import type { Profile } from "@/lib/supabase/types";

export async function updateMyProfile(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const phoneNumber = String(formData.get("phone_number") ?? "").trim() || null;
  const nationality = String(formData.get("nationality") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const dateOfAppointment = String(formData.get("date_of_appointment") ?? "") || null;
  const file = formData.get("avatar") as File | null;

  const supabase = await createClient();

  const update: Partial<Profile> = {
    phone_number: phoneNumber,
    nationality,
    bio,
    date_of_appointment: dateOfAppointment,
  };

  if (file && file.size > 0) {
    const storagePath = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(storagePath, file, { upsert: true });
    if (uploadError) throw uploadError;
    update.avatar_path = storagePath;
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", profile.id);
  if (error) throw error;

  revalidatePath("/profile");
  revalidatePath("/directory");
  redirect("/profile?saved=1");
}
