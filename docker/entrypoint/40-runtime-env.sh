#!/bin/sh
set -eu

TEMPLATE="/usr/share/nginx/html/runtime-config.js.template"
OUTPUT="/usr/share/nginx/html/runtime-config.js"

if [ -f "$TEMPLATE" ]; then
  echo "Generating runtime-config.js from template..."
  envsubst '${SUPABASE_URL} ${SUPABASE_ANON_KEY}' < "$TEMPLATE" > "$OUTPUT"
else
  echo "runtime-config.js.template not found; skipping runtime config generation."
fi

