# Proposal

## Why

Nilofar Villa Melaka takes every enquiry by hand over WhatsApp and Facebook. Guests cannot see free dates or prices without asking, so the owners answer the same questions many times a day. A public site that shows the villa, the live calendar and a guided enquiry flow cuts that work and gives the brand a premium look.

## What Changes

- New public site in Bahasa Melayu with hero, villa details, rooms, facilities, gallery, nearby places, prices, house rules, FAQ and social links
- Scroll and hover motion on every section, with reduced motion respected
- Live availability calendar that hides guest details and shows only busy or free dates
- Price estimate that follows the weekday, weekend and holiday rules
- Two step booking flow. Step one is a short availability check that opens WhatsApp with a filled message and records an enquiry. Step two is a full registration form that the guest opens from a private link sent by the admin
- Sticky booking button on phones

## Capabilities

### New Capabilities
- `public-site`: content, layout, motion and responsive behaviour of the customer pages
- `availability-calendar`: public view of busy dates and the price estimate rules
- `booking-enquiry`: the availability check, WhatsApp hand off and the guest registration form

### Modified Capabilities

## Impact

- New React app under `src/`, public routes `/`, `/tempah`, `/borang/:token`
- Supabase tables `bookings`, `blocked_dates`, `holidays`, `settings` and RPCs for busy dates and registration
- Supabase Edge Function `submit-enquiry` with Cloudflare Turnstile
- Out of scope. Online payment, guest accounts, the 360 tour (phase 4)
