# Nilofar Villa Melaka

Homestay website and admin CRM. React 19, Vite, TypeScript, Tailwind CSS 4, Motion, Supabase, Cloudflare Pages and R2.

## Rules

- Every behaviour change goes through OpenSpec. Propose a change under `openspec/changes`, implement it, then archive it. Run `npx openspec validate --all` before committing.
- Customer facing text is Bahasa Melayu. Code and specs are English.
- Running cost must stay at RM0. Do not add paid services.
- Keep both data drivers in `src/lib/api` (Supabase and demo) in step when the `Api` interface changes.
- Price, minimum stay and availability rules live only in `src/lib/pricing.ts`.
- Guests never read tables directly. Public access goes through the security definer functions in the migrations.
- Default settings live in `src/lib/defaults.ts`. Run `npm run gen:seed` after changing them.
- Check every screen at 390 px and 1440 px wide.

## Commands

- `npm run dev` starts the site in demo mode when `VITE_SUPABASE_URL` is empty
- `npm run build` type checks and builds
- `npm run lint`
