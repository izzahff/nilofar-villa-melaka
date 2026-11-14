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
