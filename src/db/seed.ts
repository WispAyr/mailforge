import { pool } from './pool';
import { v4 as uuid } from 'uuid';

const DEFAULT_TEMPLATES = [
  {
    slug: 'order-confirmation',
    name: 'Order Confirmation',
    subject: 'Order Confirmed — {{orderNumber}}',
    mjml: `<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Helvetica, Arial, sans-serif" />
      <mj-text font-size="14px" color="#333" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="{{brandColor}}" padding="20px">
      <mj-column><mj-text color="#fff" font-size="22px" font-weight="bold">{{brandName}}</mj-text></mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="30px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">Order Confirmed ✓</mj-text>
        <mj-text>Hi {{customerName}},</mj-text>
        <mj-text>Your order <strong>{{orderNumber}}</strong> has been confirmed.</mj-text>
        <mj-text>{{#if items}}<strong>Items:</strong></mj-text>
        <mj-text>{{#each items}}<br/>• {{this.name}} — {{this.price}}{{/each}}{{/if}}</mj-text>
        <mj-text font-size="18px" font-weight="bold">Total: {{total}}</mj-text>
        <mj-text>{{#if estimatedTime}}Estimated ready: {{estimatedTime}}{{/if}}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="10px">
      <mj-column><mj-text font-size="11px" color="#999" align="center">{{footerText}}</mj-text></mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
    text_body: 'Order {{orderNumber}} confirmed.\n{{#each items}}• {{this.name}} — {{this.price}}\n{{/each}}Total: {{total}}'
  },
  {
    slug: 'order-ready',
    name: 'Order Ready for Collection',
    subject: 'Your order {{orderNumber}} is ready!',
    mjml: `<mjml>
  <mj-head><mj-attributes><mj-all font-family="Helvetica, Arial, sans-serif" /><mj-text font-size="14px" color="#333" /></mj-attributes></mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="{{brandColor}}" padding="20px">
      <mj-column><mj-text color="#fff" font-size="22px" font-weight="bold">{{brandName}}</mj-text></mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="30px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">🎉 Your order is ready!</mj-text>
        <mj-text>Order <strong>{{orderNumber}}</strong> is ready for collection{{#if collectionPoint}} at {{collectionPoint}}{{/if}}.</mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="10px">
      <mj-column><mj-text font-size="11px" color="#999" align="center">{{footerText}}</mj-text></mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
    text_body: 'Your order {{orderNumber}} is ready for collection{{#if collectionPoint}} at {{collectionPoint}}{{/if}}.'
  },
  {
    slug: 'welcome',
    name: 'Welcome / Account Created',
    subject: 'Welcome to {{brandName}}!',
    mjml: `<mjml>
  <mj-head><mj-attributes><mj-all font-family="Helvetica, Arial, sans-serif" /><mj-text font-size="14px" color="#333" /></mj-attributes></mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="{{brandColor}}" padding="20px">
      <mj-column><mj-text color="#fff" font-size="22px" font-weight="bold">{{brandName}}</mj-text></mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="30px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">Welcome aboard! 👋</mj-text>
        <mj-text>Hi {{customerName}},</mj-text>
        <mj-text>Your account has been created. {{#if loginUrl}}<a href="{{loginUrl}}">Sign in here</a>{{/if}}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="10px">
      <mj-column><mj-text font-size="11px" color="#999" align="center">{{footerText}}</mj-text></mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
    text_body: 'Welcome to {{brandName}}, {{customerName}}! Your account has been created.'
  },
  {
    slug: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset your password — {{brandName}}',
    mjml: `<mjml>
  <mj-head><mj-attributes><mj-all font-family="Helvetica, Arial, sans-serif" /><mj-text font-size="14px" color="#333" /></mj-attributes></mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="{{brandColor}}" padding="20px">
      <mj-column><mj-text color="#fff" font-size="22px" font-weight="bold">{{brandName}}</mj-text></mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="30px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">Password Reset</mj-text>
        <mj-text>Click below to reset your password. This link expires in {{expiresIn}}.</mj-text>
        <mj-button background-color="{{brandColor}}" href="{{resetUrl}}">Reset Password</mj-button>
        <mj-text font-size="12px">If you didn't request this, ignore this email.</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
    text_body: 'Reset your password: {{resetUrl}}\nExpires in {{expiresIn}}.'
  },
  {
    slug: 'receipt',
    name: 'Receipt / Invoice',
    subject: 'Receipt for {{orderNumber}}',
    mjml: `<mjml>
  <mj-head><mj-attributes><mj-all font-family="Helvetica, Arial, sans-serif" /><mj-text font-size="14px" color="#333" /></mj-attributes></mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="{{brandColor}}" padding="20px">
      <mj-column><mj-text color="#fff" font-size="22px" font-weight="bold">{{brandName}}</mj-text></mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="30px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold">Receipt</mj-text>
        <mj-text>Order: <strong>{{orderNumber}}</strong></mj-text>
        <mj-text>Date: {{date}}</mj-text>
        <mj-divider border-color="#eee" />
        <mj-text>{{#each items}}{{this.name}} — {{this.price}}<br/>{{/each}}</mj-text>
        <mj-divider border-color="#eee" />
        <mj-text font-size="18px" font-weight="bold">Total: {{total}}</mj-text>
        <mj-text>Payment: {{paymentMethod}}</mj-text>
      </mj-column>
    </mj-section>
    <mj-section padding="10px">
      <mj-column><mj-text font-size="11px" color="#999" align="center">{{footerText}}</mj-text></mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
    text_body: 'Receipt for {{orderNumber}}\n{{#each items}}• {{this.name}} — {{this.price}}\n{{/each}}Total: {{total}}'
  },
  {
    slug: 'notification',
    name: 'Notification / Alert',
    subject: '{{subject}}',
    mjml: `<mjml>
  <mj-head><mj-attributes><mj-all font-family="Helvetica, Arial, sans-serif" /><mj-text font-size="14px" color="#333" /></mj-attributes></mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="{{brandColor}}" padding="20px">
      <mj-column><mj-text color="#fff" font-size="22px" font-weight="bold">{{brandName}}</mj-text></mj-column>
    </mj-section>
    <mj-section background-color="#fff" padding="30px">
      <mj-column>
        <mj-text font-size="18px" font-weight="bold">{{title}}</mj-text>
        <mj-text>{{message}}</mj-text>
        {{#if actionUrl}}<mj-button background-color="{{brandColor}}" href="{{actionUrl}}">{{actionText}}</mj-button>{{/if}}
      </mj-column>
    </mj-section>
    <mj-section padding="10px">
      <mj-column><mj-text font-size="11px" color="#999" align="center">{{footerText}}</mj-text></mj-column>
    </mj-section>
  </mj-body>
</mjml>`,
    text_body: '{{title}}\n\n{{message}}\n\n{{#if actionUrl}}{{actionUrl}}{{/if}}'
  }
];

async function seed() {
  console.log('Seeding data...');

  // Create tenants
  const pitchupKey = 'mf_pitchup_' + uuid().replace(/-/g, '').slice(0, 24);
  const pavilionKey = 'mf_pavilion_' + uuid().replace(/-/g, '').slice(0, 24);

  await pool.query(`
    INSERT INTO tenants (id, name, api_key, default_from, reply_to, provider, provider_config, branding)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, provider_config = EXCLUDED.provider_config, branding = EXCLUDED.branding
  `, [
    'pitchup', 'PitchUp', pitchupKey,
    'orders@pitchup.local-connect.uk', null, 'smtp',
    JSON.stringify({ host: 'mail.local-connect.uk', port: 465, secure: true, auth: { user: 'orders@pitchup.local-connect.uk', pass: '' } }),
    JSON.stringify({ name: 'PitchUp', color: '#FF6B35', footerText: 'PitchUp — Mobile Food, Made Easy' })
  ]);

  await pool.query(`
    INSERT INTO tenants (id, name, api_key, default_from, reply_to, provider, provider_config, branding)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, provider_config = EXCLUDED.provider_config, branding = EXCLUDED.branding
  `, [
    'pavilion', 'Pavilion Tickets', pavilionKey,
    'no-reply@ayrpavilion.com', null, 'smtp',
    JSON.stringify({ host: 'mail.ayrpavilion.com', port: 465, secure: true, auth: { user: 'no-reply@ayrpavilion.com', pass: 'RBTeeyKM142!' } }),
    JSON.stringify({ name: 'Ayr Pavilion', color: '#1a365d', footerText: 'Ayr Pavilion — Events & Entertainment' })
  ]);

  console.log('Tenants created:');
  console.log(`  pitchup: API key = ${pitchupKey}`);
  console.log(`  pavilion: API key = ${pavilionKey}`);

  // Insert default templates
  for (const t of DEFAULT_TEMPLATES) {
    await pool.query(`
      INSERT INTO default_templates (slug, name, subject, mjml, text_body)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name, subject = EXCLUDED.subject, mjml = EXCLUDED.mjml, text_body = EXCLUDED.text_body
    `, [t.slug, t.name, t.subject, t.mjml, t.text_body]);
  }
  console.log(`${DEFAULT_TEMPLATES.length} default templates seeded.`);

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
