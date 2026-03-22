import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { query } from '../db/pool';
import { emailQueue } from '../queue/emailQueue';
import { authenticateTenant } from './auth';

export function registerSendRoutes(app: FastifyInstance) {
  // Send via template
  app.post('/api/send', { preHandler: authenticateTenant }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const body = request.body as any;
    const { to, template, data, from, replyTo, attachments } = body;

    if (!to) return reply.code(400).send({ error: 'Missing "to"' });
    if (!template) return reply.code(400).send({ error: 'Missing "template"' });

    const emailId = uuid();
    await query(
      `INSERT INTO email_logs (id, tenant_id, "to", "from", subject, template_slug, template_data, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued')`,
      [emailId, tenant.id, to, from || tenant.default_from, '(template: ' + template + ')', template, JSON.stringify(data || {})]
    );

    await emailQueue.add('send', {
      emailId, tenantId: tenant.id, to, from, template, data, replyTo, attachments,
    });

    return { success: true, emailId };
  });

  // Send raw email
  app.post('/api/send/raw', { preHandler: authenticateTenant }, async (request, reply) => {
    const tenant = (request as any).tenant;
    const body = request.body as any;
    const { to, subject, html, text, from, replyTo, attachments } = body;

    if (!to || !subject) return reply.code(400).send({ error: 'Missing "to" or "subject"' });
    if (!html && !text) return reply.code(400).send({ error: 'Missing "html" or "text"' });

    const emailId = uuid();
    await query(
      `INSERT INTO email_logs (id, tenant_id, "to", "from", subject, status)
       VALUES ($1, $2, $3, $4, $5, 'queued')`,
      [emailId, tenant.id, to, from || tenant.default_from, subject]
    );

    await emailQueue.add('send', {
      emailId, tenantId: tenant.id, to, from, subject, html, text, replyTo, attachments,
    });

    return { success: true, emailId };
  });
}
