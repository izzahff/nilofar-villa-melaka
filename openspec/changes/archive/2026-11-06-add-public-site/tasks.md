# Tasks

## 1. Foundation

- [x] 1.1 Scaffold Vite React TypeScript app with Tailwind and Motion, verified by `npm run build`
- [x] 1.2 Add brand theme, fonts and shared UI parts, verified by viewing the home page
- [x] 1.3 Add data layer with Supabase and local drivers, verified by the app loading with and without `VITE_SUPABASE_URL`

## 2. Database

- [x] 2.1 Write migration for settings, holidays, bookings, blocked dates and the overlap constraint, verified by running it in a fresh Supabase project
- [x] 2.2 Write `get_busy_ranges`, `get_booking_form` and `submit_registration` functions, verified by calling them as anon
- [x] 2.3 Write `submit-enquiry` Edge Function with Turnstile check, verified by a request without a token being rejected

## 3. Public pages

- [x] 3.1 Build home sections with scroll motion, verified on 390 px and 1440 px widths
- [x] 3.2 Build availability calendar and price estimate, verified by the Friday to Sunday case showing RM2200
- [x] 3.3 Build the availability check wizard with rules and WhatsApp hand off, verified by the filled WhatsApp link
- [x] 3.4 Build the registration form page, verified with a valid and an invalid token

## Workflow follow-up

- Archive this change after the owners review the live site
