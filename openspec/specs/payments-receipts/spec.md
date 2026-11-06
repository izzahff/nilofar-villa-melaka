# payments-receipts Specification

## Purpose
Tracks money for each stay and gives guests a proper receipt.

## Requirements

### Requirement: Payment records
The admin SHALL record payments with type (deposit, rental, late_checkout, deposit_refund, deposit_deduction), amount, method, date and reference. The security deposit is held apart from the rent. The rent balance SHALL equal total price minus rental payments. The deposit held SHALL equal deposits received minus refunds and deductions.

#### Scenario: Deposit then part rent
- **WHEN** a RM1200 booking gets a RM300 deposit and a RM500 rental payment
- **THEN** the rent balance shows RM700 and the deposit held shows RM300

### Requirement: Receipt numbers and PDF
Each payment MUST get a unique receipt number like R-2026-0001 in order. The admin SHALL download a PDF receipt showing the villa details, guest, stay dates, payment, balance and bank details. A recorded payment is never edited after its receipt is issued. A wrong entry is deleted, which stays visible in the audit log, and entered again.

#### Scenario: Share receipt
- **WHEN** the admin marks a deposit as received
- **THEN** a receipt PDF downloads and a WhatsApp message with the receipt number opens

### Requirement: Status follows money
When a deposit is recorded on a pending booking the status SHALL move to deposit_paid, and when rental payments reach the total price it SHALL move to fully_paid, unless the booking is already checked in, completed or cancelled.

#### Scenario: Full payment
- **WHEN** the last rental payment brings the rent balance to zero
- **THEN** the booking status becomes fully_paid

### Requirement: Deposit return
The admin SHALL mark the security deposit returned with a date, and the dashboard SHALL list completed stays whose deposit is still held.

#### Scenario: Return deposit
- **WHEN** the admin marks the deposit returned
- **THEN** the booking leaves the deposits to return list
