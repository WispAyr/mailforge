import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../db/pool';

export async function authenticateTenant(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string;
  if (!apiKey) {
    reply.code(401).send({ error: 'Missing x-api-key header' });
    return;
  }

  const result = await query('SELECT * FROM tenants WHERE api_key = $1', [apiKey]);
  if (result.rows.length === 0) {
    reply.code(401).send({ error: 'Invalid API key' });
    return;
  }

  (request as any).tenant = result.rows[0];
}
