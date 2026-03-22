import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config';
import { registerSendRoutes } from './routes/send';
import { registerTemplateRoutes } from './routes/templates';
import { registerLogRoutes } from './routes/logs';
import { registerTrackingRoutes } from './routes/tracking';
import { registerAdminRoutes } from './routes/admin';
import { createWorker } from './queue/emailQueue';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  // Serve dashboard static files
  try {
    await app.register(fastifyStatic, {
      root: path.join(__dirname, '../dashboard/dist'),
      prefix: '/dashboard/',
    });
  } catch {}

  // Routes
  registerSendRoutes(app);
  registerTemplateRoutes(app);
  registerLogRoutes(app);
  registerTrackingRoutes(app);
  registerAdminRoutes(app);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    service: 'mailforge',
    version: '1.0.0',
    uptime: process.uptime(),
  }));

  // Backward compatibility with old relay endpoint
  app.post('/send', async (request, reply) => {
    const body = request.body as any;
    const apiKey = request.headers['x-api-key'] || (request.query as any).key;
    if (apiKey === 'skynet-mail-relay-key-2026') {
      // Legacy relay mode — send directly via SMTP without queue
      const nodemailer = await import('nodemailer');
      const LEGACY_ACCOUNTS: Record<string, any> = {
        'no-reply@ayrpavilion.com': {
          host: 'mail.ayrpavilion.com', port: 465, secure: true,
          auth: { user: 'no-reply@ayrpavilion.com', pass: 'RBTeeyKM142!' },
        },
        'noreply@kylerise.info': {
          host: 'mail.kylerise.info', port: 465, secure: true,
          auth: { user: 'noreply@kylerise.info', pass: 'RBTeeyKM142!' },
        },
      };

      const match = (body.from || '').match(/<(.+?)>/) || [null, body.from];
      const email = (match[1] || '').toLowerCase().trim();
      const account = LEGACY_ACCOUNTS[email];
      if (!account) return reply.code(400).send({ error: `No SMTP account for: ${body.from}` });

      const transporter = nodemailer.default.createTransport(account);
      const info = await transporter.sendMail({
        from: body.from, to: body.to, subject: body.subject,
        html: body.html, text: body.text, replyTo: body.replyTo,
        attachments: body.attachments?.map((a: any) => ({
          filename: a.filename, content: Buffer.from(a.content, 'base64'),
          contentType: a.contentType, cid: a.cid,
        })),
      });
      return { success: true, messageId: info.messageId };
    }
    return reply.code(401).send({ error: 'Unauthorized' });
  });

  // Start worker in same process
  const worker = createWorker();
  console.log('[MailForge] Email worker started');

  await app.listen({ port: config.port, host: config.host });
  console.log(`[MailForge] Server running on ${config.host}:${config.port}`);
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
