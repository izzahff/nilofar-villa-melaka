# Spec Delta

## MODIFIED Requirements

### Requirement: Empty tour
When no 360 scene exists the tour page MUST show the 3D house model. When 360 scenes exist the page SHALL offer the 3D model and the 360 tour as two tabs.

#### Scenario: Before photos are ready
- **WHEN** a guest opens the tour with no 360 scenes
- **THEN** the 3D house model shows and no 360 tab appears

#### Scenario: After 360 photos are added
- **WHEN** the admin has added at least one 360 scene
- **THEN** the tour page shows a 360 tab next to the 3D model tab
