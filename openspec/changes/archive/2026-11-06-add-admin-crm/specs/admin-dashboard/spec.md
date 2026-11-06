# Spec Delta

## Purpose

Shows the owners what needs attention today without opening each booking.

## ADDED Requirements

### Requirement: Summary numbers
The dashboard SHALL show upcoming stays in the next 30 days, new enquiries, total balance owed, and this month's occupancy rate and collected revenue.

#### Scenario: New enquiry arrives
- **WHEN** a guest sends an availability check
- **THEN** the new enquiries number goes up by one

### Requirement: Action lists
The dashboard SHALL list check ins in the next 7 days, bookings whose full payment is due within 3 days of check in and not yet paid, and completed stays whose deposit has not been returned.

#### Scenario: Deposit refund due
- **WHEN** a stay is completed and the deposit is not marked returned
- **THEN** it shows under deposits to return

### Requirement: Revenue report
The admin SHALL see collected revenue per month for the last 12 months and export bookings as CSV.

#### Scenario: Export
- **WHEN** the admin presses export
- **THEN** a CSV file with every booking in the filter downloads
