# Design

## Context

Greenfield project. Running cost must stay at RM0 and the owners are not technical, so every moving part must be a managed free tier.

## Goals / Non-Goals

**Goals:**
- One React codebase for the public site and the admin
- Fast first load on phone data
- A demo mode that runs with no backend so the owners can try the system before any account is created

**Non-Goals:**
- Server side rendering
- Online payment

## Decisions

- **Vite, React, TypeScript, Tailwind CSS 4, Motion.** A static build fits Cloudflare Pages and needs no server. Next.js was rejected because the free Vercel plan forbids commercial use and the extra server features are not needed.
- **Cloudflare Pages for hosting.** Free tier allows commercial use, unlimited static bandwidth and has Pages Functions for the R2 upload endpoint.
- **Supabase Postgres with row level security.** Gives auth, database and private storage in one free project. Public access goes only through security definer functions (`get_busy_ranges`, `get_booking_form`, `submit_registration`) so guests never read tables directly.
- **Exclusion constraint on date ranges.** `btree_gist` with a `daterange` exclusion stops double booking in the database, not only in the UI.
- **Edge Function for enquiries.** Turnstile needs a secret, so the enquiry insert runs in `submit-enquiry` with the service role.
- **Data layer with two drivers.** `src/lib/api` has a Supabase driver and a local driver backed by localStorage. The app picks the local driver when `VITE_SUPABASE_URL` is empty. The demo admin password is shown on the login page.
- **Price rules in one pure module.** `src/lib/pricing.ts` is shared by the public estimate and the admin booking form.

## Risks / Trade-offs

- [Supabase free projects pause after 7 days idle] → GitHub Actions pings the REST API twice a week
- [Supabase egress is 5 GB a month] → public images move to R2 in phase 4, gallery uses compressed WebP
- [Guests may pick a weekend one night stay by habit] → calendar explains the minimum stay inline

## Migration Plan

Run `supabase/migrations` in order in the SQL editor, run `supabase/seed.sql` once to import the existing bookings, then deploy Pages with the environment variables in `.env.example`.
