# Sandeep Gautam — Portfolio

A buildless personal portfolio with a locally bundled Three.js scene, filterable skills, expandable experience, and blockchain project highlights.

## Run locally

From this directory:

```sh
python3 -m http.server 5173
```

Open **http://localhost:5173**. Use an HTTP server: JavaScript modules may be blocked when opening `index.html` directly as a `file://` URL.

## Edit

- `index.html`: portfolio content, work history, projects, and skill tags.
- `src/styles.css`: responsive layouts, colors, typography, and CSS animation.
- `src/main.js`: Three.js network sculpture, motion control, skill filters, section navigation, and scroll progress.
- `assets/vendor/`: Three.js 0.165.0 and its MIT license. No runtime CDN dependency for 3D rendering.

Google Fonts is optional; system font fallbacks are provided. The interface and an Ethereum illustration and section shortcuts remain available without WebGL or when the 3D module cannot load. Reduced-motion preferences disable automatic animation. The scene also pauses when offscreen or in a background tab.

No build step or npm dependencies are required. For static hosting, deploy this directory with its `src/` and `assets/` folders.
