"""
Minecraft Client - Module

This module contains the MinecraftClient class that is responsible
for querying information about Minecraft Java servers.
"""

import asyncio
import logging
from typing import Any, Callable, Optional, cast

from mcstatus import JavaServer
from mcstatus.status_response import JavaStatusResponse

from src.core.exceptions import AppError
from src.utils.caching import Cache
from src.utils.decorators import with_retries

logger = logging.getLogger(__name__)


class MinecraftClientError(AppError):
    """Base exception for Minecraft client errors."""
    ...


class ServerConnectionError(MinecraftClientError):
    """Exception raised when connection to server fails."""
    ...


class QueryProtocolError(MinecraftClientError):
    """Exception raised when query protocol fails."""
    ...


class MinecraftClient:
    """Client to get information about Minecraft Java servers"""

    def __init__(
        self,
        host: str,
        port: int = 25565,
        timeout: float = 10.0,
        cache_ttl: float = 30.0
    ):
        """
        Initialize the Minecraft client.

        Args:
            host: Server hostname
            port: Server port (default: 25565)
            timeout: Timeout in seconds for server operations
            cache_ttl: Time in seconds to cache server responses
        """
        self.host = host
        self.port = port
        self.timeout = timeout
        self.server = JavaServer.lookup(f"{host}:{port}")
        self._cache = Cache(default_ttl=cache_ttl)

    async def _run_with_timeout(self, func: Callable[[], Any]) -> Any:
        """Run a function with timeout in executor."""
        loop = asyncio.get_event_loop()
        return await asyncio.wait_for(
            loop.run_in_executor(None, func),
            timeout=self.timeout
        )

    @with_retries(max_retries=3, delay=1.0)
    async def get_status(self) -> Optional[JavaStatusResponse]:
        """
        Get the full status of the Minecraft server.
        Includes players, version, MOTD, etc.

        Returns:
            JavaStatusResponse if successful, None otherwise

        Raises:
            ServerConnectionError: If connection to server fails
            asyncio.TimeoutError: If operation times out
        """
        cache_key = f"status_{self.host}_{self.port}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            status = await self._run_with_timeout(self.server.status)
            self._cache.set(cache_key, status)
            return status
        except asyncio.TimeoutError:
            logger.error(
                "Minecraft status timeout host=%s port=%s timeout=%s",
                self.host,
                self.port,
                self.timeout,
            )
            raise
        except Exception as e:
            logger.error(
                "Minecraft status error host=%s port=%s err=%s",
                self.host,
                self.port,
                e,
            )
            raise ServerConnectionError(
                f"Failed to get server status: {e}") from e

    @with_retries(max_retries=2, delay=0.5)
    async def get_ping(self) -> float:
        """
        Get the server latency in milliseconds.

        Returns:
            float: Latency in milliseconds

        Raises:
            ServerConnectionError: If connection to server fails
            asyncio.TimeoutError: If operation times out
        """
        cache_key = f"ping_{self.host}_{self.port}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            latency = await self._run_with_timeout(self.server.ping)
            self._cache.set(cache_key, latency)
            return cast(float, latency)
        except asyncio.TimeoutError:
            logger.error(
                "Minecraft ping timeout host=%s port=%s timeout=%s",
                self.host,
                self.port,
                self.timeout,
            )
            raise
        except Exception as e:
            logger.error(
                "Minecraft ping error host=%s port=%s err=%s",
                self.host,
                self.port,
                e,
            )
            raise ServerConnectionError(
                f"Failed to get server ping: {e}") from e

    @with_retries(max_retries=3, delay=1.0)
    async def get_query(self) -> dict:
        """
        Get detailed information about the server using the Query protocol.
        Note: The server must have enable-query=true in server.properties

        Returns:
            dict: Server information including players, plugins, etc.

        Raises:
            QueryProtocolError: If query protocol fails or is not enabled
            ServerConnectionError: If connection to server fails
            asyncio.TimeoutError: If operation times out
        """
        cache_key = f"query_{self.host}_{self.port}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            query = await self._run_with_timeout(self.server.query)
            result = {
                "motd": query.motd,
                "game_type": query.software.brand if query.software else None,
                "game_version": query.software.version if query.software else None,
                "plugins": query.software.plugins if query.software else [],
                "map": query.map,
                "num_players": query.players.online,
                "max_players": query.players.max,
                "players": query.players.names if query.players.names else [],
                "host_ip": query.host_ip,
                "host_port": query.host_port,
            }
            self._cache.set(cache_key, result)
            return result
        except asyncio.TimeoutError:
            logger.error(
                "Minecraft query timeout host=%s port=%s timeout=%s",
                self.host,
                self.port,
                self.timeout,
            )
            raise
        except Exception as e:
            logger.error(
                "Minecraft query error host=%s port=%s err=%s",
                self.host,
                self.port,
                e,
            )
            if "enable-query=true" in str(e):
                raise QueryProtocolError(
                    "Query protocol not enabled on server. "
                    "Set enable-query=true in server.properties"
                ) from e
            raise ServerConnectionError(f"Failed to query server: {e}") from e
