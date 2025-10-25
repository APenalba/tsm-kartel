"""Base exceptions for the application."""


class AppError(Exception):
    """Base exception for application errors."""
    pass


class ConfigError(AppError):
    """Exception raised for configuration errors."""
    pass


class ClientError(AppError):
    """Base exception for client errors."""
    pass


class MinecraftClientError(ClientError):
    """Base exception for Minecraft client errors."""
    pass


class SFTPClientError(ClientError):
    """Base exception for SFTP client errors."""
    pass


class DatabaseError(AppError):
    """Base exception for database errors."""
    pass
