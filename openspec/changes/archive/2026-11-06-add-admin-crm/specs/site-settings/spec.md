# Spec Delta

## Purpose

Lets the owners keep prices, rules and contact details current on their own.

## ADDED Requirements

### Requirement: Editable settings
The admin SHALL edit weekday and weekend prices for 1 and 2 nights, the extra night rate, deposits, late check out fee, holidays, house rules, bank name, account holder, account number, WhatsApp numbers, social links and WhatsApp message templates.

#### Scenario: New holiday
- **WHEN** the admin adds 25 December as a holiday
- **THEN** a stay with that night is priced at the weekend rate

### Requirement: Public settings only
The public site MUST read only the settings marked public. Message templates stay admin only.

#### Scenario: Anonymous read
- **WHEN** an anonymous visitor reads settings
- **THEN** only public keys return
