# Spec Delta

## Purpose

Defines what guests see on the public Nilofar Villa Melaka site and how it behaves on every screen size.

## ADDED Requirements

### Requirement: Villa information
The site SHALL show the villa name, location in Bemban Jasin, the 5 bedrooms with bed sizes and bathrooms, guest capacity (ideal 15, maximum 20), facilities, check in time 3.00 pm and check out time 12.00 pm, nearby attractions, food spots and the beaches Pantai Siring and Pantai Klebang.

#### Scenario: Guest reads the rooms section
- **WHEN** a guest scrolls to the rooms section
- **THEN** the site lists Bilik 1 to Bilik 5 with the bed size, aircond and bathroom details

### Requirement: Content managed by admin
Text, prices, rules, bank details, contact numbers and social links shown on the site MUST come from the settings the admin edits, so no code change is needed to update them.

#### Scenario: Admin changes a price
- **WHEN** the admin saves a new weekday price
- **THEN** the price section and the estimate show the new price on the next page load

### Requirement: Motion
Sections SHALL animate into view on scroll, the hero SHALL use parallax, and buttons SHALL react to hover and tap. When the device asks for reduced motion the site MUST show content without movement.

#### Scenario: Reduced motion
- **WHEN** the guest device has reduced motion enabled
- **THEN** sections appear without slide or parallax effects

### Requirement: Responsive layout
Every page MUST be usable from 360 px phones to wide laptops without horizontal scrolling. On screens narrower than 768 px a sticky booking button SHALL stay at the bottom of the screen.

#### Scenario: Phone visitor
- **WHEN** the site opens on a 390 px wide phone
- **THEN** content shows in one column and the sticky booking button is visible

### Requirement: Social and contact links
The footer SHALL link to Facebook, Instagram, TikTok, Google Maps and both WhatsApp numbers.

#### Scenario: Guest taps WhatsApp
- **WHEN** a guest taps the En. Elyes WhatsApp link
- **THEN** WhatsApp opens a chat with that number
