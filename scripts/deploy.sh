#!/usr/bin/env bash
# Deploy dist/ to the production host using credentials from .env.deploy.
#
# Preserves remote uploads/ and api/data/ — those are runtime-managed by PHP
# and must NEVER be wiped by a deploy.
#
# Requires: lftp (brew install lftp)
#
#   FTP_HOST       hostname or IP
#   FTP_PORT       21 (FTP/FTPS) or 22 (SFTP)
#   FTP_USER       login
#   FTP_PASS       password
#   FTP_PROTOCOL   ftp | ftps | sftp
#   FTP_REMOTE_DIR remote path (e.g. /public_html)
#   LOCAL_DIR      local dir to upload (defaults to ./dist)

set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE="${ENV_FILE:-.env.deploy}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found." >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

: "${FTP_HOST:?FTP_HOST missing in $ENV_FILE}"
: "${FTP_USER:?FTP_USER missing in $ENV_FILE}"
: "${FTP_PASS:?FTP_PASS missing in $ENV_FILE}"
FTP_PROTOCOL="${FTP_PROTOCOL:-sftp}"
FTP_PORT="${FTP_PORT:-22}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-/public_html}"
LOCAL_DIR="${LOCAL_DIR:-./dist}"

if [[ ! -d "$LOCAL_DIR" ]]; then
  echo "ERROR: $LOCAL_DIR does not exist. Run 'npm run build:prod' first." >&2
  exit 1
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "ERROR: lftp not found. Install with: brew install lftp" >&2
  exit 1
fi

# Build the lftp connection URL.
case "$FTP_PROTOCOL" in
  sftp) URL="sftp://${FTP_HOST}:${FTP_PORT}" ;;
  ftps) URL="ftps://${FTP_HOST}:${FTP_PORT}" ;;
  ftp)  URL="ftp://${FTP_HOST}:${FTP_PORT}" ;;
  *)    echo "ERROR: unsupported FTP_PROTOCOL=$FTP_PROTOCOL" >&2; exit 1 ;;
esac

echo "Deploying $LOCAL_DIR → ${FTP_PROTOCOL}://${FTP_USER}@${FTP_HOST}:${FTP_PORT}${FTP_REMOTE_DIR}"
echo "  (preserving remote uploads/ and api/data/)"

# `mirror -R` = reverse mirror (local → remote)
# `--only-newer` skips unchanged files (timestamp-based)
# `--exclude-glob` keeps the runtime dirs intact on the remote
# `--parallel=4` modest concurrency
lftp -u "$FTP_USER","$FTP_PASS" "$URL" <<EOF
set sftp:auto-confirm yes
set ssl:verify-certificate no
set net:max-retries 2
set net:reconnect-interval-base 4
set mirror:use-pget-n 0
mirror --reverse \
       --only-newer \
       --parallel=4 \
       --verbose=1 \
       --exclude-glob 'uploads/projects/*' \
       --exclude-glob 'uploads/projects' \
       --exclude-glob 'api/data/*' \
       --exclude-glob 'api/data' \
       --exclude-glob '.DS_Store' \
       "$LOCAL_DIR" "$FTP_REMOTE_DIR"
bye
EOF

echo "Deploy complete."
