# Fenius production deployment

Fenius is a static Vue single-page application. It has no server process,
database, API secret, or writable runtime directory. Production requires a
locked build and a static HTTPS host with SPA fallback.

## Supported target and capacity

- Build with Node.js 18-22 and npm 9+; Node.js 20 LTS is recommended.
- Serve with Nginx on Linux or Vercel.
- Allow at least 1 GiB free for staging. The uncompressed book-path asset set is
  about 327 MiB and includes individual SVG/PNG files over 60 MiB, so bandwidth,
  CDN/cache behavior, and low-memory/mobile testing matter.
- Public DNS and TCP 80/443. There are no application ports to expose.

## Required verification

From a clean checkout of the reviewed commit:

```bash
npm ci
npm run verify
```

`verify` audits every public SVG for scripts, event handlers, JavaScript URLs,
external references, and doctypes; validates the generated book-path model;
runs ESLint; and creates a production bundle. Do not deploy if the audit fails.

The bundle currently emits performance warnings because the scholarly drawing
assets are intrinsically large. These are documented limitations, not ignored
build errors. The Nginx path precompresses SVGs and caches content-addressed
assets, but a CDN is recommended for geographically distributed use.

## Atomic Nginx deployment

Install Nginx and ensure the deployment account has scoped sudo access. The
checkout must be clean and committed because the release name records the Git
commit.

```bash
APP_HOST=fenius.example.org ./ops/deploy.sh
```

The script:

- checks supported Node/npm/tooling and at least 1 GiB free space;
- runs `npm ci` and the full verification gate;
- stages and precompresses assets outside the live tree;
- installs a root-owned immutable release under `/var/www/fenius/releases`;
- atomically switches `/var/www/fenius/current`;
- installs only `/etc/nginx/sites-available/fenius.conf`;
- validates Nginx before reload and restores the old target on failure;
- confirms that the SPA is served through local Nginx.

It intentionally does not delete old releases, alter firewall rules, request a
certificate, or modify unrelated sites. Configure TLS at Nginx or an upstream
proxy. The supplied template includes CSP, clickjacking/MIME/referrer policies,
HSTS, dotfile denial, read-only methods, SPA fallback, and cache policy.

Verify publicly:

```bash
curl -fsSI https://fenius.example.org/
curl -fsS https://fenius.example.org/ | grep '<div id="app"></div>'
curl -fsSI https://fenius.example.org/book-paths/55_Perimeter_Sewing_-_link_stitch.svg
```

Test all interactive routes in a browser and inspect the console/network panel.
The CSP intentionally permits only same-origin connections/assets plus local
data/blob images and workers.

## Rollback

List releases and repoint the symlink atomically to a known good directory:

```bash
sudo ls -1 /var/www/fenius/releases
sudo ln -s /var/www/fenius/releases/PREVIOUS_RELEASE /var/www/fenius/.rollback
sudo mv -Tf /var/www/fenius/.rollback /var/www/fenius/current
sudo nginx -t
sudo systemctl reload nginx
```

Keep at least one verified previous release. Delete older releases only after
resolving and reviewing their exact paths.

## Vercel

Import the repository, use `npm run build`, and publish `dist`. `vercel.json`
adds the verified security headers and rewrites only application routes, so
asset requests are not accidentally rewritten to HTML. Require the repository
verification workflow before production promotion.

## Asset regeneration

Asset sync replaces `public/book-paths`. It has no default source and requires
an explicit confirmation phrase:

```bash
BOOK_PATHS_DRAWINGS_DIR=/absolute/path/to/reviewed-assets \
BOOK_PATHS_SYNC_CONFIRM=replace-checked-assets \
npm run sync:book-paths-assets
npm run verify
git diff --stat
```

Review the complete diff. Never point the source at the destination, and never
deploy generated assets before the audit and a browser check.
