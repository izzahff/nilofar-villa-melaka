# Design

## Context

Phase 4 planned a 360 tour, but the owners have only normal photos. The floor plan of the Brittany unit is published by the developer, with a ground floor of 8530 mm by 14780 mm and an upper floor of 3960 mm by 9900 mm.

## Decisions

- **Room geometry in one file.** `src/lib/house.ts` holds each room as a rectangle in millimetres measured from the floor plan image, with its floor, kind and link to the room settings. Measurements are approximate and the page says so.
- **Plain Three.js, no React wrapper.** The 360 viewer already ships Three.js, so the model adds only OrbitControls. The scene lives in the lazy loaded tour chunk.
- **Cutaway walls.** Walls stop at about one metre so guests see into every room from above, like a dollhouse.
- **HTML labels.** Room labels are absolutely positioned buttons projected from 3D every frame, so they stay sharp, readable and tappable on phones.
- **Photos per room in settings.** A public `house_tour` setting maps room ids to photo URLs, with defaults for the photos already in the site. The admin edits it on the tour admin page.
- **Room naming.** Floor plan rooms map to the owners' names. Bedroom 5 upstairs is Bilik 1, the master bedroom is Bilik 2, Bedroom 3 is Bilik 3, Bedroom 4 is Bilik 4 and Bedroom 2 is Bilik 5, matching the listing (two King rooms with bathrooms, one Queen room with a bathroom nearby).
- **Pool and garden placement** are estimates, since the developer plan does not show the owners' pool.

## Risks / Trade-offs

- [Low end phones and WebGL] → limit pixel ratio to 2, simple geometry, no shadows on small screens
- [Photo to room guesses may be wrong] → the admin can reassign photos without code
