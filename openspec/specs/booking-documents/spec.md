# booking-documents Specification

## Purpose
Keeps slips, signed agreements and supporting letters with the booking they belong to.

## Requirements

### Requirement: Private documents
Files attached to a booking MUST be stored privately and opened only by admins through short lived links. Kinds are deposit_slip, payment_slip, signed_agreement, local_order and other.

#### Scenario: Admin opens a slip
- **WHEN** the admin opens a deposit slip
- **THEN** the file opens through a link that expires

#### Scenario: Public request for a file
- **WHEN** a visitor requests a document path directly
- **THEN** storage refuses the request
