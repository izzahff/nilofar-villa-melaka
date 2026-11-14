# Proposal

## Why

The owners have ordinary photos of every room but no 360 panoramas yet, so the tour page only says "coming soon". Guests still want to see how the rooms connect before they book. The villa is the developer's Brittany type (50 x 80 ft, 1.5 storey), so its floor plan is known.

## What Changes

- New interactive 3D model of the house on the tour page, built from the Brittany floor plan with a cutaway view of both floors
- Guests rotate and zoom the model, switch between ground floor, upper floor and both, and tap a room to fly the camera there and see its real photos
- Each room shows its name, bed and features from the existing room settings
- The admin assigns gallery photos to each room
- The 360 viewer stays and appears as a second tab once 360 scenes exist
- The admin tour page stops recommending the discontinued Google Street View app

## Capabilities

### New Capabilities
- `house-model-tour`: 3D floor plan model, room selection and room photos

### Modified Capabilities
- `virtual-tour`: the empty tour page shows the 3D model instead of a coming soon message

## Impact

- `src/lib/house.ts` room geometry, `src/components/HouseModel.tsx` Three.js scene
- New public setting `house_tour` with the photo list per room
- `three` becomes a direct dependency, pinned to the version the 360 viewer uses
- Out of scope. Real 360 photos, walk-through first person mode, exact architectural accuracy
