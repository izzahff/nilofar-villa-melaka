# Spec Delta

## Purpose

Lets guests see which nights are free and what a stay will cost before they contact the owners.

## ADDED Requirements

### Requirement: Busy dates without personal data
The calendar SHALL mark a night busy when an active booking or an admin block covers it. Active bookings are those with status pending, deposit_paid, fully_paid, checked_in or completed. The public calendar MUST NOT expose guest names, phone numbers or any booking detail.

#### Scenario: Night covered by a confirmed booking
- **WHEN** a booking with status deposit_paid covers 11 to 13 December
- **THEN** the nights of 11 and 12 December show as busy and 13 December stays free for check in

#### Scenario: Enquiry does not block
- **WHEN** a booking has status enquiry
- **THEN** its nights still show as free to the public

### Requirement: Rate category
A stay SHALL use the weekend rate when check in falls on Friday or Saturday, or when any night of the stay is a holiday the admin listed. Every other stay uses the weekday rate.

#### Scenario: Sunday check in
- **WHEN** a guest picks Sunday to Monday with no holiday
- **THEN** the estimate uses the weekday rate

### Requirement: Price estimate
The estimate SHALL use the 1 night (2H1M) price for 1 night, the 2 night (3H2M) price for 2 nights, and the 2 night price plus the extra night rate for each night after the second. Stays longer than 2 nights MUST be labelled as an estimate that the admin confirms.

#### Scenario: Weekend two nights
- **WHEN** a guest picks Friday to Sunday with default prices
- **THEN** the estimate shows RM2200

### Requirement: Weekend minimum stay
A weekend stay SHALL need at least 2 nights, except when check in is within 3 days from today.

#### Scenario: One night Saturday next month
- **WHEN** a guest picks one Saturday night more than 3 days away
- **THEN** the calendar explains the 2 night minimum and does not allow the selection

### Requirement: No overlapping bookings
The system MUST reject any active booking or block that overlaps another active booking.

#### Scenario: Admin double books
- **WHEN** the admin saves a deposit_paid booking over nights already held by another active booking
- **THEN** the save fails with a clear message
