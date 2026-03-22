import { Queue, Worker, Job } from 'bullmq';
import { config } from '../config';
import { query } from '../db/pool';
import { sendEmail } from '../providers';
import { renderTemplate } from '../templates/engine';
import { injectTracking } from '../tracking/tracker';

const connection = config.redisUrl as any;

export const emailQueue = new Queue('mailforge-emails', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 30000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

interface EmailJobData {
  emailId: string;
  tenantId: string;
  to: string;
  from: string;
  subject?: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, any>;
  replyTo?: string;
  attachments?: any[];
}

export function createWorker() {
  const worker = new Worker('mailforge-emails', async (job: Job<EmailJobData>) => {
    const { emailId, tenantId, to, template, data, attachments } = job.data;
    let { from, subject, html, text, replyTo } = job.data;

    try {
      const tenant = (await query('SELECT * FROM tenants WHERE id = $1', [tenantId])).rows[0];
      if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);

      from = from || tenant.default_from;
      replyTo = replyTo || tenant.reply_to;

      if (template) {
        const rendered = await renderTemplate(tenantId, template, data || {}, tenant.branding);
        subject = rendered.subject;
        html = rendered.html;
        text = rendered.text;
      }

      if (!subject) throw new Error('No subject provided');

      if (html) {
        html = injectTracking(html, emailId);
      }

      await query(`UPDATE email_logs SET status = 'sending', updated_at = NOW() WHERE id = $1`, [emailId]);

      const result = await sendEmail(tenant.provider, tenant.provider_config, {
        from, to, subject, html, text, replyTo, attachments,
      });

      await query(
        `UPDATE email_logs SET status = 'sent', message_id = $2, provider = $3, provider_response = $4, delivered_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [emailId, result.messageId, tenant.provider, JSON.stringify(result)]
      );

      if (tenant.webhook_url) {
        fireWebhook(tenant.webhook_url, { event: 'delivered', emailId, to, messageId: result.messageId }).catch(() => {});
      }

      return result;
    } catch (err: any) {
      await query(`UPDATE email_logs SET status = 'failed', error = $2, updated_at = NOW() WHERE id = $1`, [emailId, err.message]);
      throw err;
    }
  }, {
    connection,
    concurrency: 10,
    limiter: { max: 50, duration: 1000 },
  });

  worker.on('failed', (job, err) => {
    console.error(`[MailForge] Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.log(`[MailForge] Job ${job.id} completed`);
  });

  return worker;
}

async function fireWebhook(url: string, payload: any) {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  });
}
