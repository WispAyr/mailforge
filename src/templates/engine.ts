import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import { query } from '../db/pool';

interface TemplateResult {
  subject: string;
  html: string;
  text: string;
}

export async function renderTemplate(
  tenantId: string,
  slug: string,
  data: Record<string, any>,
  branding: Record<string, any> = {}
): Promise<TemplateResult> {
  // Look for tenant-specific template first, then default
  let row = (await query(
    'SELECT subject, mjml, html, text_body FROM templates WHERE tenant_id = $1 AND slug = $2',
    [tenantId, slug]
  )).rows[0];

  if (!row) {
    row = (await query(
      'SELECT subject, mjml, html, text_body FROM default_templates WHERE slug = $1',
      [slug]
    )).rows[0];
  }

  if (!row) {
    throw new Error(`Template not found: ${slug}`);
  }

  const mergedData = {
    ...branding,
    brandName: branding.name || tenantId,
    brandColor: branding.color || '#333333',
    footerText: branding.footerText || '',
    ...data,
  };

  const subject = Handlebars.compile(row.subject)(mergedData);

  let html = '';
  if (row.mjml) {
    // Compile handlebars in MJML first, then convert to HTML
    const compiledMjml = Handlebars.compile(row.mjml)(mergedData);
    const mjmlResult = mjml2html(compiledMjml, { validationLevel: 'soft' });
    html = mjmlResult.html;
  } else if (row.html) {
    html = Handlebars.compile(row.html)(mergedData);
  }

  const text = row.text_body ? Handlebars.compile(row.text_body)(mergedData) : '';

  return { subject, html, text };
}
