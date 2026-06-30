# Caerora cluster bootstrap

One-time, **additive** setup to host `caerora.com` (prod) and `dev.caerora.com`
(staging) on the existing k3s cluster. Nothing here modifies mail or existing
k3s workloads (Traefik, crossv9, etc.).

## Topology

- Public IP `78.68.103.19` -> router `192.168.50.1`.
- Mail ports (25/465/587/993/995) -> mailcow VM `192.168.50.60` (unchanged).
- 80/443 -> edge VM (HAProxy) -> SNI/Host split:
  - `mail|mta-sts|autoconfig|autodiscover.caerora.com` -> mailcow `192.168.50.60` (TLS passthrough).
  - everything else -> `caerora-nginx` ingress `192.168.50.75`.
- Website runs in k3s namespaces `caerora-prod` / `caerora-dev`, deployed by Argo CD.

## 1. Edge proxy (HAProxy)

Runs on a small isolated box/VM that receives the router's 80/443 forward.
Config: [edge/haproxy.cfg](edge/haproxy.cfg). Validate the mailcow passthrough
on the LAN *before* repointing the router:

```bash
# from a LAN host, with the edge already running:
curl -k --resolve mail.caerora.com:443:<EDGE_IP> https://mail.caerora.com/ -I
curl -k --resolve caerora.com:443:<EDGE_IP>      https://caerora.com/ -I
```

## 2. Cluster components (run once, with kubectl/helm against the cluster)

```bash
# ingress-nginx (dedicated class + MetalLB IP 192.168.50.75)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install caerora-ingress ingress-nginx/ingress-nginx \
  -n caerora-ingress --create-namespace \
  -f ingress-nginx-values.yaml

# cert-manager
helm upgrade --install cert-manager jetstack/cert-manager \
  -n cert-manager --create-namespace --set crds.enabled=true
kubectl apply -f letsencrypt-clusterissuer.yaml

# Argo CD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# (optional) sealed-secrets controller for GitOps secrets
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets -n kube-system
```

## 3. Secrets

Per environment, fill `secrets.<env>.env` (see `secrets.env.example`) and either:

```bash
./create-secrets.sh dev     # applies caerora-secrets directly (kept out of git)
./create-secrets.sh prod
```

or, for fully-GitOps secrets, `./seal-secrets.sh <env>` and commit the result.

## 4. Argo CD Applications

Replace `REPLACE_OWNER` in `../argocd/*.yaml` with the GitHub owner, then:

```bash
kubectl apply -f ../argocd/app-dev.yaml
kubectl apply -f ../argocd/app-prod.yaml
```

## 5. DNS

- `caerora.com` A -> `78.68.103.19`
- `www.caerora.com` A -> `78.68.103.19`
- `dev.caerora.com` A -> `78.68.103.19`
- mail records (MX/SPF/DKIM/DMARC/MTA-STS) unchanged.

## 6. Cutover

Repoint the router's 80/443 forward from the mailcow VM to the edge VM. Mail
ports stay forwarded to `192.168.50.60`. Verify the site issues a Let's Encrypt
cert and that mailcow UI + MTA-STS + cert renewal still work.
