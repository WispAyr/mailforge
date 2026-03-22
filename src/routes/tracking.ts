import { FastifyInstance } from 'fastify';
import { recordOpen, recordClick } from '../tracking/tracker';

export function registerTrackingRoutes(app: FastifyInstance) {
  // Open tracking pixel
  app.get('/t/o/:emailId', async (request, reply) => {
    const { emailId } = request.params as any;
    const pixel = await recordOpen(emailId);
    reply.header('Content-Type', 'image/gif');
    reply.header('Cache-Control', 'no-cache, no-store');
    return reply.send(pixel);
  });

  // Click tracking redirect
  app.get('/t/c/:emailId/:encodedUrl', async (request, reply) => {
    const { emailId, encodedUrl } = request.params as any;
    const url = await recordClick(emailId, encodedUrl);
    return reply.redirect(url);
  });
}
