#!/usr/bin/env bash
# Exercises the SMTP receiver's catch-all + no-relay boundary using swaks.
# Run smtp-receiver locally first (e.g. `npm run dev:smtp` with MAIL_DOMAIN=test.local
# and SMTP_PORT=2525), then run this script.
#
# Install swaks first if needed: brew install swaks

set -euo pipefail

HOST="${SMTP_HOST:-127.0.0.1}"
PORT="${SMTP_PORT:-2525}"
DOMAIN="${MAIL_DOMAIN:-test.local}"

if ! command -v swaks >/dev/null 2>&1; then
  echo "swaks not found. Install it with: brew install swaks" >&2
  exit 1
fi

echo "== 1. Valid catch-all delivery (expect 250 accepted) =="
swaks --to "randomtest123@${DOMAIN}" --from "sender@example.com" \
      --server "$HOST" --port "$PORT" \
      --header "Subject: Hello from test script" \
      --body "This is a test message."

echo
echo "== 2. Delivery to a non-owned domain (expect 550 rejected - proves no-relay) =="
set +e
swaks --to "someone@not-owned-domain.example" --from "sender@example.com" \
      --server "$HOST" --port "$PORT" --body "Should be rejected"
set -e

echo
echo "== 3. Done. Check MongoDB: db.messages.findOne({ to: \"randomtest123@${DOMAIN}\" }) =="
