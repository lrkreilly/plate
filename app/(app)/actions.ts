"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { nzDateString } from "@/lib/time";

export async function toggleSupplement(
  supplementId: string,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const date = nzDateString();

  const { data: existing } = await supabase
    .from("supplement_logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("supplement_id", supplementId)
    .eq("date", date)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("supplement_logs").delete().eq("id", existing.id)
    : await supabase
        .from("supplement_logs")
        .insert({ user_id: user.id, supplement_id: supplementId, date });

  if (error) return { ok: false };

  revalidatePath("/");
  return { ok: true };
}
