"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function nullableTime(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function addSupplement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const name = String(formData.get("name") ?? "").trim();
  const dose = String(formData.get("dose") ?? "").trim();
  if (!name || !dose) return { ok: false };

  const { data: last } = await supabase
    .from("supplements")
    .select("display_order")
    .eq("user_id", user.id)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("supplements").insert({
    user_id: user.id,
    name,
    dose,
    schedule: String(formData.get("schedule") ?? "anytime"),
    notification_time: nullableTime(formData.get("notification_time")),
    notes: String(formData.get("notes") ?? "").trim() || null,
    display_order: (last?.display_order ?? 0) + 1,
  });

  if (error) {
    console.error("addSupplement:", error.message);
    return { ok: false };
  }
  revalidatePath("/supplements");
  revalidatePath("/");
  return { ok: true };
}

export async function updateSupplement(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplements")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      dose: String(formData.get("dose") ?? "").trim(),
      schedule: String(formData.get("schedule") ?? "anytime"),
      notification_time: nullableTime(formData.get("notification_time")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) {
    console.error("updateSupplement:", error.message);
    return { ok: false };
  }
  revalidatePath("/supplements");
  revalidatePath("/");
  return { ok: true };
}

export async function setSupplementEnabled(id: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("supplements")
    .update({ enabled })
    .eq("id", id);
  if (error) {
    console.error("setSupplementEnabled:", error.message);
    return { ok: false };
  }
  revalidatePath("/supplements");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSupplement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("supplements").delete().eq("id", id);
  if (error) {
    console.error("deleteSupplement:", error.message);
    return { ok: false };
  }
  revalidatePath("/supplements");
  revalidatePath("/");
  return { ok: true };
}
