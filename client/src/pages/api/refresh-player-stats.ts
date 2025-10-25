import type { APIRoute } from 'astro';
import { refreshPlayerStatsDb } from '../../lib/graphql';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    const ok = await refreshPlayerStatsDb();
    return new Response(JSON.stringify({ ok }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'Failed to refresh player stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


