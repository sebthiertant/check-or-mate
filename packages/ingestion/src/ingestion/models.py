"""Domain models for Chess.com API responses."""

from pydantic import BaseModel


class PlayerResult(BaseModel):
    username: str
    rating: int
    result: str  # "win", "checkmated", "resigned", "drawn", "stalemate", …


class RawGame(BaseModel):
    url: str
    pgn: str
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
