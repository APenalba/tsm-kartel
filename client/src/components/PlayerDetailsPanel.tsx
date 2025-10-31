import { useMemo, useState } from 'react';
import type { PlayerStatisticEntry, PlayerStatistics } from '../lib/graphql';
import {
  calculateDistanceKm,
  formatDateTime,
  formatNumber,
  formatPlayTimeTicks,
  getCustomValue,
  humanizeStatName,
  sumEntries,
} from '../lib/format';
import SortIndicator from './SortIndicator';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface PlayerDetailsPanelProps {
  playerId: number;
  stats?: PlayerStatistics;
}

interface StatSection {
  key: keyof Pick<
    PlayerStatistics,
    'mined' | 'pickedUp' | 'used' | 'crafted' | 'broken' | 'dropped' | 'killed' | 'killedBy' | 'custom'
  >;
  label: string;
  description: string;
  icon: string;
  getEntries: (stats: PlayerStatistics | undefined) => PlayerStatisticEntry[] | null | undefined;
}

const STAT_SECTIONS: StatSection[] = [
  {
    key: 'mined',
    label: 'Bloques Minados',
    description: 'Resumen de los bloques minados por el jugador.',
    icon: '/icons/iron-pickaxe.webp',
    getEntries: (stats) => stats?.mined,
  },
  {
    key: 'pickedUp',
    label: 'Items Recogidos',
    description: 'Items recogidos del suelo durante la partida.',
    icon: '/icons/bundle.webp',
    getEntries: (stats) => stats?.pickedUp,
  },
  {
    key: 'used',
    label: 'Items Usados',
    description: 'Uso total por tipo de item.',
    icon: '/icons/crafting-table.webp',
    getEntries: (stats) => stats?.used,
  },
  {
    key: 'crafted',
    label: 'Items Crafteados',
    description: 'Productos fabricados en mesas de crafteo y hornos.',
    icon: '/icons/experience-orb.webp',
    getEntries: (stats) => stats?.crafted,
  },
  {
    key: 'broken',
    label: 'Herramientas Rotas',
    description: 'Herramientas que acabaron en la basura.',
    icon: '/icons/broken-tools.webp',
    getEntries: (stats) => stats?.broken,
  },
  {
    key: 'dropped',
    label: 'Items Tirados',
    description: 'Items expulsados del inventario.',
    icon: '/icons/multiplayer.webp',
    getEntries: (stats) => stats?.dropped,
  },
  {
    key: 'killed',
    label: 'Mobs Asesinados',
    description: 'Listado de mobs derrotados por el jugador.',
    icon: '/icons/strength.webp',
    getEntries: (stats) => stats?.killed,
  },
  {
    key: 'killedBy',
    label: 'Muertes por Mobs',
    description: 'Qué mobs acabaron contigo más veces.',
    icon: '/icons/clock.webp',
    getEntries: (stats) => stats?.killedBy,
  },
  {
    key: 'custom',
    label: 'Custom Stats',
    description: 'Otros contadores relevantes del servidor.',
    icon: '/icons/experience-orb.webp',
    getEntries: (stats) => stats?.custom,
  },
];

const PIE_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#f59e0b'];
const LIMIT_OPTIONS = [10, 25, 50, 100, 'all'] as const;

