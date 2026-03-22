import { FastifyInstance } from 'fastify';
import { query } from '../db/pool';
import { authenticateTenant } from './auth';

export function registerTemplateRoutes(app: FastifyInstance) {
  // List templates (tenant-specific + defaults)
  app.get('/api/templates', { preHandler: authenticateTenant }, async (request) => {
    const tenant = (request as any).tenant;

    const tenantTemplates = (await query(
      'SELECT id, slug, name, subject, created_at, updated_at FROM templates WHERE tenant_id = $1 ORDER BY slug',
      [tenant.id]
    )).rows;

    const defaults = (await query(
      'SELECT id, slug, name, subject, created_at FROM default_templates ORDER BY slug'
    )).rows.map(r => ({ ...r, is_default: true }));

    return { templates: tenantTemplates, defaults };
  });

  // Get single template
  app.get('/api/templates/:slug', { preHandler: authenticateTenant }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const { slug } = request.params as any;

    let row = (await query(
      'SELECT * FROM templates WHERE tenant_id = $1 AND slug = $2', [tenant.id, slug]
    )).rows[0];

    if (!row) {
      row = (await query('SELECT * FROM default_templates WHERE slug = $1', [slug])).rows[0];
      if (row) row.is_default = true;
    }

    if (!row) return reply.code(404).send({ error: 'Template not found' });
    return row;
  });

  // Create/update tenant template
  app.post('/api/templates', { preHandler: authenticateTenant }, async (request) => {
    const tenant = (request as any).tenant;
    const { slug, name, subject, mjml, html, text_body } = request.body as any;

    const result = await query(`
      INSERT INTO templates (tenant_id, slug, name, subject, mjml, html, text_body)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id, slug) DO UPDATE SET
        name = EXCLUDED.name, subject = EXCLUDED.subject, mjml = EXCLUDED.mjml,
        html = EXCLUDED.html, text_body = EXCLUDED.text_body, updated_at = NOW()
      RETURNING *
    `, [tenant.id, slug, name, subject, mjml, html, text_body]);

    return result.rows[0];
  });

  // Delete tenant template
  app.delete('/api/templates/:slug', { preHandler: authenticateTenant }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const { slug } = request.params as any;
    await query('DELETE FROM templates WHERE tenant_id = $1 AND slug = $2', [tenant.id, slug]);
    return { success: true };
  });
}
