"""Tests for the watchlist module."""

from pathlib import Path

import httpx
from ingestion.client import ChessComClient
from ingestion.watchlist import load_players, load_since, populate

_LEADERBOARD_URL = "https://api.chess.com/pub/leaderboards"


def _entry(rank: int, username: str) -> dict[str, object]:
    return {"rank": rank, "username": username, "player_id": rank, "url": ""}


def _make_leaderboard_client(blitz: list[str]) -> ChessComClient:
    entries = [_entry(i + 1, name) for i, name in enumerate(blitz)]
    payload = {
        "live_blitz": entries,
        "live_bullet": [],
        "live_rapid": [],
        "daily": [],
    }

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == _LEADERBOARD_URL:
            return httpx.Response(200, json=payload)
        return httpx.Response(404)

    return ChessComClient(httpx.Client(transport=httpx.MockTransport(handler)))


# ── load_players ──────────────────────────────────────────────────────────────


def test_load_players_returns_list(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("players:\n  - hikaru\n  - magnuscarlsen\n")

    assert load_players(watchlist) == ["hikaru", "magnuscarlsen"]


def test_load_players_empty_when_no_key(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("strategy: leaderboard\n")

    assert load_players(watchlist) == []


# ── load_since ────────────────────────────────────────────────────────────────


def test_load_since_returns_year_month_tuple(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("since: '2025-05'\n")

    assert load_since(watchlist) == (2025, 5)


def test_load_since_returns_none_when_absent(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("players:\n  - hikaru\n")

    assert load_since(watchlist) is None


# ── populate — static strategy ────────────────────────────────────────────────


def test_populate_static_is_noop(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("strategy: static\nplayers:\n  - hikaru\n")
    client = _make_leaderboard_client(["player1", "player2"])

    result = populate(watchlist, client)

    assert result == ["hikaru"]
    # file must not have been rewritten with leaderboard data
    assert "player1" not in watchlist.read_text()


def test_populate_default_strategy_is_static(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("players:\n  - hikaru\n")
    client = _make_leaderboard_client(["player1"])

    result = populate(watchlist, client)

    assert result == ["hikaru"]


# ── populate — leaderboard strategy ──────────────────────────────────────────


def test_populate_leaderboard_writes_players(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("strategy: leaderboard\ntop_n: 3\ntime_class: blitz\n")
    client = _make_leaderboard_client(["alpha", "beta", "gamma", "delta"])

    result = populate(watchlist, client)

    assert result == ["alpha", "beta", "gamma"]
    assert "alpha" in watchlist.read_text()


def test_populate_respects_top_n(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text("strategy: leaderboard\ntop_n: 2\ntime_class: blitz\n")
    client = _make_leaderboard_client(["a", "b", "c", "d", "e"])

    result = populate(watchlist, client)

    assert len(result) == 2


def test_populate_appends_extra_players(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text(
        "strategy: leaderboard\ntop_n: 2\ntime_class: blitz\nextra_players:\n  - special_user\n"
    )
    client = _make_leaderboard_client(["a", "b", "c"])

    result = populate(watchlist, client)

    assert "special_user" in result
    assert len(result) == 3  # 2 from leaderboard + 1 extra


def test_populate_deduplicates_extra_players(tmp_path: Path) -> None:
    watchlist = tmp_path / "watchlist.yml"
    watchlist.write_text(
        "strategy: leaderboard\ntop_n: 3\ntime_class: blitz\nextra_players:\n  - alpha\n"
    )
    client = _make_leaderboard_client(["alpha", "beta", "gamma"])

    result = populate(watchlist, client)

    assert result.count("alpha") == 1
