# Threat Model Viewer

> **v0.1.0** — standalone web viewer for Microsoft Threat Modeling Tool (`.tm7`) files

Load a `.tm7` file from disk or paste its XML contents to view the threat model — everything runs client-side in the browser. Deployed as a static site on GitHub Pages.

## Features

- (to be filled as features are implemented)
- Load `.tm7` file from disk
- Paste `.tm7` XML into a textarea
- Render diagrams (borders, lines, annotations) from the parsed model

## Tech Stack

| Component       | Technology                  |
|-----------------|-----------------------------|
| Language        | TypeScript                  |
| UI              | React 18                    |
| Build tool      | Vite 5                      |
| Test runner     | Vitest + Testing Library    |
| Icons           | Heroicons                   |
| Deployment      | GitHub Pages (static)       |

## Requirements

- Node.js 22+
- npm

## Setup

```bash
git clone https://github.com/alejandroechev/threat-model-viewer.git
cd threat-model-viewer
npm install
npm run dev
```

Open the URL printed by Vite (typically http://localhost:5173).

## Commands

```bash
npm run dev          # Dev server with HMR
npm run build        # Production build to dist/
npm run preview      # Preview the production build locally
npm test             # Run unit tests once
npm run test:watch   # Vitest watch mode
npm run coverage     # Tests with v8 coverage report
npm run typecheck    # Type-check without emitting
npm run lint         # ESLint
```

## Deployment

Pushes to `master` trigger `.github/workflows/deploy.yml`, which builds the site
with `GITHUB_PAGES=true` (so Vite's `base` is `/threat-model-viewer/`) and
publishes `dist/` to GitHub Pages.

Live site: https://alejandroechev.github.io/threat-model-viewer/

> Enable GitHub Pages once in the repo settings: **Settings → Pages → Source: GitHub Actions**.

## License

Private use.
