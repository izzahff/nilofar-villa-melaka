# Proposal

## Why

The owners need proof of payment for guests and a written agreement for long stays such as a 21 day government booking. Today they type receipts by hand.

## What Changes

- Record security deposits, rent payments (full or by installment), late check out fees, damage deductions and deposit refunds per booking
- Every payment gets a running receipt number and a PDF receipt that can be downloaded or shared to WhatsApp
- Special bookings get an agreement PDF with parties, dates, price, payment schedule, cancellation terms, house rules and signature lines
- Upload signed agreements, local orders and deposit slips to private storage

## Capabilities

### New Capabilities
- `payments-receipts`: payment records, balances and receipts
- `special-booking-agreement`: agreement terms, schedule and the agreement PDF
- `booking-documents`: private files attached to a booking

### Modified Capabilities

## Impact

- Tables `payments`, `agreements`, `documents`, private bucket `private-docs`
- Out of scope. Online payment, e-signature
