import { useMemo, useState } from 'react';
import type {
  PlayerScoreEntry,
  PlayerStatistics,
  PlayerStatisticsSummary,
  SyncMetadata,
} from '../lib/graphql';
import { formatDateTime, formatNumber, formatPlayTimeTicks } from '../lib/format';
import PlayerSummarySection from './PlayerSummarySection';
import PlayerDirectoryPanel, { type DirectoryEntry } from './PlayerDirectoryPanel';
import PlayerDetailsPanel from './PlayerDetailsPanel';

type SortField = 'score' | 'name' | 'id';
type SortDirection = 'asc' | 'desc';

interface Props {
  initialLeaderboard: PlayerScoreEntry[];
  initialSummary: PlayerStatisticsSummary | null;
  initialPlayerStats: PlayerStatistics | null;
  syncMetadata: SyncMetadata | null;
}

type PlayerStatsCache = Record<number, PlayerStatistics | undefined>;

function resolveServerIconUrl(icon?: string | null): string | undefined {
  if (!icon) return undefined;
  if (icon.startsWith('data:image')) return icon;
  if (icon.startsWith('http')) return icon;
  // Treat as base64 when it looks like raw data
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(icon)) {
    return `data:image/png;base64,${icon}`;
  }
  return icon;
}

export default function PlayerStatisticsDashboard({
  initialLeaderboard,
  initialSummary,
  initialPlayerStats,
  syncMetadata,
}: Props) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [playerCache, setPlayerCache] = useState<PlayerStatsCache>(() => {
    if (initialPlayerStats?.playerId) {
      return { [initialPlayerStats.playerId]: initialPlayerStats };
    }
    return {};
  });
  const [activePlayerId, setActivePlayerId] = useState<number | null>(initialPlayerStats?.playerId ?? null);
  const [loadingPlayerId, setLoadingPlayerId] = useState<number | null>(null);
  const [errorPlayerId, setErrorPlayerId] = useState<number | null>(null);

  const leaderboard = useMemo(() => initialLeaderboard ?? [], [initialLeaderboard]);

  const processedLeaderboard = useMemo(() => {
    let entries = leaderboard.slice().filter((player) => !player.isBot);

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      entries = entries.filter((player) => {
        const nick = player.playerNick?.toLowerCase() ?? '';
        return nick.includes(query) || String(player.playerId).includes(query);
      });
    }

    const directionFactor = sortDirection === 'asc' ? 1 : -1;

    entries.sort((a, b) => {
      switch (sortField) {
        case 'name': {
          const nameA = (a.playerNick ?? `Jugador ${a.playerId}`).toLowerCase();
          const nameB = (b.playerNick ?? `Jugador ${b.playerId}`).toLowerCase();
          return nameA.localeCompare(nameB) * directionFactor;
        }
        case 'id':
          return (a.playerId - b.playerId) * directionFactor;
        case 'score':
        default:
          return (a.score - b.score) * directionFactor;
      }
    });

    return entries;
  }, [leaderboard, search, sortField, sortDirection]);

  const summaryCards = useMemo(() => {
    if (!initialSummary) return [];

    return [
      {
        label: 'Jugadores sincronizados',
        value: formatNumber(initialSummary.playerCount),
        icon: '/icons/multiplayer.webp',
        helper: 'Total de jugadores con estadísticas sincronizadas',
      },
      {
        label: 'Tiempo total jugado',
        value: formatPlayTimeTicks(initialSummary.playTimeTicks),
        icon: '/icons/clock.webp',
        helper: `${formatNumber(Math.floor(initialSummary.playTimeSeconds / 3600))} horas acumuladas`,
      },
      {
        label: 'Distancia recorrida',
        value: `${formatNumber(initialSummary.travelDistanceKm, { maximumFractionDigits: 1 })} km`,
        icon: '/icons/sprint.webp',
        helper: `${formatNumber(initialSummary.travelDistanceCm)} cm totales`,
      },
      {
        label: 'Bloques minados',
        value: formatNumber(initialSummary.minedBlocks),
        icon: '/icons/iron-pickaxe.webp',
        helper: 'Actividad minera acumulada',
      },
      {
        label: 'Items crafteados',
        value: formatNumber(initialSummary.craftedItems),
        icon: '/icons/crafting-table.webp',
        helper: 'Recetas creadas por la comunidad',
      },
      {
        label: 'Herramientas rotas',
        value: formatNumber(initialSummary.brokenTools),
        icon: '/icons/broken-tools.webp',
        helper: 'Durabilidad consumida',
      },
      {
        label: 'Items recogidos',
        value: formatNumber(initialSummary.pickedUpItems),
        icon: '/icons/bundle.webp',
        helper: 'Loot y recursos',
      },
      {
        label: 'Mobs eliminados',
        value: formatNumber(initialSummary.killedMobs),
        icon: '/icons/strength.webp',
        helper: 'Víctimas totales de la comunidad',
      },
    ];
  }, [initialSummary]);

  const directoryEntries = useMemo<DirectoryEntry[]>(
    () =>
      processedLeaderboard.map((player) => ({
        player,
        displayName: player.playerNick ?? `Jugador ${player.playerId}`,
        isActive: activePlayerId === player.playerId,
        isLoading: loadingPlayerId === player.playerId,
        hasError: errorPlayerId === player.playerId,
      })),
    [processedLeaderboard, activePlayerId, loadingPlayerId, errorPlayerId],
  );

  const activePlayerStats = useMemo(() => {
    if (activePlayerId == null) return undefined;
    return playerCache[activePlayerId];
  }, [activePlayerId, playerCache]);

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'name' ? 'asc' : 'desc');
    }
  };

  const handleSelectPlayer = async (playerId: number) => {
    if (playerCache[playerId]) {
      setActivePlayerId(playerId);
      setErrorPlayerId(null);
      return;
    }

    setLoadingPlayerId(playerId);
    setErrorPlayerId(null);

    try {
      const response = await fetch(`/api/player-stats?playerId=${playerId}`);
      const data = await response.json();

      if (!response.ok || !data.stats) {
        throw new Error('No stats returned');
      }

      setPlayerCache((prev) => ({ ...prev, [playerId]: data.stats as PlayerStatistics }));
      setActivePlayerId(playerId);
    } catch (error) {
      console.error(`Error fetching stats for player ${playerId}`, error);
      setErrorPlayerId(playerId);
    } finally {
      setLoadingPlayerId(null);
    }
  };

  const serverIconUrl = resolveServerIconUrl(syncMetadata?.serverIcon);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Estadísticas de Jugadores</h1>
            <p className="text-sm text-gray-400">
              Explora datos detallados, gráficos interactivos y consulta el progreso de los jugadores del servidor.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {serverIconUrl ? (
              <img
                src={serverIconUrl}
                alt={syncMetadata?.serverName ?? 'Server icon'}
                className="h-12 w-12 rounded-lg border border-gray-700 object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/60 to-sky-500/60" />
            )}
            <div>
              <div className="text-sm font-semibold text-gray-200">{syncMetadata?.serverName ?? 'Servidor'}</div>
              <div className="text-xs text-gray-500">
                Última sincronización · {formatDateTime(syncMetadata?.lastUpdate)}
              </div>
            </div>
          </div>
        </div>

        {/* {syncMetadata?.serverDesc && (
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {syncMetadata.serverDesc}
          </div>
        )} */}
      </header>

      <PlayerSummarySection cards={summaryCards} />

      <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <PlayerDirectoryPanel
            search={search}
            onSearchChange={setSearch}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
            entries={directoryEntries}
            onSelectPlayer={handleSelectPlayer}
          />
        </aside>

        <div className="space-y-6 min-w-0">
          {activePlayerId == null ? (
            <div className="card flex items-center justify-center border border-dashed border-gray-700 py-16 text-sm text-gray-500">
              Selecciona un jugador para ver sus estadísticas detalladas.
            </div>
          ) : (
            <PlayerDetailsPanel playerId={activePlayerId} stats={activePlayerStats} />
          )}
        </div>
      </section>
    </div>
  );
}


