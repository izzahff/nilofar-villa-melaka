# house-model-tour Specification

## Purpose
Lets guests explore the villa layout in 3D and see the real photos of each room.

## Requirements

### Requirement: 3D house model
The tour page SHALL show a 3D model of the house with the rooms of the Brittany floor plan, the car porch, the terrace, the garden and the pool. The model MUST state that sizes are approximate and based on the developer floor plan.

#### Scenario: Guest opens the tour
- **WHEN** a guest opens `/tour`
- **THEN** the 3D model loads with room labels and slowly rotates until the guest touches it

#### Scenario: Reduced motion
- **WHEN** the device asks for reduced motion
- **THEN** the model does not rotate on its own and camera moves happen without animation

### Requirement: Floor switch
The guest SHALL switch between ground floor, upper floor and both floors. Hidden floors MUST NOT block taps on visible rooms.

#### Scenario: Upper floor only
- **WHEN** the guest picks the upper floor
- **THEN** only the upper floor rooms and labels show

### Requirement: Room details
Tapping a room label or a room floor SHALL move the camera to that room and open a panel with the room name, bed and features, and the photos assigned to it. Tapping a photo opens it full screen.

#### Scenario: Open the master bedroom
- **WHEN** the guest taps the master bedroom
- **THEN** the camera moves to it and the panel shows its photos

#### Scenario: Room without photos
- **WHEN** a room has no photos assigned
- **THEN** the panel says photos are coming soon

### Requirement: Photos per room
The admin SHALL assign and remove photos for each room from the gallery photos. The assignment MUST be stored in the public setting `house_tour`.

#### Scenario: Assign a photo
- **WHEN** the admin adds a kitchen photo to the Dapur room and saves
- **THEN** guests see that photo in the Dapur panel

### Requirement: Walk mode
The tour SHALL let the guest walk through the house at eye level. Walls MUST block movement except at doorways, the stairs MUST carry the guest between floors, and Shift runs and Space jumps. Touch devices SHALL get an arrow pad with Lompat and Lari buttons and drag to look.

#### Scenario: Walk upstairs
- **WHEN** the guest walks from the living room onto the stairs
- **THEN** the camera climbs to the upper floor and the guest can enter Bilik 1 (atas)

#### Scenario: Wall blocks the way
- **WHEN** the guest walks into a wall
- **THEN** the camera slides along the wall and does not pass through it

### Requirement: Flight and orbit modes
The guest SHALL switch between Jalan, Terbang and Orbit. Terbang moves freely through walls and rises or lowers with E and Q or the Naik and Turun buttons. Orbit shows the cutaway model with the floor switch and room labels.

#### Scenario: Switch to orbit
- **WHEN** the guest picks Orbit
- **THEN** the cutaway house model shows with room labels

### Requirement: Saved views
The tour SHALL show a bar of named views. Choosing one moves the camera to that place. With a splat scan the views are those the admin saved.

#### Scenario: Jump to the pool
- **WHEN** the guest picks Kolam renang
- **THEN** the camera moves to the pool and looks across it

### Requirement: Room photos at eye level
Each room with photos SHALL hang its first photo in a frame on a wall. Selecting the frame opens the room panel with all its photos.

#### Scenario: Open a frame
- **WHEN** the guest taps the photo frame in Bilik 2 (master)
- **THEN** the room panel opens with the master bedroom photos

### Requirement: Gaussian splat scan
When the admin sets a splat scan the tour SHALL show the scan instead of the model in all three modes, load the renderer only then, show loading progress and the download size warning, and fall back to the model if the scan fails to load. The admin SHALL upload a scan of up to 90 MB or paste a link, set orientation, scale and height, and save named views from inside the scan.

#### Scenario: Scan added
- **WHEN** the admin uploads a .spz scan and saves
- **THEN** guests see the scan with the admin's saved views

#### Scenario: Scan fails
- **WHEN** the scan cannot load
- **THEN** the tour shows the model and a short notice
