"""
Player Stats Client - Module

This module contains the PlayerStatsClient class that is responsible
for querying player statistics stored in a SQLite database.
"""

import base64
from typing import Any, Dict, List, Optional

import aiosqlite

from src.core.config import settings


class PlayerStatsClient:
    """Client to query player statistics from a SQLite database."""

    def __init__(self, db_path: str):
        """
        Initialize the player statistics client.

        Args:
            db_path: Path to the SQLite database file
        """
        self.db_path = db_path

    async def _execute_query(
        self, query: str, params: tuple = ()
    ) -> List[Dict[str, Any]]:
        """
        Execute a SQL query and return the results as a list of dictionaries.

        Args:
            query: SQL query to execute.
            params: Parameters for the SQL query.

        Returns:
            List of rows as dictionaries.
        """
        async with aiosqlite.connect(self.db_path) as db:
            # Rows are returned as dictionaries.
            db.row_factory = aiosqlite.Row
            async with db.execute(query, params) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_player_uuid_map(self, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Get the UUID mapping for a specific player.

        Args:
            player_id: Player ID.

        Returns:
            Dictionary with the UUID mapping information or None if it doesn't exist.
        """
        query = "SELECT * FROM uuid_map WHERE id = ?"
        result = await self._execute_query(query, (player_id,))
        return result[0] if result else None

    async def get_player_statistic_entries(
        self, table_name: str, player_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get the entries of player statistics from a specific table.

        Args:
            table_name: Name of the statistics table.
            player_id: Player ID.

        Returns:
            List of statistics as dictionaries.
        """
        # Validate table against whitelist to avoid SQL injection.
        allowed_tables = {
            "broken", "crafted", "custom", "dropped", "killed",
            "killed_by", "mined", "picked_up", "used"
        }
        if table_name not in allowed_tables:
            return []

        query = (
            f"SELECT stat_name, amount, position FROM {table_name} WHERE player_id = ?"
        )
        return await self._execute_query(query, (player_id,))

    async def get_hall_of_fame_entry(self, player_id: int) -> Optional[Dict[str, Any]]:
        """
        Get the entry of the Hall of Fame for a specific player.

        Args:
            player_id: Player ID.

        Returns:
            Dictionary with the Hall of Fame information or None if it doesn't exist.
        """
        query = "SELECT * FROM hall_of_fame WHERE player_id = ?"
        result = await self._execute_query(query, (player_id,))
        return result[0] if result else None

    async def get_sync_metadata(self) -> Optional[Dict[str, Any]]:
        """
        Get the synchronization metadata of the server.

        Returns:
            Dictionary with the synchronization metadata or None if it doesn't exist.
        """
        query = (
            "SELECT last_update, server_name, server_desc, server_url, server_icon "
            "FROM sync_metadata LIMIT 1"
        )
        result = await self._execute_query(query)
        if result:
            metadata = result[0]
            if metadata.get("server_icon"):
                # Decode BLOB to base64 string if necessary.
                # aiosqlite should return it as bytes.
                metadata["server_icon"] = base64.b64encode(
                    metadata["server_icon"]
                ).decode('utf-8')
            return metadata
        return None

    async def get_hall_of_fame_leaderboard(
        self, limit: int = 15, exclude_bots: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get the leaderboard of the Hall of Fame, with the names of the players.

        Args:
            limit: Maximum number of entries to return.
            exclude_bots: If True, exclude known bots from the leaderboard.

        Returns:
            A list of dictionaries with player_id, player_nick, score and is_bot.
        """
        query = (
            "SELECT hof.player_id, um.player_nick, um.player_uuid, hof.score "
            "FROM hall_of_fame AS hof "
            "JOIN uuid_map AS um ON hof.player_id = um.id "
        )

        # If bots should be excluded, add the WHERE condition
        bot_uuids = settings.bot_uuids_list
        bot_names = ["Steve", "Alex"]  # Known bot names

        if exclude_bots and (bot_uuids or bot_names):
            conditions = []

            # Exclude by UUID
            if bot_uuids:
                placeholders = ", ".join(["?" for _ in bot_uuids])
                conditions.append(
                    f"LOWER(um.player_uuid) NOT IN ({placeholders})")

            # Exclude by name
            if bot_names:
                placeholders = ", ".join(["?" for _ in bot_names])
                conditions.append(f"um.player_nick NOT IN ({placeholders})")

            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY hof.score DESC LIMIT ?"

        # Prepare the parameters for the query
        params = []
        if exclude_bots:
            if bot_uuids:
                params.extend(bot_uuids)
            if bot_names:
                params.extend(bot_names)
        params.append(limit)

        results = await self._execute_query(query, tuple(params))

        # Add is_bot flag to each result
        for result in results:
            is_bot = False
            uuid = result.get("player_uuid", "").lower()
            nick = result.get("player_nick", "")

            if uuid in bot_uuids or nick in bot_names:
                is_bot = True

            result["is_bot"] = is_bot

            # Remove the UUID from the response to not expose it
            if "player_uuid" in result:
                del result["player_uuid"]

        return results
