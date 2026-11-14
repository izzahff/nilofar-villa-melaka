# virtual-tour Specification

## Purpose
Gives guests an interactive 360 look inside the villa.

## Requirements

### Requirement: Tour scenes
The tour SHALL show one equirectangular 360 image per scene. Guests drag or swipe to look around and pick scenes from a list.

#### Scenario: Pick a room
- **WHEN** a guest taps Bilik 1 in the scene list
- **THEN** the viewer loads the Bilik 1 panorama

### Requirement: Hotspots
A scene SHALL hold hotspots placed by yaw and pitch that open another scene when tapped. Tapping a hotspot MUST turn and zoom toward it and then cross fade into the next scene, unless the device asks for reduced motion. Scenes a hotspot leads to SHALL start loading before they are tapped.

#### Scenario: Walk to the kitchen
- **WHEN** a guest taps the Dapur hotspot in Ruang Tamu
- **THEN** the view turns and zooms toward the hotspot and the Dapur scene fades in

### Requirement: Empty tour
When no 360 scene exists the tour page MUST show the 3D house model. When 360 scenes exist the page SHALL offer the 3D model and the 360 tour as two tabs.

#### Scenario: Before photos are ready
- **WHEN** a guest opens the tour with no 360 scenes
- **THEN** the 3D house model shows and no 360 tab appears

#### Scenario: After 360 photos are added
- **WHEN** the admin has added at least one 360 scene
- **THEN** the tour page shows a 360 tab next to the 3D model tab

### Requirement: Smooth viewing
The 360 tour SHALL open with a little planet fly in, rotate slowly when the guest is idle, and offer a gyroscope button on phones that support it. Reduced motion turns off the fly in and the idle rotation.

#### Scenario: First open
- **WHEN** a guest opens the 360 tab
- **THEN** the view starts looking straight down as a little planet and settles at the horizon

#### Scenario: Idle
- **WHEN** the guest stops touching the viewer for a few seconds
- **THEN** the view rotates slowly until touched again

### Requirement: Guided tour
The 360 tour SHALL offer Tour automatik, which moves to the next scene every 14 seconds until turned off.

#### Scenario: Start the guided tour
- **WHEN** the guest turns on Tour automatik
- **THEN** the scenes advance in order and loop back to the first
