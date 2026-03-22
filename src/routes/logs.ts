import { FastifyInstance } from 'fastify';
import { query } from '../db/pool';
import { authenticateTenant } from './auth';

export function registerLogRoutes(app: FastifyInstance) {
  app.get('/api/logs', { preHandler: authenticateTenant }, async (request) => {
    const tenant = (request as any).tenant;
    const { limit = 50, offset = 0, status } = request.query as any;

    let sql = `SELECT id, "to", "from", subject, template_slug, status, error, opened_at, clicked_at, delivered_at, created_at
               FROM email_logs WHERE tenant_id = $1`;
    const params: any[] = [tenant.id];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const logs = (await query(sql, params)).rows;
    const total = (await query('SELECT COUNT(*) FROM email_logs WHERE tenant_id = $1', [tenant.id])).rows[0].count;

    return { logs, total: parseInt(total), limit, offset };
  });

  app.get('/api/stats', { preHandler: authenticateTenant }, async (request) => {
    const tenant = (request as any).tenant;
    const { days = 30 } = request.query as any;

    const stats = (await query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'sent' OR status = 'delivered') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened,
        COUNT(*) FILTER (WHERE clicked_at IS NOT NULL) as clicked,
        COUNT(*) FILTER (WHERE status = 'queued') as queued
      FROM email_logs
      WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
    `, [tenant.id, days])).rows[0];

    // Daily breakdown
    const daily = (await query(`
      SELECT DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('sent','delivered')) as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened
      FROM email_logs
      WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '1 day' * $2
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [tenant.id, days])).rows;

    return { stats, daily };
  });
}
