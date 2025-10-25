"""Base client class with common functionality."""

import logging
from typing import Any, Optional

from src.core.exceptions import ClientError

logger = logging.getLogger(__name__)


class BaseClient:
    """Base client class with common functionality."""

    def __init__(self):
        """Initialize the base client."""
        self._logger = logger.getChild(self.__class__.__name__)

    def _log_error(self, message: str, error: Optional[Exception] = None) -> None:
        """
        Log an error message with optional exception.

        Args:
            message: Error message to log
            error: Optional exception to include in the log
        """
        if error:
            self._logger.error("%s: %s", message, error)
        else:
            self._logger.error(message)

    def _log_info(self, message: str, *args: Any) -> None:
        """
        Log an info message.

        Args:
            message: Message to log
            *args: Additional arguments for string formatting
        """
        self._logger.info(message, *args)

    def _log_warning(self, message: str, *args: Any) -> None:
        """
        Log a warning message.

        Args:
            message: Message to log
            *args: Additional arguments for string formatting
        """
        self._logger.warning(message, *args)

    def _raise_error(
        self,
        message: str,
        error_class: type[ClientError] = ClientError,
        original_error: Optional[Exception] = None
    ) -> None:
        """
        Log and raise a client error.

        Args:
            message: Error message
            error_class: Class of error to raise
            original_error: Original exception that caused this error
        """
        self._log_error(message, original_error)
        if original_error:
            raise error_class(f"{message}: {original_error}")
        raise error_class(message)
