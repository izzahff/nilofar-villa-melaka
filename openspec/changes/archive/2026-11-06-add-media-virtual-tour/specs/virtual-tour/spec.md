# Spec Delta

## Purpose

Gives guests an interactive 360 look inside the villa.

## ADDED Requirements

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
When no scene exists the tour page MUST say the tour is coming soon and link to the gallery.

#### Scenario: Before photos are ready
- **WHEN** a guest opens the tour with no scenes
- **THEN** a coming soon message and a gallery link show
