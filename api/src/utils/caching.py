"""Caching utilities for the application."""

from dataclasses import dataclass
import time
from typing import Any, Dict, Optional


@dataclass
class CacheEntry:
    """Cache entry with value and expiration time."""
    value: Any
    expires_at: float


class Cache:
    """Simple in-memory cache with TTL."""

    def __init__(self, default_ttl: float = 60.0):
        """
        Initialize the cache.

        Args:
            default_ttl: Default time-to-live in seconds for cache entries
        """
        self._cache: Dict[str, CacheEntry] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache if not expired.

        Args:
            key: Cache key

        Returns:
            Cached value or None if expired/not found
        """
        if key in self._cache:
            entry = self._cache[key]
            if entry.expires_at > time.time():
                return entry.value
            del self._cache[key]
        return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[float] = None
    ) -> None:
        """
        Set a value in cache with expiration.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        expires_at = time.time() + (ttl or self._default_ttl)
        self._cache[key] = CacheEntry(value=value, expires_at=expires_at)

    def delete(self, key: str) -> None:
        """
        Delete a key from cache.

        Args:
            key: Cache key to delete
        """
        if key in self._cache:
            del self._cache[key]

    def clear(self) -> None:
        """Clear all entries from cache."""
        self._cache.clear()

    def cleanup(self) -> None:
        """Remove all expired entries from cache."""
        now = time.time()
        expired_keys = [
            key for key, entry in self._cache.items()
            if entry.expires_at <= now
        ]
        for key in expired_keys:
            del self._cache[key]
