import { createClient } from "@/lib/supabase/server";
import { getUserSupplements } from "@/lib/supplements";
import { SupplementsEditor } from "@/components/supplements-editor";

export default async function SupplementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const supplements = user
    ? await getUserSupplements(supabase, user.id)
    : [];

  return <SupplementsEditor supplements={supplements} />;
}
