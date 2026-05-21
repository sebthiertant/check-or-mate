"""SQLite persistence layer for ingested games and sync state."""

import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from .models import RawGame

_SCHEMA = """
CREATE TABLE IF NOT EXISTS games (
    game_id      TEXT PRIMARY KEY,
    url          TEXT NOT NULL,
    pgn          TEXT NOT NULL,
    white        TEXT NOT NULL,
    black        TEXT NOT NULL,
    white_rating INTEGER NOT NULL,
    black_rating INTEGER NOT NULL,
    time_class   TEXT NOT NULL,
    time_control TEXT NOT NULL,
    end_time     INTEGER NOT NULL,
    rated        INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_log (
    player      TEXT NOT NULL,
    archive_url TEXT NOT NULL,
    synced_at   TEXT NOT NULL,
    PRIMARY KEY (player, archive_url)
);
"""


class Store:
    def __init__(self, connection: sqlite3.Connection) -> None:
        self._connection = connection
        self._connection.executescript(_SCHEMA)
        self._connection.commit()

    @classmethod
    def open(cls, path: Path) -> "Store":
        """Open (or create) a SQLite store at the given path."""
        path.parent.mkdir(parents=True, exist_ok=True)
        return cls(sqlite3.connect(path))

    def save_game(self, game: RawGame) -> None:
        """Insert a game; silently skips duplicates."""
        game_id = game.url.rstrip("/").split("/")[-1]
        self._connection.execute(
            "INSERT OR IGNORE INTO games VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (
                game_id,
                game.url,
                game.pgn,
                game.white.username,
                game.black.username,
                game.white.rating,
                game.black.rating,
                game.time_class,
                game.time_control,
                game.end_time,
                int(game.rated),
            ),
        )

    def mark_archive_synced(self, player: str, archive_url: str) -> None:
        now = datetime.now(UTC).isoformat()
        self._connection.execute(
            "INSERT OR REPLACE INTO sync_log VALUES (?,?,?)",
            (player, archive_url, now),
        )

    def is_archive_synced(self, player: str, archive_url: str) -> bool:
        cursor = self._connection.execute(
            "SELECT 1 FROM sync_log WHERE player = ? AND archive_url = ?",
            (player, archive_url),
        )
        return cursor.fetchone() is not None

    def commit(self) -> None:
        self._connection.commit()

    def close(self) -> None:
        self._connection.close()

    def __enter__(self) -> "Store":
        return self

    def __exit__(self, *_: object) -> None:
        self.commit()
        self.close()
