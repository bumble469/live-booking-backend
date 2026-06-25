import type { FastifyRequest, FastifyReply } from 'fastify';
import { getFeaturedShows } from './home_service.js';

export async function getFeaturedShowsController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const shows = await getFeaturedShows();

    return reply.status(200).send({
      success: true,
      data: shows,
    });
  } catch (error) {
    console.error('Error fetching featured shows:', error);

    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch featured shows',
    });
  }
}