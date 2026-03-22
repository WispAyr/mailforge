import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3880'),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://mailforge:mailforge@localhost:5432/mailforge',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  baseUrl: process.env.BASE_URL || 'http://localhost:3880',
  trackingEnabled: process.env.TRACKING_ENABLED !== 'false',
};
