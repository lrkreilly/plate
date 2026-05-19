import { createClient } from "@/lib/supabase/server";
import { getStats, type DinnerStat } from "@/lib/stats";
import { cn } from "@/lib/utils";

const TAG_BG: Record<string, string> = {
  steak: "bg-tag-steak",
  chicken: "bg-tag-chicken",
  salmon: "bg-tag-salmon",
  legume: "bg-tag-legume",
  eggs: "bg-tag-eggs",
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl p-4 shadow-sm">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DinnerRow({ d }: { d: DinnerStat }) {
  return (
    <li className="flex items-center gap-3">
      <div
        className={cn(
          "size-10 shrink-0 overflow-hidden rounded-lg",
          d.proteinTag ? TAG_BG[d.proteinTag] : "bg-primary",
        )}
      >
        {d.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.imageUrl} alt="" className="size-full object-cover" />
        )}
      </div>
      <span className="flex-1 truncate text-sm">{d.name}</span>
      <span className="text-sm font-semibold tabular-nums">
        {d.avg.toFixed(1)}
        <span className="text-muted-foreground ml-1 text-xs font-normal">
          ({d.count})
        </span>
      </span>
    </li>
  );
}

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const s = await getStats(supabase, user.id);

  return (
    <div className="space-y-4 py-4">
      <div>
        <h1 className="text-2xl font-bold">Stats</h1>
        <p className="text-muted-foreground text-sm">Last 30 days</p>
      </div>

      <Card title="Dinner ratings">
        <ul className="space-y-2">
          {s.userAvgs.map((u) => (
            <li key={u.name} className="flex items-baseline justify-between">
              <span className="text-sm">{u.name}</span>
              <span className="font-semibold tabular-nums">
                {u.avg == null ? "—" : u.avg.toFixed(1)}
                <span className="text-muted-foreground ml-1 text-xs font-normal">
                  {u.count} rated
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Morning streak">
          <p className="text-3xl font-bold">
            {s.morningStreak}
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              days
            </span>
          </p>
        </Card>
        <Card title="Evening streak">
          <p className="text-3xl font-bold">
            {s.eveningStreak}
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              days
            </span>
          </p>
        </Card>
      </div>

      <Card title="Supplement adherence (30 days)">
        {s.adherence.length === 0 ? (
          <p className="text-muted-foreground text-sm">No supplements.</p>
        ) : (
          <ul className="space-y-2">
            {s.adherence.map((a) => (
              <li
                key={a.name}
                className="flex items-baseline justify-between text-sm"
              >
                <span>{a.name}</span>
                <span className="font-semibold tabular-nums">{a.pct}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Grocery completion (this week)">
        <p className="text-3xl font-bold">
          {s.groceryWeekPct == null ? "—" : `${s.groceryWeekPct}%`}
        </p>
      </Card>

      <Card title="Top dinners">
        {s.topDinners.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No dinners rated yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {s.topDinners.map((d) => (
              <DinnerRow key={d.recipeId} d={d} />
            ))}
          </ul>
        )}
      </Card>

      {s.bottomDinners.length > 0 && (
        <Card title="Worst dinners — consider retiring">
          <ul className="space-y-3">
            {s.bottomDinners.map((d) => (
              <DinnerRow key={d.recipeId} d={d} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
