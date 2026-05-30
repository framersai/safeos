#!/usr/bin/env bash
#
# Pull the SafeOS Guardian vision models into the local Ollama cache.
#
# The models map to the three analysis tiers in src/lib/ollama/models.ts:
#   moondream             - triage   (~830 MB download, ~2 GB RAM)
#   llava:7b              - analysis (~4.5 GB download, ~8 GB RAM)
#   llama3.2-vision:11b   - complex  (~7 GB download, ~16 GB RAM)
#
# Usage:
#   ./scripts/pull-ollama-models.sh                      # uses $OLLAMA_MODELS or the default set
#   ./scripts/pull-ollama-models.sh moondream llava:7b   # explicit list
#   OLLAMA_HOST=http://my-host:11434 ./scripts/pull-ollama-models.sh
#
# This script targets a host that has the `ollama` CLI installed. To pull
# inside the Docker stack instead, the `ollama-pull` compose service does the
# same thing automatically on `docker compose up`.

set -euo pipefail

OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
export OLLAMA_HOST

# Args override $OLLAMA_MODELS, which overrides the default set.
if [ "$#" -gt 0 ]; then
  MODELS="$*"
else
  MODELS="${OLLAMA_MODELS:-moondream llava:7b}"
fi
MODELS="$(printf '%s' "$MODELS" | tr ',' ' ')"

echo "Ollama host : $OLLAMA_HOST"
echo "Models      : $MODELS"

if ! command -v ollama >/dev/null 2>&1; then
  echo "error: the 'ollama' CLI is not installed or not on PATH." >&2
  echo "Install it from https://ollama.com/download, or use the docker-compose stack." >&2
  exit 1
fi

# Wait for the Ollama server to answer (up to ~60s).
echo "Waiting for Ollama to be reachable ..."
for i in $(seq 1 30); do
  if curl -fsS "$OLLAMA_HOST/api/tags" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "error: Ollama did not become reachable at $OLLAMA_HOST" >&2
    exit 1
  fi
  sleep 2
done

for m in $MODELS; do
  echo ">> ollama pull $m"
  ollama pull "$m"
done

echo
echo "Cached models:"
ollama list
