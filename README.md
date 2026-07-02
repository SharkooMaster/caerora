# Caerora

A marketing-ready makeup e-commerce platform for the **Caerora** brand (_Beauty. Elevated._).

- **Backend:** Django + Django REST Framework, Postgres, Celery/Redis, Stripe, Resend
- **Frontend:** Next.js (App Router) + Tailwind, branded minimal storefront
- **Infra:** Docker Compose (Postgres, Redis, Django/Gunicorn, Celery worker, Next.js, nginx)

## Features

- Catalog with **product variants** (shades/sizes), images, categories — managed from Django admin
- Moderated **product reviews** with verified-purchase badges
- **Multi-region shipping** zones with per-zone currency, VAT and free-shipping thresholds
- Simple, user-friendly **guest checkout** (optional accounts) with **Stripe** Payment Element
- **Resend** transactional emails (order confirmation, shipping notification) via Celery
- Admin **fulfillment inbox** (paid orders with new/processing/shipped/delivered workflow)
- **GDPR**: non-blocking cookie consent, consent audit trail, marketing opt-in
- **Hybrid analytics**: first-party event tracking (page views, product views + dwell time,
  add-to-cart, checkout, purchase) feeding an in-admin **funnel/KPI dashboard** (CTR, conversion,
  AOV, time-on-product), **plus** GA4 + Meta Pixel (consent-gated) and server-side GA4 Measurement
  Protocol + Meta Conversions API purchase events for reliable ad attribution
- **SEO/marketing ready**: metadata, OpenGraph, JSON-LD product/rating structured data, sitemap, robots

## Quick start (Docker)

```bash
cp .env.example .env
# edit .env: set DJANGO_SECRET_KEY, Stripe/Resend keys, superuser, etc.

# Seed demo products on first boot:
echo "SEED_ON_START=1" >> .env

docker compose up -d --build
```

Then open:

- Storefront (frontend): <http://localhost:8092>
- Django API + admin (backend): <http://localhost:8091/admin/> (login with the `DJANGO_SUPERUSER_*` you set)
- Marketing dashboard: <http://localhost:8091/admin/analytics/event/dashboard/>

Ports are configurable via `FRONTEND_PORT` (default 8092) and `BACKEND_PORT` (default 8091) in `.env`.
If you change them, also update `SITE_URL`/`FRONTEND_ORIGIN`/`NEXT_PUBLIC_SITE_URL` (frontend) and
`BACKEND_ORIGIN`/`NEXT_PUBLIC_API_BASE_URL`/`MEDIA_PUBLIC_BASE_URL` (backend) to match, then rebuild
the frontend (`docker compose build frontend`) since the `NEXT_PUBLIC_*` values are baked at build time.

After the first successful boot you can remove `SEED_ON_START=1` from `.env`.

## Configuration

All configuration is via environment variables — see [`.env.example`](.env.example). Key groups:

| Group | Variables |
| --- | --- |
| Core | `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `SITE_URL`, `FRONTEND_ORIGIN` |
| Database | `POSTGRES_*` |
| Async | `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Email | `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL` |
| Ads (public) | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` |
| Ads (server) | `GA4_API_SECRET`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_PIXEL_ID` |
| Frontend | `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |

> The app degrades gracefully when integrations are not configured: with no Stripe keys the order
> is still created (payment step is skipped), and with no Resend key emails are logged instead of sent.

## Stripe webhook

Point a Stripe webhook to `https://<your-domain>/api/payments/webhook/` for the events
`payment_intent.succeeded` and `payment_intent.payment_failed`, and set `STRIPE_WEBHOOK_SECRET`.
For local testing: `stripe listen --forward-to localhost:8091/api/payments/webhook/`.

## Marketing & ad integration

1. Set `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID` and `NEXT_PUBLIC_TIKTOK_PIXEL_ID`
   to enable client-side GA4 + Meta Pixel + TikTok Pixel (loaded only after the visitor consents;
   Google tags run with Consent Mode v2 signals).
2. Set `NEXT_PUBLIC_GOOGLE_ADS_ID` (AW-…) and `NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL` to fire the
   Google Ads purchase conversion on the thank-you page.
3. Set `GA4_API_SECRET` and `META_CAPI_*` to enable server-side purchase conversions from the Stripe
   webhook (more reliable than browser-only tracking). Client + server purchases are deduplicated by
   the order number (GA4 `transaction_id`, Meta `event_id`).
4. UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`, ...) are captured automatically and
   attached to events and orders, so the admin dashboard can break down performance by campaign.

## Deployment (Kubernetes + CI/CD)

Production (`caerora.com`) and staging (`dev.caerora.com`) run on a k3s cluster,
deployed via GitHub Actions + Argo CD (GitOps):

- `deploy/` - Kustomize base + `overlays/dev` and `overlays/prod`.
- `argocd/` - Argo CD `Application`s (`develop` -> dev, `main` -> prod).
- `cluster/` - one-time bootstrap (ingress-nginx, cert-manager, Argo CD, edge proxy, secrets). See [cluster/README.md](cluster/README.md).
- `.github/workflows/` - `ci.yml` (PR checks) and `build-deploy.yml` (build images -> GHCR, bump overlay tag).

Push to `develop` deploys to `dev.caerora.com`; push to `main` deploys to `caerora.com`.

## Local development (without Docker)

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DJANGO_SETTINGS_MODULE=caerora.settings.dev
python manage.py migrate
python manage.py seed_demo
python manage.py ensure_superuser   # uses DJANGO_SUPERUSER_* env vars
python manage.py runserver
# (separately) celery -A caerora worker -l info
```

Frontend:

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000  (set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api)
```

## Managing products

Add and edit products from the Django admin (`/admin/`):

- **Catalog → Products**: create a product, add images and variants (each variant has its own
  price, stock, SKU and optional shade swatch color) inline.
- **Reviews**: moderate incoming reviews (approve/reject).
- **Shipping**: define zones (countries, currency, VAT) and rates (price, free-over threshold, ETA).
- **Orders**: use the "fulfillment inbox" filter to see open paid orders and mark them
  processing/shipped/delivered (shipping triggers a customer email).

## Project structure

```
backend/    Django project (apps: catalog, reviews, shipping, orders, payments, emails, accounts, analytics, core)
frontend/   Next.js storefront (App Router, Tailwind, Stripe Elements)
nginx/      Reverse proxy config
docker-compose.yml
```
