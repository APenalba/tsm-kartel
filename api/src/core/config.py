"""Configuración de la aplicación"""

from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configuración de la aplicación"""

    # API Configuration
    api_host: str
    api_port: int
    debug: bool = False

    # Minecraft Server
    mc_server_host: str
    mc_server_port: int

    # Player Statistics Database
    player_stats_db_path: str = "./data/player-statistics.db"

    # SFTP Configuration for Player Statistics DB
    sftp_host: str
    sftp_port: int
    sftp_username: str
    sftp_password: str
    sftp_private_key_path: Optional[str] = None
    # Optional MD5 host key fingerprint (format with or without colons)
    sftp_host_key_fingerprint: Optional[str] = None
    sftp_remote_db_path: str
    sftp_download_interval_seconds: int = 300  # Download every 5 minutes by default

    # Rate Limiting
    rate_limit_default: str = "100/minute"  # Global rate limit by IP
    # Strict rate limit for /refresh-stats
    rate_limit_refresh_stats: str = "5/hour"

    # CORS
    cors_origins: str = "*"

    # Proxy trust for client IP extraction
    trust_proxy: bool = False

    # Bot UUIDs - UUIDs conocidos de bots como Steve y Alex
    bot_uuids: str = "8667ba71-b85a-4004-af54-457a9734eed7,ec561538-f3fd-461d-aff5-086b22154bce"

    class Config:
        """Configuración de la aplicación"""
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> list[str]:
        """Convierte la cadena de orígenes CORS en una lista."""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def bot_uuids_list(self) -> list[str]:
        """Convierte la cadena de UUIDs de bots en una lista."""
        return [uuid.strip().lower() for uuid in self.bot_uuids.split(",")]


settings = Settings()
