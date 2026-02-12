# CLAUDE.md

## Project Overview

Portfolio of Three.js exercises from the **Three.js Journey** course. The application displays a menu with preview cards (image + video on hover) that allow navigating between multiple independent 3D scenes.

## Tech Stack

- **Runtime**: JavaScript (ES modules, no TypeScript)
- **Bundler**: Vite 6 (`vite.config.js`)
- **3D**: Three.js ^0.174.0
- **GUI**: lil-gui ^0.20.0
- **Deployment**: GitHub Pages via `gh-pages` (base path `/threeJS/` in production)

## Architecture

```
src/
├── index.html          # SPA — single shared canvas across all projects
├── main.js             # Router: dynamic menu + project loading via import()
├── style.css           # Global styles (dark theme, cards, layout)
└── projects/           # One file per Three.js exercise
    ├── haunted-house.js
    ├── particles.js
    └── galaxy-generator.js

static/                 # Static assets (textures, previews)
```

### Routing

- Based on query param `?project=<key>` in the URL
- Navigation handled via `history.pushState` + `popstate`
- Modules are loaded dynamically with `import()`
- A single `<canvas class="webgl">` is reused by all projects

### Project Registry (`main.js`)

Each project is declared in the `projects` object with: `name`, `description`, `image`, `video`, and a `load` function that returns a dynamic `import()`.

## Code Conventions

### Project Module Structure

Each file in `src/projects/` follows this pattern:

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Timer } from 'three/addons/misc/Timer.js'
import GUI from 'lil-gui'

export default function projectName(canvas) {
  // 1. GUI (lil-gui)
  // 2. Scene
  // 3. Sizes + resize listener
  // 4. Camera (PerspectiveCamera)
  // 5. OrbitControls
  // 6. Renderer (WebGLRenderer)
  // 7. 3D objects (geometries, materials, meshes, lights, textures…)
  // 8. Animation loop (Timer + requestAnimationFrame)
  // 9. Return dispose()

  return function dispose() {
    // - cancelAnimationFrame
    // - removeEventListener('resize', …)
    // - renderer.dispose()
    // - Traverse scene to dispose geometries + materials + textures
    // - gui.destroy()
  }
}
```

### Important Rules

- **Default export**: each project exports a **function** (not a class) that receives the `canvas` as a parameter
- **Mandatory dispose**: the function always returns a `dispose()` that cleans up all resources (prevents memory leaks)
- **No semicolons**: code style does not use semicolons
- **Trailing commas**: used consistently
- **No TypeScript**: vanilla JavaScript with ES modules (`"type": "module"`)
- **Three.js imports**: `import * as THREE from 'three'` for core, specific imports from `three/examples/jsm/` or `three/addons/` for addons
- **Pixel ratio**: always capped at 2 with `Math.min(window.devicePixelRatio, 2)`

### Recurring Patterns

- `Timer` from Three.js (instead of `Clock`) for delta time
- `OrbitControls` with `enableDamping: true`
- `BufferGeometry` + `Float32Array` for particle systems
- `TextureLoader` to load textures from `static/`
- Section comments use `/** */` blocks with descriptive titles

## Commands

| Command         | Description                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Vite development server        |
| `npm run build` | Production build in `dist/`    |
| `npm run deploy`| Deploy to GitHub Pages         |

## Vite Configuration

- **Root**: `src/` (where `index.html` lives)
- **Public dir**: `../static/` (files in `static/` are served as-is)
- **Base**: `/` in dev, `/threeJS/` in production
- **Sourcemaps**: enabled in build
- **Plugin**: `vite-plugin-restart` — restarts the server when files in `static/` change

## Adding a New Project

1. Create a file `src/projects/my-project.js` following the pattern above
2. Add an entry to the `projects` object in `src/main.js`:
   ```js
   'my-project': {
     name: 'My Project',
     description: 'Project description',
     image: './screen/my_project.png',    // optional
     video: './screen/video/my_project.mp4', // optional
     load: () => import('./projects/my-project.js'),
   },
   ```
3. Add assets (textures, previews) to `static/`
