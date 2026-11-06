# Spec Delta

## Purpose

Gives the owners full control of every stay and every blocked night.

## ADDED Requirements

### Requirement: Booking records
A booking SHALL hold a reference number, guest name, phone, home town, address, adults, children, check in, check out, booking type (standard, event or special), source, remarks, total price, deposit amount, status and internal notes. The admin MUST be able to create, edit and delete bookings.

#### Scenario: Admin adds a walk in booking
- **WHEN** the admin saves a new booking with valid dates
- **THEN** it gets a reference like NV-2611-0007 and appears on the calendar

### Requirement: Status flow
Status SHALL be one of enquiry, pending, deposit_paid, fully_paid, checked_in, completed or cancelled. The admin MUST be able to move a booking to any status from the detail page or by dragging its card on the kanban board.

#### Scenario: Drag to deposit
- **WHEN** the admin drags a card from Pending to Deposit
- **THEN** the booking status becomes deposit_paid and the public calendar marks its nights busy

### Requirement: Date blocks
The admin SHALL be able to block a date range with a reason. Blocked nights show as busy on the public calendar.

#### Scenario: Owner uses the villa
- **WHEN** the admin blocks 1 to 3 February with reason "Guna sendiri"
- **THEN** guests see those nights as busy

### Requirement: Calendar and list views
The admin SHALL see bookings on a month calendar coloured by status, in a searchable list filtered by status and month, and on a kanban board.

#### Scenario: Search by phone
- **WHEN** the admin types part of a phone number in the list search
- **THEN** only bookings with a matching phone show

### Requirement: WhatsApp templates
Each booking SHALL offer one tap messages for confirmation, registration link, payment reminder, check in info and thank you, filled with the booking details and bank details.

#### Scenario: Payment reminder
- **WHEN** the admin taps the payment reminder on a booking with RM900 balance
- **THEN** WhatsApp opens to the guest with the balance, due date and bank details filled in

### Requirement: Audit trail
Every insert, update and delete on bookings, payments, blocks and settings MUST be written to the audit log with the time and the admin.

#### Scenario: Status change logged
- **WHEN** the admin changes a status
- **THEN** the audit log shows the old and new values
