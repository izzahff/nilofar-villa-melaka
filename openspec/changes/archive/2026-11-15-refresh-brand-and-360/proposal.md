# Proposal

## Why

The owner wants the site to feel luxurious and practical rather than green, using boutique hotel references (Meadowell, Vita Lenta, Secret Floor): warm ivory pages, espresso brown, butter yellow, powder blue and large italic serif type. The owner also wants the 360 tour to feel as smooth as commercial tours such as 360vr.my.

## What Changes

- New palette and type. Ivory, espresso, butter, powder blue and terracotta replace forest green and gold. Playfair Display (italic for emphasis) replaces Cormorant Garamond. Token names stay so every screen picks the palette up.
- New home hero. A full bleed photo with the name set very large in butter italic, the address below, and the booking action at the top.
- The 360 viewer opens with a little planet fly in, rotates slowly when idle, turns and zooms toward a hotspot before cross fading into the next room, preloads the rooms a scene leads to, offers a gyroscope button on phones, and has a guided Tour automatik mode.
- Hotspots and viewer controls use the new palette.

## Capabilities

### Modified Capabilities
- `virtual-tour`: smoother scene changes, intro, idle rotation, gyroscope and guided tour
- `public-site`: new visual identity and hero

## Impact

- `src/index.css` theme tokens and fonts, `index.html` theme colour, favicon, logo, PDF colours
- `src/components/PanoViewer.tsx`, `src/pages/public/Tour.tsx`, hero in `src/pages/public/Home.tsx`
- New free packages `@photo-sphere-viewer/autorotate-plugin`, `@photo-sphere-viewer/gyroscope-plugin`, `@fontsource-variable/playfair-display`. Removes `@fontsource/cormorant-garamond`.
- Real 360 photos are still needed for the 360 tab to appear
