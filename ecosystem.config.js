module.exports = {
  apps: [{
    name: 'mailforge',
    script: 'dist/index.js',
    cwd: '/root/mailforge',
    env: {
      NODE_ENV: 'production',
      PORT: 3880,
      HOST: '0.0.0.0',
      DATABASE_URL: 'postgresql://mailforge:mailforge@localhost:5432/mailforge',
      REDIS_URL: 'redis://localhost:6379',
      BASE_URL: 'http://142.202.191.208:3880',
      TRACKING_ENABLED: 'true',
      ADMIN_API_KEY: 'mf_admin_master_key_2026',
    },
    max_memory_restart: '256M',
    instances: 1,
    autorestart: true,
  }],
};
