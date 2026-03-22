import { config } from '../config';
import { query } from '../db/pool';

// 1x1 transparent GIF
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export function injectTracking(html: string, emailId: string): string {
  if (!config.trackingEnabled || !html) return html;

  // Open tracking pixel
  const pixel = `<img src="${config.baseUrl}/t/o/${emailId}" width="1" height="1" style="display:none" />`;
  html = html.replace('</body>', `${pixel}</body>`);

  // Click tracking — rewrite links
  html = html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
    const encoded = Buffer.from(url).toString('base64url');
    return `href="${config.baseUrl}/t/c/${emailId}/${encoded}"`;
  });

  return html;
}

export async function recordOpen(emailId: string) {
  await query(
    `UPDATE email_logs SET opened_at = COALESCE(opened_at, NOW()), updated_at = NOW() WHERE id = $1`,
    [emailId]
  );
  return PIXEL;
}

export async function recordClick(emailId: string, encodedUrl: string): Promise<string> {
  const url = Buffer.from(encodedUrl, 'base64url').toString();
  await query(
    `UPDATE email_logs SET clicked_at = COALESCE(clicked_at, NOW()), updated_at = NOW() WHERE id = $1`,
    [emailId]
  );
  return url;
}
