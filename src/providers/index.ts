import { sendViaSMTP } from './smtp';
import { sendViaResend } from './resend';

export interface SendOptions {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: any[];
}

export async function sendEmail(provider: string, providerConfig: any, options: SendOptions) {
  switch (provider) {
    case 'smtp':
      return sendViaSMTP(providerConfig, options);
    case 'resend':
      return sendViaResend(providerConfig.apiKey, options);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
