#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -eq 0 ]]; then
  echo "ERROR: run as a normal deployment user with sudo access, not as root." >&2
  exit 1
fi

APP_HOST="${APP_HOST:-}"
DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/fenius}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NGINX_SITE="/etc/nginx/sites-available/fenius.conf"

if [[ ! "${APP_HOST}" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "ERROR: APP_HOST must be a DNS hostname." >&2
  exit 1
fi
if [[ -n "$(git -C "${REPO_ROOT}" status --porcelain)" ]]; then
  echo "ERROR: deploy only from a clean, committed Fenius checkout." >&2
  exit 1
fi

for command in git node npm gzip sudo nginx curl; do
  command -v "${command}" >/dev/null || { echo "ERROR: missing command: ${command}" >&2; exit 1; }
done

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 18 || node_major > 22 )); then
  echo "ERROR: Fenius production builds require Node.js 18-22 (Node 20 LTS recommended)." >&2
  exit 1
fi

release_id="$(git -C "${REPO_ROOT}" rev-parse --short=12 HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"
release_dir="${DEPLOY_ROOT}/releases/${release_id}"
stage_dir="$(mktemp -d "${TMPDIR:-/tmp}/fenius-release.XXXXXX")"
old_target=""
next_link="${DEPLOY_ROOT}/.current-${release_id}"
config_backup=""
had_previous_site=false
site_was_enabled=false

cleanup() {
  [[ -d "${stage_dir}" ]] && rm -rf "${stage_dir}"
  [[ -n "${config_backup}" && -f "${config_backup}" ]] && rm -f "${config_backup}"
}
trap cleanup EXIT

restore_previous_deployment() {
  echo "==> Restoring the previous Fenius deployment" >&2
  if [[ -n "${old_target}" ]]; then
    rollback_link="${DEPLOY_ROOT}/.rollback-${release_id}"
    sudo ln -s "${old_target}" "${rollback_link}"
    sudo mv -Tf "${rollback_link}" "${DEPLOY_ROOT}/current"
  else
    sudo rm -f "${DEPLOY_ROOT}/current"
  fi

  if [[ "${had_previous_site}" == "true" ]]; then
    sudo install -m 0644 "${config_backup}" "${NGINX_SITE}"
  else
    sudo rm -f "${NGINX_SITE}"
  fi
  if [[ "${site_was_enabled}" != "true" ]]; then
    sudo rm -f /etc/nginx/sites-enabled/fenius.conf
  fi

  if sudo nginx -t; then
    sudo systemctl reload nginx
  else
    echo "WARNING: the previous Nginx configuration could not be reloaded; inspect it manually." >&2
  fi
}

echo "==> Installing locked dependencies and verifying the source tree"
cd "${REPO_ROOT}"
npm ci
npm audit --omit=dev --audit-level=high
npm run verify

echo "==> Staging production assets"
cp -a "${REPO_ROOT}/dist/." "${stage_dir}/"
find "${stage_dir}/book-paths" -type f -name '*.svg' -exec gzip -9 -k '{}' \;
rm -rf "${REPO_ROOT}/node_modules"

sudo install -d -m 0755 "${DEPLOY_ROOT}/releases"
available_kb="$(df -Pk "${DEPLOY_ROOT}" | awk 'NR==2 {print $4}')"
if [[ -z "${available_kb}" || "${available_kb}" -lt 1048576 ]]; then
  echo "ERROR: at least 1 GiB free is required under ${DEPLOY_ROOT}." >&2
  exit 1
fi
sudo mv "${stage_dir}" "${release_dir}"
stage_dir=""
sudo chown -R root:www-data "${release_dir}"
sudo find "${release_dir}" -type d -exec chmod 0755 '{}' \;
sudo find "${release_dir}" -type f -exec chmod 0644 '{}' \;

config_tmp="$(mktemp "${TMPDIR:-/tmp}/fenius-nginx.XXXXXX")"
sed -e "s|%%APP_HOST%%|${APP_HOST}|g" \
    -e "s|%%CURRENT_DIR%%|${DEPLOY_ROOT}/current|g" \
    "${REPO_ROOT}/ops/fenius.nginx.conf.template" > "${config_tmp}"

config_backup="$(mktemp "${TMPDIR:-/tmp}/fenius-nginx-previous.XXXXXX")"
if sudo test -f "${NGINX_SITE}"; then
  sudo cat "${NGINX_SITE}" > "${config_backup}"
  had_previous_site=true
fi
if sudo test -e /etc/nginx/sites-enabled/fenius.conf \
  || sudo test -L /etc/nginx/sites-enabled/fenius.conf; then
  site_was_enabled=true
fi
if sudo test -e /etc/nginx/sites-enabled/fenius.conf \
  && ! sudo test -L /etc/nginx/sites-enabled/fenius.conf; then
  echo "ERROR: /etc/nginx/sites-enabled/fenius.conf exists but is not a symlink; preserve it explicitly before deploying." >&2
  exit 1
fi

sudo install -m 0644 "${config_tmp}" "${NGINX_SITE}"
rm -f "${config_tmp}"
sudo ln -sfn "${NGINX_SITE}" /etc/nginx/sites-enabled/fenius.conf

if [[ -L "${DEPLOY_ROOT}/current" ]]; then
  old_target="$(readlink "${DEPLOY_ROOT}/current")"
fi
sudo ln -s "${release_dir}" "${next_link}"
sudo mv -Tf "${next_link}" "${DEPLOY_ROOT}/current"

if ! sudo nginx -t; then
  echo "ERROR: nginx validation failed." >&2
  restore_previous_deployment
  exit 1
fi

sudo systemctl reload nginx
if ! curl -fsS -H "Host: ${APP_HOST}" http://127.0.0.1/ | grep -q '<div id="app"></div>'; then
  echo "ERROR: local smoke test failed after activation." >&2
  restore_previous_deployment
  exit 1
fi

echo "==> Fenius release ${release_id} is serving locally through nginx"
echo "Configure or verify TLS for https://${APP_HOST}; this script does not alter certificates or firewall rules."
echo "Old releases remain under ${DEPLOY_ROOT}/releases for manual rollback."
