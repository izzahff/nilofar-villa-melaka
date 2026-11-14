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
A scene SHALL hold hotspots placed by yaw and pitch that open another scene when tapped.

#### Scenario: Walk to the kitchen
- **WHEN** a guest taps the Dapur hotspot in Ruang Tamu
- **THEN** the viewer moves to the Dapur scene

### Requirement: Empty tour
When no 360 scene exists the tour page MUST show the 3D house model. When 360 scenes exist the page SHALL offer the 3D model and the 360 tour as two tabs.

#### Scenario: Before photos are ready
- **WHEN** a guest opens the tour with no 360 scenes
- **THEN** the 3D house model shows and no 360 tab appears

#### Scenario: After 360 photos are added
- **WHEN** the admin has added at least one 360 scene
- **THEN** the tour page shows a 360 tab next to the 3D model tab
