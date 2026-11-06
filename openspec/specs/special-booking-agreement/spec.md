# special-booking-agreement Specification

## Purpose
Covers long or corporate stays that need a signed agreement and a custom payment plan.

## Requirements

### Requirement: Agreement details
A booking of type special SHALL have an agreement with the renting party, representative name and position, contact, reference number such as a local order, agreed total, a payment schedule of dated installments, and extra terms.

#### Scenario: Government 21 day stay
- **WHEN** the admin creates a special booking for 21 nights with three installments
- **THEN** the agreement shows all three due dates and amounts and their sum equals the agreed total

### Requirement: Agreement PDF
The admin SHALL download an agreement PDF with both parties, stay dates, number of nights, price, schedule, cancellation terms, house rules and signature lines.

#### Scenario: Print agreement
- **WHEN** the admin presses download on the agreement
- **THEN** a PDF with signature lines for both parties downloads
