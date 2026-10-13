# Architecture rules

- Store independent event text font choices in EventConfig and resolve them through eventFonts; previews and exported frames must use the same typography.
- Bundle event fonts locally via Fontsource so typography remains available without venue Internet and frame exports do not depend on remote stylesheets.

- Keep the welcome-screen photo history in PhotoboothContext for the current session and preserve it on restart; this reuses completed captures without new backend endpoints or persistent photo storage.
- Render the welcome photo stack in its own component; this isolates the slideshow timer from capture controls.- Guest share links (QR) point to photos uploaded to the private Cloud "photos" bucket via the share-photo function with 30-day signed URLs; phones on any network can open them, unlike Raspberry-local URLs.
