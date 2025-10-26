"""
Schema GraphQL for the Minecraft API.

Defines the types and queries available to interact with Minecraft servers.
"""

from datetime import datetime, timezone
import logging
from typing import List, Optional

import strawberry

from src.clients.minecraft_client import (
    MinecraftClient,
    MinecraftClientError,
    QueryProtocolError,
    ServerConnectionError,
)
from src.clients.player_stats_client import PlayerStatsClient
from src.core.config import settings

logger = logging.getLogger(__name__)


@strawberry.type
class PlayerStatisticEntry:
    """Generic entry for player statistics (broken, crafted, etc.)"""
    stat_name: str
    amount: int
    position: Optional[int] = None


@strawberry.type
class PlayerUUIDMap:
    """Mapping of player UUIDs to names and last online"""
    id: int
    player_uuid: str
    player_nick: Optional[str] = None
    player_last_online: Optional[str] = None


@strawberry.type
class HallOfFameEntry:
    """Entry of the Hall of Fame"""
    player_id: int
    first_place: int
    second_place: int
    third_place: int
    fourth_place: int
    fifth_place: int
    score: int


@strawberry.type
class SyncMetadata:
    """Synchronization metadata of the server"""
    last_update: Optional[str] = None
    server_name: Optional[str] = None
    server_desc: Optional[str] = None
    server_url: Optional[str] = None
    # Assume that BLOB can be represented as a string (base64)
    server_icon: Optional[str] = None


@strawberry.type
class PlayerStatistics:
    """Aggregation of all player statistics"""
    player_id: int
    uuid_map_entry: Optional[PlayerUUIDMap] = None
    broken: Optional[List[PlayerStatisticEntry]] = None
    crafted: Optional[List[PlayerStatisticEntry]] = None
    custom: Optional[List[PlayerStatisticEntry]] = None
    dropped: Optional[List[PlayerStatisticEntry]] = None
    killed: Optional[List[PlayerStatisticEntry]] = None
    killed_by: Optional[List[PlayerStatisticEntry]] = None
    mined: Optional[List[PlayerStatisticEntry]] = None
    picked_up: Optional[List[PlayerStatisticEntry]] = None
    used: Optional[List[PlayerStatisticEntry]] = None
    hall_of_fame_entry: Optional[HallOfFameEntry] = None


@strawberry.type
class PlayerScoreEntry:
    """Entry for the leaderboard of the Hall of Fame."""
    player_id: int
    player_nick: Optional[str] = None
    score: int
    is_bot: bool = False


@strawberry.type
class Player:
    """Information about a connected player"""
    name: str
    id: Optional[str] = None
    is_bot: bool = False


@strawberry.type
class Version:
    """Information about the server version"""
    name: str
    protocol: int


@strawberry.type
class PlayerInfo:
    """Information about the players of the server"""
    online: int
    max: int
    players: Optional[List[Player]] = None


@strawberry.type
class ServerStatus:
    """Full status of the Minecraft server"""
    online: bool
    host: str
    port: int
    version: Optional[Version] = None
    description: Optional[str] = None
    players: Optional[PlayerInfo] = None
    latency: Optional[float] = None
    favicon: Optional[str] = None
    enforces_secure_chat: Optional[bool] = None
    previews_chat: Optional[bool] = None
    queried_at: str


@strawberry.type
class ServerQuery:
    """Detailed information about the server obtained via Query protocol"""
    online: bool
    motd: Optional[str] = None
    game_type: Optional[str] = None
    game_version: Optional[str] = None
    plugins: Optional[List[str]] = None
    map: Optional[str] = None
    num_players: Optional[int] = None
    max_players: Optional[int] = None
    players: Optional[List[str]] = None
    host_ip: Optional[str] = None
    host_port: Optional[int] = None


@strawberry.type
class ServerPing:
    """Information about the server latency"""
    online: bool
    host: str
    port: int
    latency: Optional[float] = None
    measured_at: str


