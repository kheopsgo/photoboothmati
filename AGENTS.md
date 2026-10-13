# Architecture rules

- Keep the welcome-screen photo history in PhotoboothContext for the current session and preserve it on restart; this reuses completed captures without new backend endpoints or persistent photo storage.
- Render the welcome photo stack in its own component; this isolates the slideshow timer from capture controls.