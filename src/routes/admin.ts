import { FastifyInstance } from 'fastify';
import { query } from '../db/pool';

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'mf_admin_master_key_2026';

function adminAuth(request: any, reply: any, done: any) {
  const key = request.headers['x-api-key'] || request.query?.key;
  if (key !== ADMIN_KEY) {
    reply.code(401).send({ error: 'Admin access required' });
    return;
  }
  done();
}

export function registerAdminRoutes(app: FastifyInstance) {
  // List all tenants
  app.get('/api/admin/tenants', { preHandler: adminAuth }, async () => {
    const tenants = (await query(
      `SELECT id, name, default_from, provider, rate_limit, branding, webhook_url, created_at FROM tenants ORDER BY name`
    )).rows;
    return { tenants };
  });

  // Create tenant
  app.post('/api/admin/tenants', { preHandler: adminAuth }, async (request) => {
    const { id, name, default_from, reply_to, provider, provider_config, branding, webhook_url, rate_limit } = request.body as any;
    const { v4: uuid } = await import('uuid');
    const apiKey = `mf_${id}_${uuid().replace(/-/g, '').slice(0, 24)}`;

    await query(`
      INSERT INTO tenants (id, name, api_key, default_from, reply_to, provider, provider_config, branding, webhook_url, rate_limit)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [id, name, apiKey, default_from, reply_to, provider || 'smtp', JSON.stringify(provider_config || {}), JSON.stringify(branding || {}), webhook_url, rate_limit || 100]);

    return { success: true, id, apiKey };
  });

  // Update tenant
  app.put('/api/admin/tenants/:id', { preHandler: adminAuth }, async (request) => {
    const { id } = request.params as any;
    const { name, default_from, reply_to, provider, provider_config, branding, webhook_url, rate_limit } = request.body as any;

    await query(`
      UPDATE tenants SET
        name = COALESCE($2, name), default_from = COALESCE($3, default_from),
        reply_to = COALESCE($4, reply_to), provider = COALESCE($5, provider),
        provider_config = COALESCE($6, provider_config), branding = COALESCE($7, branding),
        webhook_url = COALESCE($8, webhook_url), rate_limit = COALESCE($9, rate_limit),
        updated_at = NOW()
      WHERE id = $1
    `, [id, name, default_from, reply_to, provider, provider_config ? JSON.stringify(provider_config) : null, branding ? JSON.stringify(branding) : null, webhook_url, rate_limit]);

    return { success: true };
  });

  // Global stats
  app.get('/api/admin/stats', { preHandler: adminAuth }, async () => {
    const overall = (await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('sent','delivered')) as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
        COUNT(*) FILTER (WHERE status = 'queued') as queued
      FROM email_logs
    `)).rows[0];

    const byTenant = (await query(`
      SELECT tenant_id, COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('sent','delivered')) as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM email_logs
      GROUP BY tenant_id
    `)).rows;

    return { overall, byTenant };
  });

  // All logs (admin view)
  app.get('/api/admin/logs', { preHandler: adminAuth }, async (request) => {
    const { limit = 100, offset = 0, tenant_id, status } = request.query as any;
    let sql = `SELECT * FROM email_logs WHERE 1=1`;
    const params: any[] = [];

    if (tenant_id) { params.push(tenant_id); sql += ` AND tenant_id = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return { logs: (await query(sql, params)).rows };
  });
}
