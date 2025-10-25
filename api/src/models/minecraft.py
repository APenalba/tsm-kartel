"""Data models for Minecraft server information."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Player(BaseModel):
    """Information about a connected player."""
    name: str
    id: Optional[str] = None
    is_bot: bool = False


class Version(BaseModel):
    """Information about the server version."""
    name: str
    protocol: int


class PlayerInfo(BaseModel):
    """Information about the players of the server."""
    online: int
    max: int
    players: Optional[List[Player]] = None


class ServerStatus(BaseModel):
    """Full status of the Minecraft server."""
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
    queried_at: datetime = Field(default_factory=datetime.utcnow)


class ServerQuery(BaseModel):
    """Detailed information about the server obtained via Query protocol."""
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


class ServerPing(BaseModel):
    """Information about the server latency."""
    online: bool
    host: str
    port: int
    latency: Optional[float] = None
    measured_at: datetime = Field(default_factory=datetime.utcnow)
