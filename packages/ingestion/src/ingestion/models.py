"""Domain models for Chess.com API responses."""

from pydantic import BaseModel, ConfigDict


class PlayerResult(BaseModel):
    username: str
    rating: int
    result: str  # "win", "checkmated", "resigned", "drawn", "stalemate", …


class RawGame(BaseModel):
    model_config = ConfigDict(extra="ignore")
    url: str
    pgn: str | None = None  # absent for forfeited / abandoned games
    time_control: str
    end_time: int
    rated: bool
    white: PlayerResult
    black: PlayerResult
    time_class: str  # "bullet", "blitz", "rapid", "classical"


class GamesArchive(BaseModel):
    games: list[RawGame]


class ArchiveList(BaseModel):
    archives: list[str]


class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    rank: int


class Leaderboard(BaseModel):
    """Top-50 players per live time control from the Chess.com leaderboard API."""

    model_config = ConfigDict(extra="ignore")
    live_bullet: list[LeaderboardEntry] = []
    live_blitz: list[LeaderboardEntry] = []
    live_rapid: list[LeaderboardEntry] = []
    daily: list[LeaderboardEntry] = []
