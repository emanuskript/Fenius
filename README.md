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

- Node.js 18+
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
npm run sync:book-paths-assets
```

---

## Environment & Runtime Notes

- The project uses Vue CLI (`@vue/cli-service`) and serves static production output from `dist/`.
- Routing is handled in-app via Vue Router, so server rewrites should route unknown paths to `index.html`.

---

## Deployment (Server)

This section covers deploying the built app to a Linux server with Nginx.

### Option A: Nginx static hosting (recommended)

1. Build the app:

```bash
npm ci
npm run build
```

2. Copy `dist/` to your server (example path):
- `/var/www/fenius/dist`

3. Use an Nginx site config like:

```nginx
server {
   listen 80;
   server_name your-domain.example;

   root /var/www/fenius/dist;
   index index.html;

   location / {
      try_files $uri $uri/ /index.html;
   }

   location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
      expires 30d;
      add_header Cache-Control "public, max-age=2592000";
      try_files $uri =404;
   }
}
```

4. Validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

5. (Recommended) Add TLS with Certbot:

```bash
sudo certbot --nginx -d your-domain.example
```

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

Try a clean install:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

