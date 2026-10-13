# Fenius

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883.svg)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)

> A Vue-based application for manuscript workflows, including ruling scheme setup and interactive book spine visualization.

---

## Overview

Fenius helps users move from manuscript metadata to visual workflow outputs.

Core workflows:
- **Create a ruling scheme**
- **Visualise a book spine** (create new or import VCEditor JSON)
- **Bookbinding pathway** (currently shown as Coming soon in the UI)

---

## Repository Structure

- [src/App.vue](src/App.vue) — root application shell
- [src/router/index.js](src/router/index.js) — route definitions
- [src/components](src/components) — UI screens and feature components
- [src/bookPaths](src/bookPaths) — book paths state/flow/assets
- [src/assets/styles/theme.css](src/assets/styles/theme.css) — shared theme tokens and global styling
- [public](public) — static app assets
- [scripts/sync-book-paths-assets.mjs](scripts/sync-book-paths-assets.mjs) — asset sync utility

---

## Prerequisites

- Node.js 18-22 (Node.js 20 LTS recommended)
- npm 9+

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run serve
```

Default local URL:
- `http://localhost:8080`

Build production assets:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

Sync generated book-path assets:

```bash
BOOK_PATHS_DRAWINGS_DIR=/absolute/path/to/reviewed-assets \
BOOK_PATHS_SYNC_CONFIRM=replace-checked-assets \
npm run sync:book-paths-assets
```

The sync is intentionally destructive inside `public/book-paths` and therefore
requires both explicit variables. Run `npm run audit:book-paths` and review the
Git diff before committing generated assets.

---

## Environment & Runtime Notes

- The project uses Vue CLI (`@vue/cli-service`) and serves static production output from `dist/`.
- Routing is handled in-app via Vue Router, so server rewrites should route unknown paths to `index.html`.

---

## Deployment (Server)

The complete production runbook is [DEPLOYMENT.md](DEPLOYMENT.md).

### Option A: Nginx static hosting (recommended)

From a clean, committed checkout on an Nginx host, use the atomic deployment
script:

```bash
APP_HOST=fenius.example.org ./ops/deploy.sh
```

It performs a locked install, SVG security audit, lint, production build,
precompression, immutable release staging, atomic symlink switch, Nginx
validation, rollback on invalid configuration, and a local smoke test. It does
not alter firewall or TLS configuration.

### Option B: Vercel

This repository includes [vercel.json](vercel.json). You can connect the repo in Vercel and deploy directly.

Typical build settings:
- Build command: `npm run build`
- Output directory: `dist`

---

## Troubleshooting

### App works locally but routes 404 in production

Ensure your web server rewrites unknown paths to `index.html` (SPA fallback).

### Port conflict when running locally

If `8080` is busy, stop the running process or set a custom port in Vue CLI config before starting.

### Dependency issues after updates

Reinstall the committed dependency graph without changing the lockfile:

```bash
npm ci
```

---

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).
