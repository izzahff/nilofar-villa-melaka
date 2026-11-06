# Proposal

## Why

The owners track bookings in WhatsApp chats and memory. They need one place to see every stay, change its status, block dates and keep the public calendar correct.

## What Changes

- Admin login for the two owners
- Dashboard with upcoming check ins, money owed, deposits to return and monthly occupancy
- Calendar view with bookings coloured by status and admin blocks
- Booking list with search and filters plus a kanban board where cards move between statuses
- Create, read, update and delete for bookings and blocks
- Quick WhatsApp templates per booking
- Settings for prices, holidays, rules, bank details, contact numbers, social links and site text
- Audit log of every change

## Capabilities

### New Capabilities
- `admin-auth`: who can sign in to the admin and what they can reach
- `booking-management`: create, edit, status flow, blocks and the calendar and kanban views
- `admin-dashboard`: summary numbers and lists for the day to day work
- `site-settings`: values the owners can change without code

### Modified Capabilities

## Impact

- Routes under `/admin`
- Tables `admins`, `audit_log`, policies on all tables
- Out of scope. Staff roles beyond owner, SMS or email notifications
