import { Resend } from 'resend';

export async function sendViaResend(apiKey: string, options: {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}) {
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: options.from,
    to: [options.to],
    subject: options.subject,
    html: options.html || '',
    text: options.text,
    replyTo: options.replyTo,
  } as any);
  return { messageId: result.data?.id, response: result };
}
