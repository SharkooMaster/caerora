#!/usr/bin/env bash
# Optional GitOps path: turn a local secrets.<env>.env into a committed
# SealedSecret that only this cluster can decrypt.
# Usage: ./seal-secrets.sh <dev|prod>
# Requires: kubeseal CLI + the sealed-secrets controller installed in-cluster.
# Output: deploy/overlays/<env>/sealed-secret.yaml  (add it to that overlay's
# kustomization.yaml resources list, then commit).
set -euo pipefail

ENVNAME="${1:?usage: seal-secrets.sh <dev|prod>}"
NS="caerora-${ENVNAME}"
ENV_FILE="$(dirname "$0")/secrets.${ENVNAME}.env"
OUT="$(dirname "$0")/../deploy/overlays/${ENVNAME}/sealed-secret.yaml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy secrets.env.example and fill it in)." >&2
  exit 1
fi

kubectl create secret generic caerora-secrets \
  --namespace "$NS" \
  --from-env-file="$ENV_FILE" \
  --dry-run=client -o yaml \
  | kubeseal --controller-namespace kube-system --format yaml > "$OUT"

echo "Wrote $OUT"
echo "Add 'sealed-secret.yaml' to deploy/overlays/${ENVNAME}/kustomization.yaml resources, then commit."
