#!/usr/bin/env bash
# Create/update the caerora-secrets Secret in a namespace from a local env file.
# Usage: ./create-secrets.sh <dev|prod>
# Requires kubectl pointed at the cluster. The Secret is applied directly (kept
# out of git). For a fully GitOps secret instead, use seal-secrets.sh.
set -euo pipefail

ENVNAME="${1:?usage: create-secrets.sh <dev|prod>}"
NS="caerora-${ENVNAME}"
ENV_FILE="$(dirname "$0")/secrets.${ENVNAME}.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy secrets.env.example and fill it in)." >&2
  exit 1
fi

kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic caerora-secrets \
  --namespace "$NS" \
  --from-env-file="$ENV_FILE" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Applied caerora-secrets to namespace $NS."