export default function PlayerDetailsPanel({ playerId, stats }: PlayerDetailsPanelProps) {
  const [activeSectionKey, setActiveSectionKey] = useState<StatSection['key']>('mined');
  const [statSearch, setStatSearch] = useState('');
  const [statSortField, setStatSortField] = useState<'name' | 'amount' | 'position'>('amount');
  const [statSortDirection, setStatSortDirection] = useState<'asc' | 'desc'>('desc');
  const [statLimit, setStatLimit] = useState<(typeof LIMIT_OPTIONS)[number]>(25);

  const playerName = stats?.uuidMapEntry?.playerNick ?? `Jugador ${playerId}`;

  const currentSection = STAT_SECTIONS.find((section) => section.key === activeSectionKey) ?? STAT_SECTIONS[0];

  const statRows = useMemo(() => {
    const entries = currentSection.getEntries(stats) ?? [];
    let rows = entries.slice();

    if (statSearch.trim()) {
      const query = statSearch.trim().toLowerCase();
      rows = rows.filter((entry) => humanizeStatName(entry.statName).toLowerCase().includes(query));
    }

    rows.sort((a, b) => {
      const factor = statSortDirection === 'asc' ? 1 : -1;

      if (statSortField === 'name') {
        return humanizeStatName(a.statName).localeCompare(humanizeStatName(b.statName)) * factor;
      }

      if (statSortField === 'position') {
        const posA = a.position ?? Number.MAX_SAFE_INTEGER;
        const posB = b.position ?? Number.MAX_SAFE_INTEGER;
        return (posA - posB) * factor;
      }

      return ((a.amount ?? 0) - (b.amount ?? 0)) * factor;
    });

    if (statLimit !== 'all') {
      rows = rows.slice(0, statLimit);
    }

    return rows;
  }, [currentSection, stats, statSearch, statSortField, statSortDirection, statLimit]);

  const minedTopChart = useMemo(() => {
    const entries = stats?.mined ?? [];
    return entries
      .slice()
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
      .slice(0, 8)
      .map((entry) => ({ name: humanizeStatName(entry.statName), value: entry.amount ?? 0 }));
  }, [stats]);

  const killedPieChart = useMemo(() => {
    const entries = stats?.killed ?? [];
    return entries
      .slice()
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
      .slice(0, 8)
      .map((entry) => ({ name: humanizeStatName(entry.statName), value: entry.amount ?? 0 }));
  }, [stats]);

  const customBarChart = useMemo(() => {
    const entries = stats?.custom ?? [];
    return entries
      .slice()
      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
      .slice(0, 10)
      .map((entry) => ({ name: humanizeStatName(entry.statName), value: entry.amount ?? 0 }));
  }, [stats]);

  const handleSortChange = (field: 'name' | 'amount' | 'position') => {
    if (statSortField === field) {
      setStatSortDirection(statSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setStatSortField(field);
      setStatSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  if (!stats) {
    return (
      <div className="card border border-dashed border-gray-700 py-16 text-center text-sm text-gray-500">
        Selecciona un jugador para ver sus estadísticas.
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="card space-y-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={`https://mc-heads.net/avatar/${stats.uuidMapEntry?.playerNick ?? stats.playerId ?? 'MHF_Steve'}/68`}
              alt={playerName}
              className="h-16 w-16 rounded-lg border border-gray-800"
            />
            <div className="min-w-0">
              <h2 className="text-2xl font-semibold text-white truncate">{playerName}</h2>
              <p className="text-xs text-gray-500">ID #{playerId} · Última conexión {formatDateTime(stats.uuidMapEntry?.playerLastOnline)}</p>
              {stats.hallOfFameEntry && (
                <p className="text-[11px] text-gray-400">
                  Hall of Fame Score: {formatNumber(stats.hallOfFameEntry.score)} · Podios:{' '}
                  {formatNumber(
                    stats.hallOfFameEntry.firstPlace +
                      stats.hallOfFameEntry.secondPlace +
                      stats.hallOfFameEntry.thirdPlace,
                  )}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-200">
              Total bloques minados: {formatNumber(sumEntries(stats.mined))}
            </span>
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-sky-200">
              Tiempo de juego: {formatPlayTimeTicks(getCustomValue(stats, 'play_time'))}
            </span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: 'Kills jugadores',
              value: getCustomValue(stats, 'player_kills'),
              icon: '/icons/strength.webp',
            },
            {
              label: 'Kills mobs',
              value: getCustomValue(stats, 'mob_kills'),
              icon: '/icons/experience-orb.webp',
            },
            {
              label: 'Muertes',
              value: getCustomValue(stats, 'deaths'),
              icon: '/icons/broken-tools.webp',
            },
            {
              label: 'Daño hecho',
              value: getCustomValue(stats, 'damage_dealt'),
              icon: '/icons/strength.webp',
            },
            {
              label: 'Daño recibido',
              value: getCustomValue(stats, 'damage_taken'),
              icon: '/icons/bundle.webp',
            },
            {
              label: 'Distancia recorrida',
              value: calculateDistanceKm(getCustomValue(stats, 'walk_one_cm')),
              icon: '/icons/sprint.webp',
              suffix: ' km',
              formatter: (value: number) => formatNumber(value, { maximumFractionDigits: 1 }),
            },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {metric.formatter
                      ? metric.formatter(metric.value ?? 0)
                      : `${formatNumber(metric.value ?? 0)}${metric.suffix ?? ''}`}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800/80">
                  <img src={metric.icon} alt="" className="h-6 w-6 object-contain" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Top bloques minados</h3>
              <p className="text-xs text-gray-500">Hasta 8 bloques más minados por el jugador.</p>
            </div>
          </div>
          <div className="h-[260px] min-h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={minedTopChart}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(14,165,233,0.08)' }}
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Mobs eliminados</h3>
              <p className="text-xs text-gray-500">Distribución de kills por tipo de mob.</p>
            </div>
          </div>
          <div className="h-[260px] min-h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={killedPieChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {killedPieChart.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#111827',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#e2e8f0',
                  }}
                />
                <Legend wrapperStyle={{ color: '#cbd5f5', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card min-w-0">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Custom stats destacadas</h3>
            <p className="text-xs text-gray-500">Las estadísticas personalizadas con mayor progreso.</p>
          </div>
        </div>
        <div className="h-[280px] min-h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={customBarChart}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(52,211,153,0.08)' }}
                contentStyle={{
                  background: '#111827',
                  border: '1px solid #1e293b',
                  borderRadius: '0.75rem',
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="value" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card space-y-4 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={currentSection.icon} alt="" className="h-8 w-8" />
            <div>
              <h3 className="text-lg font-semibold text-white">{currentSection.label}</h3>
              <p className="text-xs text-gray-500">{currentSection.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {STAT_SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSectionKey(section.key)}
                className={`rounded-full px-4 py-1 text-xs transition ${
                  activeSectionKey === section.key
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : 'bg-gray-900/70 text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="text-gray-500">Haz clic en los encabezados para ordenar.</span>
          <div className="flex items-center gap-2">
            <span>Top:</span>
            {LIMIT_OPTIONS.map((option) => (
              <button
                key={String(option)}
                type="button"
                onClick={() => setStatLimit(option)}
                className={`rounded-full px-3 py-1 transition ${
                  statLimit === option
                    ? 'bg-purple-500/20 text-purple-100'
                    : 'bg-gray-900/70 text-gray-400 hover:bg-gray-800/80 hover:text-gray-200'
                }`}
              >
                {option === 'all' ? 'Todos' : option}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <input
              type="text"
              value={statSearch}
              onChange={(event) => setStatSearch(event.target.value)}
              placeholder="Filtrar nombre..."
              className="w-40 rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-1.5 text-xs text-gray-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-800 min-w-0">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900/80 text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th
                  scope="col"
                  onClick={() => handleSortChange('name')}
                  className="cursor-pointer select-none px-4 py-3 text-left transition hover:text-gray-200"
                >
                  Estadística
                  {statSortField === 'name' && <SortIndicator direction={statSortDirection} />}
                </th>
                <th
                  scope="col"
                  onClick={() => handleSortChange('amount')}
                  className="cursor-pointer select-none px-4 py-3 text-right transition hover:text-gray-200"
                >
                  Valor
                  {statSortField === 'amount' && <SortIndicator direction={statSortDirection} />}
                </th>
                <th
                  scope="col"
                  onClick={() => handleSortChange('position')}
                  className="cursor-pointer select-none px-4 py-3 text-right transition hover:text-gray-200"
                >
                  Posición
                  {statSortField === 'position' && <SortIndicator direction={statSortDirection} />}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {statRows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-5 text-center text-xs text-gray-500">
                    No hay datos disponibles para esta categoría.
                  </td>
                </tr>
              ) : (
                statRows.map((entry) => (
                  <tr key={entry.statName} className="hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-gray-200">{humanizeStatName(entry.statName)}</td>
                    <td className="px-4 py-3 text-right text-gray-100">{formatNumber(entry.amount ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{entry.position ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


