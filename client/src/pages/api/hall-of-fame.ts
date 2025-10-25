import type { APIRoute } from 'astro';
import { getHallOfFameLeaderboard } from '../../lib/graphql';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const limitParam = url.searchParams.get('limit');
    const excludeBotsParam = url.searchParams.get('excludeBots');
    const limit = limitParam ? Math.max(1, Math.min(100, Number(limitParam))) : 15;
    const excludeBots = excludeBotsParam ? excludeBotsParam !== 'false' : true;

    const leaderboard = await getHallOfFameLeaderboard(limit, excludeBots);
    return new Response(JSON.stringify({ leaderboard }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ leaderboard: [], error: 'Failed to fetch hall of fame' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


