import { useEffect, useMemo, useState } from 'react';
import {
  getHallOfFameLeaderboard,
  getPlayerStatistics,
  getSyncMetadata,
  type PlayerScoreEntry,
  type PlayerStatistics,
  type PlayerStatisticEntry,
  type SyncMetadata,
} from '../lib/graphql';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

type MetricCardProps = {
  label: string;
  value?: number | string;
  highlight?: string;
};

function MetricCard({ label, value, highlight }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">
        {value ?? '—'} {highlight ? <span className="ml-2 text-xs font-medium text-cyan-400">{highlight}</span> : null}
      </div>
    </div>
  );
}

function formatNumber(n?: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('es-ES').format(n);
}

function formatPlayTime(ticks: number): string {
  if (ticks === 0) return '0 segundos';
  
  // Convertir ticks a segundos (20 ticks = 1 segundo)
  const totalSeconds = Math.floor(ticks / 20);
  
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const remainingSeconds = totalSeconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
  
  return parts.join(', ');
}

function titleCase(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickTop(entries: PlayerStatisticEntry[] | null | undefined, n = 10) {
  return (entries ?? [])
    .slice()
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#f59e0b', '#4ade80', '#94a3b8'];

export default function PlayerStats() {
  const [leaderboard, setLeaderboard] = useState<PlayerScoreEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [stats, setStats] = useState<PlayerStatistics | null>(null);
  const [meta, setMeta] = useState<SyncMetadata | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingLb, setLoadingLb] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle initial URL player ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const playerId = params.get('player');
    if (playerId && !selectedPlayerId) {
      setSelectedPlayerId(Number(playerId));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingLb(true);
        const [lb, m] = await Promise.all([
          getHallOfFameLeaderboard(50, true),
          getSyncMetadata(),
        ]);
        if (!mounted) return;
        setLeaderboard(lb);
        setMeta(m);
        // Auto-select the first player
        if (lb.length > 0) setSelectedPlayerId(lb[0].playerId);
      } catch (e) {
        if (!mounted) return;
        setError('No se pudo cargar el ranking.');
      } finally {
        if (mounted) setLoadingLb(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedPlayerId) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingStats(true);
        setError(null);
        const s = await getPlayerStatistics(selectedPlayerId);
        if (!mounted) return;
        setStats(s);
      } catch (e) {
        if (!mounted) return;
        setError('No se pudieron cargar las estadísticas del jugador.');
      } finally {
        if (mounted) setLoadingStats(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedPlayerId]);

  const filteredLeaderboard = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leaderboard;
    return leaderboard.filter((e) => (e.playerNick || String(e.playerId)).toLowerCase().includes(q));
  }, [leaderboard, search]);

  const customMap = useMemo(() => {
    const map = new Map<string, number>();
    (stats?.custom || []).forEach((e) => map.set(e.statName, e.amount));
    return map;
  }, [stats]);

  const mainMetrics = useMemo(() => {
    const kills = customMap.get('player_kills') ?? 0;
    const mobKills = customMap.get('mob_kills') ?? 0;
    const deaths = customMap.get('deaths') ?? 0;
    const dmgDealt = customMap.get('damage_dealt') ?? 0;
    const dmgTaken = customMap.get('damage_taken') ?? 0;
    const playTime = customMap.get('play_time') ?? 0; // raw units
    return { kills, mobKills, deaths, dmgDealt, dmgTaken, playTime };
  }, [customMap]);

  const minedTop = useMemo(() => pickTop(stats?.mined, 12).map((e) => ({ name: titleCase(e.statName), value: e.amount })), [stats]);
  const killedTop = useMemo(() => pickTop(stats?.killed, 10).map((e) => ({ name: titleCase(e.statName), value: e.amount })), [stats]);

  const customTop = useMemo(() => pickTop(stats?.custom, 12).map((e) => ({ name: e.statName, value: e.amount })), [stats]);

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {meta?.serverIcon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/png;base64,${meta.serverIcon}`} alt="Server Icon" className="h-10 w-10 rounded" />
          ) : (
            <div className="h-10 w-10 rounded bg-gradient-to-br from-emerald-500 to-cyan-600" />
          )}
          <div>
            <div className="text-lg font-semibold">Estadísticas de Jugadores</div>
            <div className="text-xs text-gray-400">Ranking Hall of Fame · {leaderboard.length} jugadores</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2 text-sm outline-none focus:border-cyan-500"
            placeholder="Buscar jugador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-3 py-2 text-sm font-medium hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50"
            disabled={!selectedPlayerId || loadingStats}
            onClick={() => selectedPlayerId && setSelectedPlayerId(selectedPlayerId)}
          >
            {loadingStats ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-800 bg-gray-900/60">
            <div className="border-b border-gray-800 p-3 text-sm font-medium">Jugadores</div>
            <div className="max-h-[520px] overflow-auto p-2">
              {loadingLb ? (
                <div className="p-4 text-sm text-gray-400">Cargando ranking…</div>
              ) : filteredLeaderboard.length === 0 ? (
                <div className="p-4 text-sm text-gray-400">Sin resultados</div>
              ) : (
                <ul className="divide-y divide-gray-800">
                  {filteredLeaderboard.map((p) => (
                    <li key={p.playerId}>
                      <button
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-gray-800/60 ${selectedPlayerId === p.playerId ? 'bg-gray-800/60' : ''}`}
                        onClick={() => {
                          setSelectedPlayerId(p.playerId);
                          const url = new URL(window.location.href);
                          url.searchParams.set('player', String(p.playerId));
                          window.history.pushState({}, '', url.toString());
                        }}
                      >
                        <div>
                          <div className="text-sm font-medium text-white">{p.playerNick || `ID ${p.playerId}`}</div>
                          <div className="text-xs text-gray-400">Score {formatNumber(p.score)}</div>
                        </div>
                        <div className="text-xs text-gray-400">#{p.playerId}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {error ? (
            <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-200">{error}</div>
          ) : null}

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <MetricCard label="Kills (jugadores)" value={formatNumber(mainMetrics.kills)} />
            <MetricCard label="Kills (mobs)" value={formatNumber(mainMetrics.mobKills)} />
            <MetricCard label="Muertes" value={formatNumber(mainMetrics.deaths)} />
            <MetricCard label="Daño Hecho" value={formatNumber(mainMetrics.dmgDealt)} />
            <MetricCard label="Daño Recibido" value={formatNumber(mainMetrics.dmgTaken)} />
            <MetricCard label="Tiempo de juego" value={formatPlayTime(mainMetrics.playTime)} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 min-w-0">
              <div className="mb-3 text-sm font-medium">Top Bloques Minados</div>
              <div>
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart data={minedTop}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937' }} />
                    <Bar dataKey="value" fill="#22d3ee" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 min-w-0">
              <div className="mb-3 text-sm font-medium">Top Mobs Eliminados</div>
              <div>
                <ResponsiveContainer width="100%" height={288}>
                  <PieChart>
                    <Pie data={killedTop} dataKey="value" nameKey="name" outerRadius={90} innerRadius={40}>
                      {killedTop.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937' }} />
                    <Legend wrapperStyle={{ color: '#e5e7eb' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 min-w-0">
            <div className="mb-3 text-sm font-medium">Custom Stats (Top)</div>
            <div>
              <ResponsiveContainer width="100%" height={288}>
                <BarChart data={customTop.map((e) => ({ name: e.name, value: e.value }))}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937' }} />
                  <Bar dataKey="value" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-900/60">
            <div className="border-b border-gray-800 p-3 text-sm font-medium">Detalles Custom</div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-900/90">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-300">Estadística</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-300">Valor</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-300">Posición</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {(stats?.custom ?? []).map((e) => (
                    <tr key={e.statName}>
                      <td className="px-3 py-2 text-gray-200">{e.statName}</td>
                      <td className="px-3 py-2 text-right text-gray-100">{formatNumber(e.amount)}</td>
                      <td className="px-3 py-2 text-right text-gray-400">{e.position ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


