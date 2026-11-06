# Spec Delta

## Purpose

Lets the owners keep the public gallery fresh without a developer.

## ADDED Requirements

### Requirement: Upload photos
The admin SHALL upload images up to 15 MB with a caption and category (luar, ruang tamu, dapur, bilik, kolam, lain). The upload endpoint MUST accept only signed in admins and only image types.

#### Scenario: Non admin upload
- **WHEN** a request without a valid admin session calls the upload endpoint
- **THEN** it returns 401 and stores nothing

### Requirement: Gallery order
The admin SHALL reorder, hide and delete photos. The public gallery SHALL show visible photos in that order, filterable by category.

#### Scenario: Hide a photo
- **WHEN** the admin hides a photo
- **THEN** it no longer shows in the public gallery
