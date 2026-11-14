# Design

## Viewer

One Three.js renderer in `TourViewer.tsx` drives every mode. The procedural house is built once by `buildHouse()` and holds two wall sets: cutaway walls (1.05 m) for Orbit and full walls (2.9 m) with ceilings for Jalan and Terbang. Switching mode toggles visibility, so nothing is rebuilt.

Camera control is our own first person controller rather than PointerLockControls, because touch must work the same as mouse. Dragging changes yaw and pitch. Orbit mode uses OrbitControls.

## Walking

`walk.ts` is plain TypeScript with no Three.js so it can be tested in Node.

- Walls are 2D segments in metres with a floor level. Room rectangles give edges, shared edges are merged per line and door openings are cut out.
- Floors are surfaces: ground (y 0), the stair ramp, and the upper slab (y 3.2) minus the stair void. The player stands on the highest surface not more than 0.45 m above the feet. A surface between 0.45 m and 1.9 m above the feet blocks movement, which stops guests walking into the side of the stairs while letting them pass under its high end.
- Gravity and a jump speed give the Space key a small hop.
- The pool edge and the lot fence block walking.

## Stairs and corridor

The plan leaves an unassigned area between Bilik 4, the stairs and the living room. It becomes a corridor that links the living room, the hall, Bilik 4 and the way under the stairs to Ruang makan 2. The stairs rise from the living room side (east) to the upper family room (west).

## Splat scans

When `house_tour.splat.url` is set the viewer loads Spark lazily, adds a `SplatMesh` and hides the house model. Walking on a scan keeps the eye at a fixed height over a flat floor with no walls, which the help text calls approximate. Views for a scan are saved by the admin from inside the viewer as camera position and look target. The scan settings hold `flip` (rotate 180 degrees about X, which most phone exports need), `scale` and `y` offset.

## Upload

The upload function accepts the `splat` folder with the file extensions above, stores the File object straight into R2 and allows 90 MB, under the Cloudflare free request limit of 100 MB.
