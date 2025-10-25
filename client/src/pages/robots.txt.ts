import type { APIRoute } from 'astro';
import { SITE_URL } from '../config';

export const prerender = true;

export const GET: APIRoute = async () => {
  const body = `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};


