## MODIFIED Requirements

### Requirement: Hotspots
A scene SHALL hold hotspots placed by yaw and pitch that open another scene when tapped. Tapping a hotspot MUST turn and zoom toward it and then cross fade into the next scene, unless the device asks for reduced motion. Scenes a hotspot leads to SHALL start loading before they are tapped.

#### Scenario: Walk to the kitchen
- **WHEN** a guest taps the Dapur hotspot in Ruang Tamu
- **THEN** the view turns and zooms toward the hotspot and the Dapur scene fades in

## ADDED Requirements

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
