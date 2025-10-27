import type { APIRoute } from 'astro';
import { SITE_URL } from '../config';

export const prerender = true;

const routes = [
  '/',
  '/conectar',
  '/mods',
  '/reglas',
  '/estadisticas',
];

export const GET: APIRoute = async () => {
  const urls = routes
    .map((path) => `<url><loc>${SITE_URL}${path}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`) 
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};


