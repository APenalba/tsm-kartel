"""Module to manage the download of the player statistics database via SFTP."""

import asyncio
import logging
import os
from typing import Optional

from src.core.config import settings

from .sftp_client import SFTPClient, SFTPError

logger = logging.getLogger(__name__)


class SFTPManager:
    """Manager for SFTP operations and periodic downloads."""

    def __init__(self):
        """Initialize the SFTP manager."""
        self._client = SFTPClient(
            host=settings.sftp_host,
            port=settings.sftp_port,
            username=settings.sftp_username,
            password=settings.sftp_password,
            host_key_fingerprint=getattr(
                settings, "sftp_host_key_fingerprint", None),
            connect_timeout=30,  # 30 seconds for connection
            operation_timeout=120  # 2 minutes for large operations
        )
        self._download_task: Optional[asyncio.Task] = None
        self._shutdown_event = asyncio.Event()
        self._download_lock = asyncio.Lock()

    async def download_player_stats_db(self, max_retries: int = 3) -> bool:
        """
        Download the player-statistics.db file from the SFTP server.

        Args:
            max_retries: Maximum number of retry attempts for failed downloads.

        Returns:
            bool: True if download was successful, False otherwise.
        """
        logger.info("Attempting to download player-statistics.db via SFTP.")

        # Ensure the local directory exists
        os.makedirs(os.path.dirname(
            settings.player_stats_db_path), exist_ok=True)

        async with self._download_lock:
            for attempt in range(max_retries):
                if self._shutdown_event.is_set():
                    logger.info("Shutdown requested, cancelling download.")
                    return False

                try:
                    success = await self._client.download_file(
                        remote_path=settings.sftp_remote_db_path,
                        local_path=settings.player_stats_db_path
                    )
                    if success:
                        logger.info(
                            "player-statistics.db downloaded successfully.")
                        return True

                except (SFTPError, asyncio.TimeoutError) as e:
                    logger.error(
                        "Error during download (attempt %d/%d): %s",
                        attempt + 1, max_retries, e
                    )

                    if attempt < max_retries - 1 and not self._shutdown_event.is_set():
                        # Backoff exponencial
                        retry_delay = min(30, 5 * (attempt + 1))
                        logger.info(
                            "Retrying download in %d seconds (attempt %d/%d)...",
                            retry_delay, attempt + 1, max_retries
                        )
                        try:
                            await asyncio.wait_for(
                                self._shutdown_event.wait(),
                                timeout=retry_delay
                            )
                            logger.info(
                                "Shutdown requested during retry delay.")
                            return False
                        except asyncio.TimeoutError:
                            continue  # Continue with the next attempt

            logger.error(
                "Failed to download player-statistics.db after %d attempts.",
                max_retries
            )
            return False

    async def start_periodic_download(self) -> None:
        """Start the periodic download task."""
        if self._download_task and not self._download_task.done():
            logger.warning("Periodic download task is already running.")
            return

        self._shutdown_event.clear()
        self._download_task = asyncio.create_task(
            self._periodic_download_loop(),
            name="periodic_sftp_download"
        )
        logger.info("Started periodic SFTP download task.")

    async def stop_periodic_download(self, timeout: float = 30.0) -> None:
        """
        Stop the periodic download task gracefully.

        Args:
            timeout: Maximum time to wait for current download to complete.
        """
        if not self._download_task:
            return

        logger.info("Stopping periodic SFTP download task...")
        self._shutdown_event.set()

        try:
            await asyncio.wait_for(self._download_task, timeout=timeout)
            logger.info("Periodic SFTP download task stopped successfully.")
        except asyncio.TimeoutError:
            logger.warning(
                "Timeout waiting for download task to stop. Cancelling..."
            )
            self._download_task.cancel()
            try:
                await self._download_task
            except asyncio.CancelledError:
                pass
        except (OSError, RuntimeError) as e:
            logger.error("System error stopping download task: %s", e)

        self._download_task = None

    async def _periodic_download_loop(self) -> None:
        """Background task to download the player statistics database periodically."""
        first_run = True

        while not self._shutdown_event.is_set():
            try:
                if not first_run:
                    try:
                        await asyncio.wait_for(
                            self._shutdown_event.wait(),
                            timeout=settings.sftp_download_interval_seconds
                        )
                        break  # Shutdown requested
                    except asyncio.TimeoutError:
                        pass  # Continue with download

                first_run = False
                logger.info(
                    "Initiating periodic SFTP download (every %s seconds).",
                    settings.sftp_download_interval_seconds
                )
                await self.download_player_stats_db()

            except asyncio.CancelledError:
                logger.info("Periodic download task cancelled.")
                break
            except (OSError, RuntimeError) as e:
                logger.error(
                    "System error in periodic download task: %s", e
                )
                if not self._shutdown_event.is_set():
                    # Esperar un poco antes de reintentar en caso de error
                    await asyncio.sleep(min(60, settings.sftp_download_interval_seconds))

        logger.info("Periodic download task stopped.")


# Global manager instance
sftp_manager = SFTPManager()

# Convenience functions for the API


async def start_periodic_downloads():
    """Start the periodic download task."""
    await sftp_manager.start_periodic_download()


async def stop_periodic_downloads():
    """Stop the periodic download task."""
    await sftp_manager.stop_periodic_download()


async def download_player_stats_db() -> bool:
    """
    Download the player statistics database.
    Convenience function for API endpoints.
    """
    return await sftp_manager.download_player_stats_db()
