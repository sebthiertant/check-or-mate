"""Database access: load and build GameRecord objects from SQLite."""

import io
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import chess.pgn

from .models import GameRecord, GameResult

_QUERY = (
    "SELECT game_id, pgn, white, black, white_rating, black_rating, "
    "time_class, end_time FROM games WHERE end_time >= ?"
)


def load_game_records(db_path: Path, since_timestamp: int) -> list[GameRecord]:
    connection = sqlite3.connect(db_path)
    rows = connection.execute(_QUERY, (since_timestamp,)).fetchall()
    connection.close()
    records = []
    for row in rows:
        record = _build_game_record(*row)
        if record is not None:
            records.append(record)
    return records


def _build_game_record(
    game_id: str,
    pgn: str,
    white: str,
    black: str,
    white_rating: int,
    black_rating: int,
    time_class: str,
    end_time: int,
) -> GameRecord | None:
    game = chess.pgn.read_game(io.StringIO(pgn))
    if game is None:
        return None
    result_str = game.headers.get("Result", "")
    try:
        result = GameResult(result_str)
    except ValueError:
        return None
    return GameRecord(
        game_id=game_id,
        pgn=pgn,
        white=white,
        black=black,
        white_rating=white_rating,
        black_rating=black_rating,
        result=result,
        eco=game.headers.get("ECO", ""),
        time_class=time_class,
        end_time=end_time,
        opening_name=game.headers.get("Opening", ""),
    )


def iso_date_to_unix(date_string: str) -> int:
    """Convert an ISO date string (YYYY-MM-DD) to a UTC Unix timestamp."""
    year, month, day = (int(p) for p in date_string.split("-"))
    return int(datetime(year, month, day, tzinfo=UTC).timestamp())


def unix_to_date(timestamp: int) -> str:
    """Convert a UTC Unix timestamp to an ISO date string (YYYY-MM-DD)."""
    return datetime.fromtimestamp(timestamp, tz=UTC).strftime("%Y-%m-%d")
