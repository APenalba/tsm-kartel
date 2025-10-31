import type { PlayerStatisticEntry, PlayerStatistics } from './graphql';

export function formatNumber(value: number | null | undefined, options: Intl.NumberFormatOptions = {}): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('es-ES', options).format(value);
}

export function formatPlayTimeTicks(ticks: number | null | undefined): string {
  if (!ticks) return '—';

  const totalSeconds = Math.floor(ticks / 20);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length || seconds) parts.push(`${seconds}s`);

  return parts.join(' ');
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function humanizeStatName(statName: string): string {
  return statName
    .replace(/minecraft:/g, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getCustomValue(
  stats: PlayerStatistics | null | undefined,
  key: string,
  fallback = 0,
): number {
  const entry = stats?.custom?.find((item) => item.statName === key);
  return entry?.amount ?? fallback;
}

export function sumEntries(entries: PlayerStatisticEntry[] | null | undefined): number {
  if (!entries) return 0;
  return entries.reduce((total, item) => total + (item.amount || 0), 0);
}

export function calculateDistanceKm(distanceCm: number | null | undefined): number {
  if (!distanceCm) return 0;
  return distanceCm / 100000;
}


