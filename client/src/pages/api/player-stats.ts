import type { APIRoute } from 'astro';
import { getPlayerStatistics } from '../../lib/graphql';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  try {
    const playerIdParam = url.searchParams.get('playerId');
    
    if (!playerIdParam) {
      return new Response(JSON.stringify({ error: 'playerId parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const playerId = Number(playerIdParam);
    
    if (isNaN(playerId)) {
      return new Response(JSON.stringify({ error: 'playerId must be a number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const stats = await getPlayerStatistics(playerId);
    
    return new Response(JSON.stringify({ stats }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to fetch player statistics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

