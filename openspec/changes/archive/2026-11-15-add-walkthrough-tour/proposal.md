# Proposal

## Why

The owner shared the "Open House" tour (Maison Provence) as the target experience. Guests there walk through the home at eye level, jump between saved views and switch between walk, free flight and orbit. Our tour only offers the dollhouse model seen from outside. A photo real walk through needs a Gaussian splat capture of the villa, which the owners can make for free with a phone app, but they do not have one yet.

## What Changes

- The tour becomes a full width "Rumah terbuka" viewer with three modes. Jalan walks at eye level with floors, stairs and walls. Terbang flies freely through walls. Orbit is the existing dollhouse model.
- Keyboard (W A S D, arrows, Shift to run, Space to jump, E and Q to rise and lower) and touch controls (drag to look, arrow pad, Lompat, Lari, Naik, Turun)
- A bar of saved views jumps to each room, the stairs, the terrace, the garden and the pool
- At eye level the model gets full height walls with doorways, ceilings, floor textures, windows and lights, and each room hangs its real photo in a frame that opens the room panel
- When the admin adds a Gaussian splat scan (.spz, .ply, .splat, .ksplat or .sog), the viewer shows the real scan instead of the model, with walk, flight and orbit. The admin saves named views inside the scan.
- The owner's new outdoor photos and house tour video join the bundled media. The video plays under the viewer and its frames fill rooms that had no photo. The pool and garden move to match the photos.
- The admin uploads the scan to R2 (up to 90 MB) or pastes a link, and sets its orientation and scale

## Capabilities

### Modified Capabilities
- `house-model-tour`: adds walk, flight and saved views, eye level detail, photo frames and splat scans

## Impact

- `src/lib/house.ts` gains doors, a corridor, view points and wall segments, `src/lib/walk.ts` holds collision and floor height rules
- `src/components/tour/` replaces `HouseModel.tsx`
- `@sparkjsdev/spark` (MIT, free) renders splats and loads only when a scan exists
- `functions/api/upload.ts` and `functions/img` accept a `splat` folder. R2 free tier covers 10 GB, so cost stays RM0.
- Setting `house_tour` gains `splat` and `views`
- Out of scope. Making the scan itself, exact collision against a scan
