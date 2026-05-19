import { TabBar } from "@/components/tab-bar";
import { SettingsDrawer } from "@/components/settings-drawer";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-30 flex justify-end px-2 pt-[env(safe-area-inset-top)]">
        <div className="p-2">
          <SettingsDrawer email={user?.email ?? null} />
        </div>
      </header>
      <main className="flex-1 px-4 pb-24">{children}</main>
      <TabBar />
    </div>
  );
}
