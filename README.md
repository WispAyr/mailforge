# MailForge 🔥

Multi-tenant transactional email service for the Local Connect ecosystem.

## Features
- **REST API** — Send templated or raw emails via simple HTTP calls
- **Multi-Tenant** — Per-tenant config, branding, templates, API keys
- **Template Engine** — Handlebars + MJML for responsive HTML emails
- **Provider Abstraction** — SMTP, Resend (future: SendGrid, SES, Mailgun)
- **Queue & Retry** — BullMQ with exponential backoff, dead letter queue
- **Tracking** — Open pixel, click tracking, delivery status
- **Dashboard** — Admin UI at `/dashboard/`
- **Webhook Callbacks** — Notify apps of delivery events
- **Legacy Compatible** — Old `/send` endpoint still works

## Quick Start

```bash
npm install
npm run build
npm run migrate   # Create tables
npm run seed      # Create tenants + default templates
npm start         # Start server + worker
```

## API

### Send via Template
```bash
curl -X POST http://localhost:3880/api/send \
  -H "x-api-key: YOUR_TENANT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","template":"order-confirmation","data":{"orderNumber":"PU-1234","total":"£9.50"}}'
```

### Send Raw
```bash
curl -X POST http://localhost:3880/api/send/raw \
  -H "x-api-key: YOUR_TENANT_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Hello","html":"<h1>Hi</h1>","text":"Hi"}'
```

### Admin Endpoints
- `GET /api/admin/tenants` — List tenants
- `POST /api/admin/tenants` — Create tenant
- `GET /api/admin/stats` — Global stats
- `GET /api/admin/logs` — All email logs

All admin endpoints require `x-api-key: ADMIN_API_KEY`

## Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3880 | Server port |
| DATABASE_URL | postgresql://mailforge:mailforge@localhost:5432/mailforge | Postgres connection |
| REDIS_URL | redis://localhost:6379 | Redis for BullMQ |
| BASE_URL | http://localhost:3880 | Public URL (for tracking) |
| TRACKING_ENABLED | true | Enable open/click tracking |
| ADMIN_API_KEY | mf_admin_master_key_2026 | Admin dashboard key |

## Default Templates
- `order-confirmation` — Order confirmed with items
- `order-ready` — Ready for collection
- `welcome` — Account created
- `password-reset` — Password reset link
- `receipt` — Receipt/invoice
- `notification` — Generic alert