@strawberry.type
class Query:
    """Query to get information about Minecraft servers"""

    @strawberry.field
    async def server_status(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None
    ) -> ServerStatus:
        """
        Get the full status of the Minecraft server.
        If host/port is not provided, use the configuration values.
        """
        server_host = host or settings.mc_server_host
        server_port = port or settings.mc_server_port

        client = MinecraftClient(server_host, server_port)
        try:
            status = await client.get_status()
        except (ServerConnectionError, MinecraftClientError, QueryProtocolError) as e:
            logger.warning(
                "server_status error host=%s port=%s err=%s",
                server_host,
                server_port,
                e,
            )
            status = None
        except Exception as e:
            logger.error(
                "server_status unexpected error host=%s port=%s err=%s",
                server_host,
                server_port,
                e,
            )
            status = None

        if status is None:
            return ServerStatus(
                online=False,
                host=server_host,
                port=server_port,
                queried_at=datetime.now(timezone.utc).isoformat()
            )

        # Convert players
        players_list = None
        if status.players and getattr(status.players, "sample", None):
            players_list = []
            bot_uuids = settings.bot_uuids_list

            for p in status.players.sample:
                # Verificar si el UUID del jugador está en la lista de bots
                is_bot = False
                if p.id and p.id.lower() in bot_uuids:
                    is_bot = True
                # También podemos identificar bots por nombres conocidos
                elif p.name in ["Steve", "Alex"]:
                    is_bot = True

                players_list.append(Player(
                    name=p.name,
                    id=p.id,
                    is_bot=is_bot
                ))

        # Get description (MOTD)
        description = None
        if hasattr(status, 'description'):
            if isinstance(status.description, str):
                description = status.description
            elif hasattr(status.description, 'to_plain'):
                description = status.description.to_plain()
            elif hasattr(status.description, '__str__'):
                description = str(status.description)
        elif hasattr(status, 'motd') and hasattr(status.motd, 'to_plain'):
            # Handle cases where motd is a Motd object
            description = status.motd.to_plain()
        elif hasattr(status, 'motd') and isinstance(status.motd, str):
            description = status.motd

        return ServerStatus(
            online=True,
            host=server_host,
            port=server_port,
            version=Version(
                name=status.version.name,
                protocol=status.version.protocol
            ) if status.version else None,
            description=description,
            players=PlayerInfo(
                online=status.players.online,
                max=status.players.max,
                players=players_list
            ) if status.players else None,
            latency=status.latency if hasattr(status, 'latency') else None,
            favicon=(status.favicon if hasattr(status, 'favicon') and status.favicon
                     else status.raw.get('favicon') if hasattr(status, 'raw') else None),
            enforces_secure_chat=(status.enforces_secure_chat if hasattr(status, 'enforces_secure_chat')
                                  else status.raw.get('enforcesSecureChat') if hasattr(status, 'raw') else None),
            previews_chat=(status.previews_chat if hasattr(status, 'previews_chat')
                           else status.raw.get('previewsChat') if hasattr(status, 'raw') else None),
            queried_at=datetime.now(timezone.utc).isoformat()
        )

    @strawberry.field
    async def server_ping(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None
    ) -> ServerPing:
        """
        Get only the server latency (faster than server_status).
        If host/port is not provided, use the configuration values.
        """
        server_host = host or settings.mc_server_host
        server_port = port or settings.mc_server_port

        client = MinecraftClient(server_host, server_port)
        try:
            latency = await client.get_ping()
        except (ServerConnectionError, MinecraftClientError, QueryProtocolError) as e:
            logger.warning(
                "server_ping error host=%s port=%s err=%s",
                server_host,
                server_port,
                e,
            )
            latency = None
        except Exception as e:
            logger.error(
                "server_ping unexpected error host=%s port=%s err=%s",
                server_host,
                server_port,
                e,
            )
            latency = None

        return ServerPing(
            online=latency is not None,
            host=server_host,
            port=server_port,
            latency=latency,
            measured_at=datetime.now(timezone.utc).isoformat()
        )

    @strawberry.field
    async def server_query(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None
    ) -> ServerQuery:
        """
        Get detailed information about the server using Query protocol.
        NOTE: Requires enable-query=true in server.properties of the Minecraft server.
        If host/port is not provided, use the configuration values.
        """
        server_host = host or settings.mc_server_host
        server_port = port or settings.mc_server_port

        client = MinecraftClient(server_host, server_port)
        try:
            query_data = await client.get_query()
        except (ServerConnectionError, MinecraftClientError, QueryProtocolError) as e:
            logger.warning(
                "server_query error host=%s port=%s err=%s",
                server_host,
                server_port,
                e,
            )
            query_data = None
        except Exception as e:
            logger.error(
                "server_query unexpected error host=%s port=%s err=%s",
                server_host,
                server_port,
                e,
            )
            query_data = None

        if query_data is None:
            return ServerQuery(online=False)

        return ServerQuery(
            online=True,
            motd=query_data.get("motd"),
            game_type=query_data.get("game_type"),
            game_version=query_data.get("game_version"),
            plugins=query_data.get("plugins"),
            map=query_data.get("map"),
            num_players=query_data.get("num_players"),
            max_players=query_data.get("max_players"),
            players=query_data.get("players"),
            host_ip=query_data.get("host_ip"),
            host_port=query_data.get("host_port")
        )

    @strawberry.field
    async def player_statistics(
        self,
        player_id: int
    ) -> Optional[PlayerStatistics]:
        """
        Get all player statistics by player ID from the database.
        """
        try:
            stats_client = PlayerStatsClient(settings.player_stats_db_path)

            uuid_map_data = await stats_client.get_player_uuid_map(player_id)
            uuid_map_entry = PlayerUUIDMap(
                **uuid_map_data) if uuid_map_data else None

            hall_of_fame_data = await stats_client.get_hall_of_fame_entry(player_id)
            hall_of_fame_entry = (
                HallOfFameEntry(
                    **hall_of_fame_data) if hall_of_fame_data else None
            )

            stat_tables = [
                "broken", "crafted", "custom", "dropped", "killed",
                "killed_by", "mined", "picked_up", "used"
            ]
            all_player_stats = {
                "player_id": player_id,
                "uuid_map_entry": uuid_map_entry,
                "hall_of_fame_entry": hall_of_fame_entry
            }

            for table in stat_tables:
                entries_data = await stats_client.get_player_statistic_entries(table, player_id)
                all_player_stats[table] = [PlayerStatisticEntry(
                    **entry) for entry in entries_data]

            return PlayerStatistics(**all_player_stats)
        except Exception as e:
            logger.error(
                "player_statistics error player_id=%s err=%s", player_id, e)
            return None

    @strawberry.field
    async def sync_metadata(self) -> Optional[SyncMetadata]:
        """
        Get the synchronization metadata of the server.
        """
        try:
            stats_client = PlayerStatsClient(settings.player_stats_db_path)
            metadata_data = await stats_client.get_sync_metadata()
            return SyncMetadata(**metadata_data) if metadata_data else None
        except Exception as e:
            logger.error("sync_metadata error err=%s", e)
            return None

    @strawberry.field
    async def hall_of_fame_leaderboard(
        self, limit: Optional[int] = 15, exclude_bots: Optional[bool] = True
    ) -> List[PlayerScoreEntry]:
        """
        Get the leaderboard of the Hall of Fame.

        Args:
            limit: Maximum number of entries to return.
            exclude_bots: If True, exclude known bots from the leaderboard.

        Returns:
            A list of PlayerScoreEntry.
        """
        # Validate and clamp limit to a safe range
        safe_limit = 15 if limit is None else max(1, min(int(limit), 100))

        try:
            stats_client = PlayerStatsClient(settings.player_stats_db_path)
            leaderboard_data = await stats_client.get_hall_of_fame_leaderboard(safe_limit, exclude_bots)
            return [PlayerScoreEntry(**entry) for entry in leaderboard_data]
        except Exception as e:
            logger.error("hall_of_fame_leaderboard error err=%s", e)
            return []


schema = strawberry.Schema(query=Query)
