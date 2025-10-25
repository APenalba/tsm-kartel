"""Data models for player statistics."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class PlayerStatisticEntry(BaseModel):
    """Generic entry for player statistics (broken, crafted, etc.)"""
    stat_name: str
    amount: int
    position: Optional[int] = None


class PlayerUUIDMap(BaseModel):
    """Mapping of player UUIDs to names and last online."""
    id: int
    player_uuid: str
    player_nick: Optional[str] = None
    player_last_online: Optional[datetime] = None


class HallOfFameEntry(BaseModel):
    """Entry of the Hall of Fame."""
    player_id: int
    first_place: int
    second_place: int
    third_place: int
    fourth_place: int
    fifth_place: int
    score: int


class SyncMetadata(BaseModel):
    """Synchronization metadata of the server."""
    last_update: Optional[datetime] = None
    server_name: Optional[str] = None
    server_desc: Optional[str] = None
    server_url: Optional[str] = None
    server_icon: Optional[str] = None  # Base64 encoded image


class PlayerStatistics(BaseModel):
    """Aggregation of all player statistics."""
    player_id: int
    uuid_map_entry: Optional[PlayerUUIDMap] = None
    broken: Optional[List[PlayerStatisticEntry]] = None
    crafted: Optional[List[PlayerStatisticEntry]] = None
    custom: Optional[List[PlayerStatisticEntry]] = None
    dropped: Optional[List[PlayerStatisticEntry]] = None
    killed: Optional[List[PlayerStatisticEntry]] = None
    killed_by: Optional[List[PlayerStatisticEntry]] = None
    mined: Optional[List[PlayerStatisticEntry]] = None
    picked_up: Optional[List[PlayerStatisticEntry]] = None
    used: Optional[List[PlayerStatisticEntry]] = None
    hall_of_fame_entry: Optional[HallOfFameEntry] = None


class PlayerScoreEntry(BaseModel):
    """Entry for the leaderboard of the Hall of Fame."""
    player_id: int
    player_nick: Optional[str] = None
    score: int
    is_bot: bool = False
