# Plate — Project Brief for Claude Code

Mobile-first household meal-planning PWA. Fixed 2-week Mediterranean rotation,
shared meal plan + shopping list, per-user supplement stacks, push reminders.
Full spec: `C:\Users\Luke\Downloads\Plate_App_Build_Spec.md` (v2, self-contained).

## Stack
- Next.js 16 App Router, TypeScript strict mode, React 19 (spec says "14+"; latest stable is 16 — see Deviations)
- Supabase (auth + database + storage)
- Tailwind CSS v4 + shadcn/ui
- Serwist (`@serwist/next`) for PWA (replaces unmaintained `next-pwa`)
- Resend for transactional email (magic links)
- Deploy: Vercel Pro (auto-deploy from `main`; Pro needed for 5-min notification cron)

## Hard rules
- No `any` types. Use proper TypeScript types throughout.
- All database access goes through typed Supabase clients (`@/lib/supabase/server.ts`
  for server, `@/lib/supabase/client.ts` for client). Types in `@/lib/database.types.ts`.
- Row Level Security must be respected — never use the service role key in
  user-facing code. Service role is server-only (cron jobs, admin tasks).
- Components live in `components/` (shared) or co-located with the route in `app/`.
- Server Components by default. `'use client'` only when needed.
- Mobile-first styling. Test at 380px first, then scale up.
- All date / "current week" / "today" logic goes through `@/lib/time.ts` and is
  computed in `Pacific/Auckland`, never server UTC.

## Directory structure
- `app/` — Next.js App Router routes
- `components/` — shared UI components
- `lib/` — utilities, Supabase clients, helpers
- `db/` — schema migrations, seed scripts, RLS policies (pasted into Supabase SQL editor)
- `public/` — static assets (icons, manifest)

## Off-limits
- Don't install state libraries beyond zustand (already chosen).
- Don't write SQL inline in components — always go through Supabase client methods.

## Before committing
- Run `pnpm typecheck` — must pass. (`tsc --noEmit`)
- Run `pnpm build` — must complete cleanly.
- Single-line commit messages. No multi-line bodies, no "co-authored-by".

## Environment / build notes (this machine)
- Repo lives at `C:\code\plate` — deliberately OUTSIDE OneDrive (OneDrive corrupts
  `node_modules`/`.next`). Never relocate into OneDrive.
- pnpm is installed via `npm install -g pnpm` (corepack needs admin here).
- pnpm 11 native-build approval lives in `pnpm-workspace.yaml` under
  `allowBuilds:` (map of name → true), NOT `onlyBuiltDependencies`. sharp and
  unrs-resolver are approved there — don't revert it or `next build` fails.

## Deviations from the v2 spec (decided 2026-05-19, with Luke)
- Next 16 instead of literal "14" — `@latest`, satisfies the spec's "14+".
- Serwist instead of `next-pwa` (latter unmaintained for App Router).
- `public.users.id` = `auth.users.id` via FK + signup trigger that also
  auto-joins the seeded household (implements F1 auto-add).
- RLS uses SECURITY DEFINER helpers to avoid household_members recursion.
- Servings stepper: best-effort numeric parse of free-text ingredients
  (no `{qty,unit,item}` schema change).
- Extra tables not in spec §4: `push_subscriptions`, `notification_log` (dedupe).
