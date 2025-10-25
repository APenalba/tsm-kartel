"""Common decorators for the application."""

import asyncio
import functools
import logging
from typing import Any, Callable, TypeVar

from ..core.exceptions import AppError

logger = logging.getLogger(__name__)

T = TypeVar('T')


def with_retries(
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple[type[Exception], ...] = (Exception,)
) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator to add retry logic to async methods.

    Args:
        max_retries: Maximum number of retry attempts
        delay: Base delay between retries
        backoff: Multiplier for delay between retries
        exceptions: Tuple of exceptions to catch and retry
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> T:
            last_error = None
            current_delay = delay

            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        logger.warning(
                            "Attempt %d/%d failed for %s: %s. Retrying in %.1f seconds...",
                            attempt + 1, max_retries, func.__name__, e, current_delay
                        )
                        await asyncio.sleep(current_delay)
                        current_delay *= backoff
                    else:
                        logger.error(
                            "All %d attempts failed for %s. Last error: %s",
                            max_retries, func.__name__, e
                        )

            if last_error:
                raise last_error
            raise AppError(f"All {max_retries} attempts failed")

        return wrapper
    return decorator
