# booking-enquiry Specification

## Purpose
Guides a guest from picking dates to talking with the owner on WhatsApp, then collects full registration details once the owner confirms.

## Requirements

### Requirement: Availability check form
The short form SHALL ask for name, home town, check in, check out, adults, children, remarks and phone number, show the house rules and require the guest to agree to them before sending.

#### Scenario: Guest skips the rules
- **WHEN** the guest presses send without ticking the rules box
- **THEN** the form stays open and points to the rules

### Requirement: WhatsApp hand off
On send the system SHALL open WhatsApp to the chosen admin number with a filled message holding every form answer and the price estimate, and SHALL record the enquiry for the admin with status enquiry.

#### Scenario: Enquiry sent
- **WHEN** a guest sends a valid form
- **THEN** WhatsApp opens with the filled message and the admin sees a new enquiry card

### Requirement: Spam protection
The enquiry endpoint MUST verify a Cloudflare Turnstile token when the site has a Turnstile key, and MUST validate field lengths, dates and guest counts on the server.

#### Scenario: Bot request
- **WHEN** a request arrives with no valid Turnstile token
- **THEN** the endpoint rejects it and stores nothing

### Requirement: Guest registration form
The admin SHALL be able to share a private link per booking. The link opens a form for full name, address, phone, adults, children, stay dates, how the guest heard about the villa, and an optional deposit slip upload. Submitting the form updates that booking only.

#### Scenario: Guest submits registration
- **WHEN** a guest opens a valid link and submits the form
- **THEN** the booking shows the new details and the slip under its documents

#### Scenario: Unknown link
- **WHEN** someone opens a link with a token that matches no booking
- **THEN** the page says the link is not valid and shows no booking data
