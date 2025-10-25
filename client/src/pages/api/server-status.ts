import type { APIRoute } from 'astro';
import { getServerStatus } from '../../lib/graphql';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const status = await getServerStatus();
    return new Response(JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch server status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


