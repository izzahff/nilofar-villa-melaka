# Proposal

## Why

Guests decide on looks. The owners need to swap gallery photos themselves, and a 360 walk through lets families see every room before they travel.

## What Changes

- Media library in the admin to upload, caption, order and remove gallery photos stored in Cloudflare R2
- Public gallery reads from the media library
- 360 virtual tour page with one scene per space, hotspots that jump between scenes and a room picker
- Admin manages tour scenes and hotspots

## Capabilities

### New Capabilities
- `media-library`: public photos managed by the admin
- `virtual-tour`: 360 scenes and navigation for guests

### Modified Capabilities

## Impact

- Tables `media`, `tour_scenes`
- Cloudflare Pages Function `functions/api/upload.ts` with an R2 binding
- Out of scope. Video hosting, which stays on YouTube or social media
