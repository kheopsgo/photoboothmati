# Architecture rules

- Keep the welcome-screen photo history in PhotoboothContext for the current session and preserve it on restart; this reuses completed captures without new backend endpoints or persistent photo storage.
- Render the welcome photo stack in its own component; this isolates the slideshow timer from capture controls.
- The frame (calque) is a 1200x1800 portrait canvas with a landscape 3:2 photo hole on top and event info below it; raw camera photos are stored sideways and must be rotated 90° CCW before being placed (contain, never cropped) — see BACKEND_FRAME_INFO_BELOW.md; the frontend must NOT rotate final images on display.