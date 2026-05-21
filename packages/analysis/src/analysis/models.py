"""Domain models for the analysis pipeline."""

from dataclasses import dataclass
from enum import StrEnum


class GameResult(StrEnum):
    WHITE_WINS = "1-0"
    BLACK_WINS = "0-1"
    DRAW = "1/2-1/2"


@dataclass(frozen=True)
class GameRecord:
    """Input to the scoring pipeline — parsed from SQLite + PGN headers."""

    game_id: str
    pgn: str
    white_rating: int
    black_rating: int
    result: GameResult
    eco: str


@dataclass(frozen=True)
class PartialRawScores:
    """Per-game raw scores — opening_rarity is deferred to corpus level."""

    sacrifice: float
    eval_swing: float
    brilliancy: float
    time_pressure: float
    endgame_quality: float
    rating_upset: float


@dataclass(frozen=True)
class RawScores:
    """All seven raw dimension scores, before corpus normalisation."""

    sacrifice: float
    eval_swing: float
    brilliancy: float
    time_pressure: float
    endgame_quality: float
    rating_upset: float
    opening_rarity: float


@dataclass(frozen=True)
class NormalizedScores:
    """All dimensions normalised to [0, 100] with a weighted overall score."""

    sacrifice: int
    eval_swing: int
    brilliancy: int
    time_pressure: int
    endgame_quality: int
    rating_upset: int
    opening_rarity: int
    overall: int
