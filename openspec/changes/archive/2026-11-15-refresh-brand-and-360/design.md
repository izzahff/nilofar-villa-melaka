# Design

## Palette

| Token | Old | New | Role |
| --- | --- | --- | --- |
| forest | #1f3b35 | #4b2e1e espresso | primary buttons, headings |
| forest-dark | #142823 | #2b1a11 | dark sections |
| gold | #c9a66b | #e5cf72 butter | accent, highlights |
| gold-dark | #a8854b | #9c7f24 | accent text on light |
| rose | #b76e79 | #b4553a terracotta | alerts |
| sky | (new) | #cbd6e3 powder blue | pool band, soft accents |

Names stay to avoid touching every component. A comment in `index.css` explains the roles.

## 360 smoothness

Commercial tours feel smooth because of motion design, not the format. The viewer stays Photo Sphere Viewer and adds:

- Intro: start at pitch -90 degrees with fisheye 2 and zoom 0, then ease to the horizon over 2.6 s while fisheye goes to 0
- Idle rotation at 0.6 rpm after 3.5 s
- Hotspot tap: animate yaw and zoom toward the hotspot (0.75 s), then `setPanorama` with a 1.1 s fade and no rotation
- Preload the images of the scenes a scene links to
- Reduced motion turns off the intro, rotation and walk in, and switches without transition
