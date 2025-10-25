import type { APIRoute } from 'astro';
import { getServerPing } from '../../lib/graphql';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const ping = await getServerPing();
    return new Response(JSON.stringify(ping), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ online: false, error: 'Failed to fetch server ping' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


