import { pool } from './pool';

const MIGRATIONS = `
-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  default_from TEXT NOT NULL,
  reply_to TEXT,
  provider TEXT NOT NULL DEFAULT 'smtp',
  provider_config JSONB NOT NULL DEFAULT '{}',
  branding JSONB NOT NULL DEFAULT '{}',
  webhook_url TEXT,
  rate_limit INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  mjml TEXT,
  html TEXT,
  text_body TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Default templates (tenant_id NULL = system default)
CREATE TABLE IF NOT EXISTS default_templates (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  mjml TEXT,
  html TEXT,
  text_body TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email logs
CREATE TABLE IF NOT EXISTS email_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id),
  message_id TEXT,
  "to" TEXT NOT NULL,
  "from" TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_slug TEXT,
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT,
  provider_response JSONB,
  error TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs("to");
`;

async function migrate() {
  console.log('Running migrations...');
  await pool.query(MIGRATIONS);
  console.log('Migrations complete.');
  await pool.end();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
