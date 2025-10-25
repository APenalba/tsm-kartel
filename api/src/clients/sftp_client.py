"""SFTP Client to download files from a remote server."""

import asyncio
from contextlib import asynccontextmanager
import logging
import os
import tempfile
from typing import Optional

import paramiko
from paramiko.client import MissingHostKeyPolicy
from paramiko.ssh_exception import (
    AuthenticationException,
    NoValidConnectionsError,
    SSHException,
)

from src.core.exceptions import AppError
from src.utils.caching import Cache
from src.utils.decorators import with_retries

logger = logging.getLogger(__name__)


class SFTPError(AppError):
    """Base exception for SFTP related errors."""


class SFTPConnectionError(SFTPError):
    """Exception raised when connection to SFTP server fails."""


class SFTPAuthenticationError(SFTPError):
    """Exception raised when authentication to SFTP server fails."""


class SFTPFileError(SFTPError):
    """Exception raised when file operations fail."""


class SFTPClient:
    """SFTP Client to download files from a remote server."""

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        password: Optional[str] = None,
        private_key_path: Optional[str] = None,
        host_key_fingerprint: Optional[str] = None,
        connect_timeout: int = 30,
        operation_timeout: int = 60
    ):
        """
        Initialize the SFTP client.

        Args:
            host: Host of the SFTP server.
            port: Port of the SFTP server.
            username: Username for the SFTP connection.
            password: Password for the SFTP connection.
            private_key_path: Path to private key file for authentication.
            connect_timeout: Timeout in seconds for establishing connection.
            operation_timeout: Timeout in seconds for SFTP operations.
        """
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.private_key_path = private_key_path
        self.host_key_fingerprint = host_key_fingerprint
        self.connect_timeout = connect_timeout
        self.operation_timeout = operation_timeout
        self._sftp_client = None
        self._ssh_client = None
        self._cache = Cache(default_ttl=300)

    @asynccontextmanager
    async def connection(self):
        """
        Context manager for SFTP connection.

        Usage:
            async with client.connection() as sftp:
                await sftp.download_file(...)
        """
        await self._connect()
        try:
            yield self
        finally:
            await self._close()

    async def _connect(self):
        """
        Establish an SFTP connection to the remote server.
        If there is an active connection, do nothing.
        """
        if self._sftp_client and self._ssh_client:
            try:
                transport = self._ssh_client.get_transport()
                if transport and transport.is_active():
                    return
            except (SSHException, AttributeError, OSError):
                pass

        logger.info(
            "SFTP connect host=%s port=%s user=%s key=%s",
            self.host,
            self.port,
            self.username,
            os.path.basename(
                self.private_key_path) if self.private_key_path else "-",
        )
        try:
            self._ssh_client = await asyncio.to_thread(self._create_ssh_client_sync)

            # Verify host key fingerprint if provided
            try:
                transport = self._ssh_client.get_transport()
                if not transport:
                    raise SFTPConnectionError(
                        "SSH transport not available after connect")
                server_key = transport.get_remote_server_key()
                if self.host_key_fingerprint:
                    if not self._fingerprint_matches(self.host_key_fingerprint, server_key):
                        await self._close()
                        raise SFTPConnectionError(
                            "Server host key fingerprint mismatch")
                else:
                    logger.warning(
                        "No SFTP host key fingerprint configured; proceeding without verification.")
            except (SSHException, AttributeError, OSError):
                await self._close()
                raise

            # Open SFTP session
            self._sftp_client = await asyncio.to_thread(self._ssh_client.open_sftp)
            logger.info("SFTP connection established")
        except AuthenticationException as e:
            logger.error("SFTP auth failed user=%s host=%s:%s err=%s",
                         self.username, self.host, self.port, e)
            await self._close()
            raise SFTPAuthenticationError(f"Authentication failed: {e}") from e
        except (SSHException, NoValidConnectionsError) as e:
            logger.error("SFTP connection failed host=%s:%s err=%s",
                         self.host, self.port, e)
            await self._close()
            raise SFTPConnectionError(f"Connection failed: {e}") from e
        except (RuntimeError,) as e:
            logger.error(
                "SFTP system error during connection host=%s:%s err=%s", self.host, self.port, e)
            await self._close()
            raise SFTPError(f"Unexpected error: {e}") from e

    def _create_ssh_client_sync(self) -> paramiko.SSHClient:
        """Create and connect an SSHClient synchronously."""
        client = paramiko.SSHClient()

        class _FingerprintPolicy(MissingHostKeyPolicy):
            def __init__(self, expected_fingerprint_no_colons: str):
                self._expected = expected_fingerprint_no_colons

            def missing_host_key(self, client: paramiko.SSHClient, hostname: str, key: paramiko.PKey):
                actual_md5 = key.get_fingerprint().hex()
                if actual_md5 == self._expected:
                    # Accept and store key for this session using public API
                    client.get_host_keys().add(hostname, key.get_name(), key)
                else:
                    raise paramiko.SSHException(
                        "Server host key fingerprint mismatch")

        if self.host_key_fingerprint:
            expected = self._normalize_md5_fingerprint(
                self.host_key_fingerprint)
            client.set_missing_host_key_policy(_FingerprintPolicy(expected))
        else:
            # Accept and warn if no fingerprint configured
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        # Support password and/or private key auth
        connect_kwargs = {
            "hostname": self.host,
            "port": self.port,
            "username": self.username,
            "timeout": self.connect_timeout,
            "auth_timeout": self.connect_timeout,
            "banner_timeout": self.connect_timeout,
        }
        if self.password:
            connect_kwargs["password"] = self.password
        if self.private_key_path:
            try:
                pkey = paramiko.RSAKey.from_private_key_file(
                    self.private_key_path)
            except Exception as e:
                raise SFTPAuthenticationError(
                    f"Invalid private key file: {e}") from e
            connect_kwargs["pkey"] = pkey
        client.connect(**connect_kwargs)
        return client

    @staticmethod
    def _normalize_md5_fingerprint(fp: str) -> str:
        f = fp.strip().lower()
        return f.replace(":", "")

    def _fingerprint_matches(self, expected: str, key: paramiko.PKey) -> bool:
        # Compare MD5 fingerprint forms (with/without colons)
        md5_bytes = key.get_fingerprint()  # MD5 digest bytes
        actual_md5 = md5_bytes.hex()
        exp = self._normalize_md5_fingerprint(expected)
        return actual_md5 == exp

    async def _close(self):
        """Close the SFTP connection and the underlying transport."""
        if self._sftp_client:
            try:
                await asyncio.to_thread(self._sftp_client.close)
            finally:
                self._sftp_client = None
        if self._ssh_client:
            try:
                await asyncio.to_thread(self._ssh_client.close)
            finally:
                self._ssh_client = None
        logger.info("SFTP connection closed host=%s", self.host)

    async def _get_remote_stats(self, remote_path: str) -> paramiko.SFTPAttributes:
        """
        Get remote file stats with caching.

        Args:
            remote_path: Path of the file on the SFTP server.

        Returns:
            paramiko.SFTPAttributes: File stats

        Raises:
            SFTPFileError: If file doesn't exist or can't be accessed
        """
        cache_key = f"stat_{remote_path}"
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        try:
            stats = await asyncio.to_thread(
                self._sftp_client.stat,
                remote_path
            )
            if not stats:
                raise SFTPFileError(f"Remote file not found: {remote_path}")
            self._cache.set(cache_key, stats)
            return stats
        except IOError as e:
            raise SFTPFileError(f"Failed to stat remote file: {e}") from e

    @with_retries(max_retries=3, delay=5.0, exceptions=(SFTPError, asyncio.TimeoutError))
    async def download_file(
        self,
        remote_path: str,
        local_path: str
    ) -> bool:
        """
        Download a file from the SFTP server to a local path in an atomic way.

        Args:
            remote_path: Path of the file on the SFTP server.
            local_path: Path where to save the file.

        Returns:
            True if the download was successful, False otherwise.

        Raises:
            SFTPError: If any SFTP operation fails
            asyncio.TimeoutError: If operation times out
        """
        try:
            async with self.connection():
                # Create a temporary file in the same directory as local_path
                local_dir = os.path.dirname(os.path.abspath(local_path))
                os.makedirs(local_dir, exist_ok=True)

                with tempfile.NamedTemporaryFile(
                    dir=local_dir,
                    delete=False
                ) as tmp_file:
                    temp_local_path = tmp_file.name

                logger.info("SFTP downloading remote=%s temp=%s",
                            remote_path, temp_local_path)

                # Check if remote file exists and get size
                stats = await self._get_remote_stats(remote_path)

                # Download file
                await asyncio.wait_for(
                    asyncio.to_thread(
                        self._sftp_client.get,
                        remote_path,
                        temp_local_path
                    ),
                    timeout=self.operation_timeout
                )

                # Verify file size
                local_size = os.path.getsize(temp_local_path)
                if local_size != stats.st_size:
                    raise SFTPFileError(
                        f"Size mismatch: expected {stats.st_size}, "
                        f"got {local_size}")

                # Atomic rename
                os.replace(temp_local_path, local_path)
                logger.info(
                    "SFTP downloaded and replaced local=%s size=%s", local_path, local_size)
                return True

        except (SFTPError, asyncio.TimeoutError):
            raise
        except (OSError, IOError, SSHException) as e:
            logger.error("SFTP I/O error remote=%s err=%s", remote_path, e)
            raise SFTPError(f"Failed to download file: {e}") from e
        finally:
            # Clean temporary file if it exists
            if 'temp_local_path' in locals() and \
               os.path.exists(temp_local_path):
                try:
                    os.remove(temp_local_path)
                except OSError as e:
                    logger.warning(
                        "SFTP tmp cleanup failed file=%s err=%s", temp_local_path, e)
