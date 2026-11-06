# Spec Delta

## Purpose

Keeps guest and money data private to the homestay owners.

## ADDED Requirements

### Requirement: Owner sign in
The admin area SHALL require an email and password sign in. Only users listed as admins MUST be able to read or change bookings, payments, documents, settings or the audit log.

#### Scenario: Signed in user who is not an admin
- **WHEN** a signed in user without an admin row opens the bookings list
- **THEN** the list is empty and every write is refused

#### Scenario: Visitor opens admin
- **WHEN** a visitor who is not signed in opens `/admin`
- **THEN** the login page shows
