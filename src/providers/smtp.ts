import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
}

const transporters = new Map<string, Transporter>();

function getTransporter(config: SmtpConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.auth.user}`;
  if (!transporters.has(key)) {
    transporters.set(key, nodemailer.createTransport(config));
  }
  return transporters.get(key)!;
}

export async function sendViaSMTP(config: SmtpConfig, options: {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: any[];
}) {
  const transporter = getTransporter(config);
  const result = await transporter.sendMail(options);
  return { messageId: result.messageId, response: result.response };
}
