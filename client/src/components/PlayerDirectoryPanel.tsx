import SortIndicator from './SortIndicator';
import { formatNumber } from '../lib/format';
import type { PlayerScoreEntry } from '../lib/graphql';

interface DirectoryEntry {
  player: PlayerScoreEntry;
  displayName: string;
  isActive: boolean;
  isLoading: boolean;
  hasError: boolean;
}

interface PlayerDirectoryPanelProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortField: 'score' | 'name' | 'id';
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: 'score' | 'name' | 'id') => void;
  onSelectPlayer: (playerId: number) => void;
  entries: DirectoryEntry[];
}

export default function PlayerDirectoryPanel({
  search,
  onSearchChange,
  sortField,
  sortDirection,
  onSortChange,
  onSelectPlayer,
  entries,
}: PlayerDirectoryPanelProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Directorio de jugadores</h2>
          <p className="text-xs text-gray-500">Filtra, ordena y selecciona jugadores para ver sus estadísticas.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nick o ID..."
            className="w-full rounded-lg border border-gray-800 bg-gray-950/70 px-3 py-2 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <p className="text-xs text-gray-500">Haz clic sobre los encabezados para ordenar la tabla.</p>
      </div>

      <div className="mt-4 max-h-[480px] overflow-y-auto rounded-xl border border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-gray-900/90 text-xs uppercase tracking-wide text-gray-400">
            <tr>
              <th
                scope="col"
                onClick={() => onSortChange('name')}
                className="cursor-pointer select-none px-3 py-2 text-left text-gray-400 transition hover:text-gray-200"
              >
                Jugador
                {sortField === 'name' && <SortIndicator direction={sortDirection} />}
              </th>
              <th
                scope="col"
                onClick={() => onSortChange('score')}
                className="cursor-pointer select-none px-3 py-2 text-left text-gray-400 transition hover:text-gray-200"
              >
                Score
                {sortField === 'score' && <SortIndicator direction={sortDirection} />}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/80">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-xs text-gray-500">
                  Ningún jugador coincide con el filtro actual.
                </td>
              </tr>
            ) : (
              entries.map(({ player, displayName, isActive, isLoading, hasError }) => (
                <tr
                  key={player.playerId}
                  onClick={() => onSelectPlayer(player.playerId)}
                  className={`cursor-pointer transition ${
                    isActive ? 'bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/40' : 'hover:bg-gray-900/60'
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-3 text-gray-100">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://mc-heads.net/avatar/${player.playerNick || 'MHF_Steve'}/42`}
                        alt={displayName}
                        loading="lazy"
                        className="h-9 w-9 rounded"
                      />
                      <div>
                        <div className="font-medium text-white">{displayName}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>#{player.playerId}{player.isBot ? ' · BOT' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-left text-gray-300">
                    <div className="flex items-center gap-2">
                      <span>{formatNumber(player.score)}</span>
                      {isLoading && <img src="/loading_clock.gif" alt="Cargando" className="h-5 w-5" />}
                      {hasError && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-200">
                          Error
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { DirectoryEntry };


