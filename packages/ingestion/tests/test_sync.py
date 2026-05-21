"""Tests for Syncer."""

import sqlite3
from unittest.mock import MagicMock

from ingestion.models import ArchiveList, GamesArchive, PlayerResult, RawGame
from ingestion.store import Store
from ingestion.sync import Syncer, _parse_archive_url

_ARCHIVE_URL = "https://api.chess.com/pub/player/hikaru/games/2024/01"


def _raw_game(game_id: str = "123") -> RawGame:
    return RawGame(
        url=f"https://www.chess.com/game/live/{game_id}",
        pgn='[Event "Live Chess"]\n\n1. e4 *',
        time_control="600",
        end_time=1705000000,
        rated=True,
        time_class="rapid",
        white=PlayerResult(username="hikaru", rating=2850, result="win"),
        black=PlayerResult(username="MagnusCarlsen", rating=2839, result="checkmated"),
    )


def _in_memory_store() -> Store:
    return Store(sqlite3.connect(":memory:"))


# ── _parse_archive_url ────────────────────────────────────────────────────────


def test_parse_archive_url_returns_year_and_month() -> None:
    year, month = _parse_archive_url(_ARCHIVE_URL)

    assert year == 2024
    assert month == 1


def test_parse_archive_url_handles_trailing_slash() -> None:
    year, month = _parse_archive_url(_ARCHIVE_URL + "/")

    assert year == 2024
    assert month == 1


# ── Syncer ────────────────────────────────────────────────────────────────────


def test_sync_player_fetches_new_archive() -> None:
    client = MagicMock()
    client.list_archives.return_value = ArchiveList(archives=[_ARCHIVE_URL])
    client.fetch_games.return_value = GamesArchive(games=[_raw_game()])
    store = _in_memory_store()

    syncer = Syncer(client, store)
    count = syncer.sync_player("hikaru")

    assert count == 1
    client.fetch_games.assert_called_once_with("hikaru", 2024, 1)


def test_sync_player_skips_already_synced_archive() -> None:
    client = MagicMock()
    client.list_archives.return_value = ArchiveList(archives=[_ARCHIVE_URL])
    store = _in_memory_store()
    store.mark_archive_synced("hikaru", _ARCHIVE_URL)
    store.commit()

    syncer = Syncer(client, store)
    count = syncer.sync_player("hikaru")

    assert count == 0
    client.fetch_games.assert_not_called()


def test_sync_player_returns_zero_for_empty_archive() -> None:
    client = MagicMock()
    client.list_archives.return_value = ArchiveList(archives=[_ARCHIVE_URL])
    client.fetch_games.return_value = GamesArchive(games=[])
    store = _in_memory_store()

    syncer = Syncer(client, store)
    count = syncer.sync_player("hikaru")

    assert count == 0


def test_sync_player_accumulates_multiple_archives() -> None:
    archive_jan = "https://api.chess.com/pub/player/hikaru/games/2024/01"
    archive_feb = "https://api.chess.com/pub/player/hikaru/games/2024/02"

    client = MagicMock()
    client.list_archives.return_value = ArchiveList(archives=[archive_jan, archive_feb])
    client.fetch_games.side_effect = [
        GamesArchive(games=[_raw_game("100"), _raw_game("101")]),
        GamesArchive(games=[_raw_game("200")]),
    ]
    store = _in_memory_store()

    syncer = Syncer(client, store)
    count = syncer.sync_player("hikaru")

    assert count == 3


def test_sync_player_marks_archive_as_synced() -> None:
    client = MagicMock()
    client.list_archives.return_value = ArchiveList(archives=[_ARCHIVE_URL])
    client.fetch_games.return_value = GamesArchive(games=[_raw_game()])
    store = _in_memory_store()

    Syncer(client, store).sync_player("hikaru")

    assert store.is_archive_synced("hikaru", _ARCHIVE_URL)
