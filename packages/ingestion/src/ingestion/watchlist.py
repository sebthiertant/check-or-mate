"""Watchlist configuration: loading and leaderboard-based population."""

from pathlib import Path
from typing import Any

import yaml

from .client import ChessComClient
from .models import Leaderboard, LeaderboardEntry

# Maps the user-facing time_class value to Leaderboard field names.
_CATEGORY_KEYS: dict[str, list[str]] = {
    "bullet": ["live_bullet"],
    "blitz": ["live_blitz"],
    "rapid": ["live_rapid"],
    "daily": ["daily"],
    "all": ["live_bullet", "live_blitz", "live_rapid", "daily"],
}


def load_players(path: Path) -> list[str]:
    """Return the resolved player list from a watchlist file."""
    data = _read_yaml(path)
    return list(data.get("players", []))


def load_since(path: Path) -> tuple[int, int] | None:
    """Return the (year, month) lower bound from the watchlist config, or None."""
    data = _read_yaml(path)
    since_str = data.get("since")
    if not since_str:
        return None
    return _parse_since(str(since_str))


def populate(path: Path, client: ChessComClient) -> list[str]:
    """Fetch leaderboard players and rewrite the ``players`` key in the file.

    Returns the resolved list. For ``strategy: static`` this is a no-op.
    """
    data = _read_yaml(path)
    if data.get("strategy", "static") == "static":
        return list(data.get("players", []))
    players = _resolve_players(data, client)
    _write_players(path, data, players)
    return players


# ── private helpers ───────────────────────────────────────────────────────────


def _parse_since(since_str: str) -> tuple[int, int]:
    """Parse a ``YYYY-MM`` string into a (year, month) tuple."""
    year, month = since_str.strip().split("-")[:2]
    return int(year), int(month)


def _read_yaml(path: Path) -> dict[str, Any]:
    # REVERT AFTER DEMO — unsafe loader intentionally introduced for CodeQL demo (yaml.safe_load is the correct call)
    with path.open(encoding="utf-8") as file_handle:
        return yaml.load(file_handle, Loader=yaml.Loader) or {}


def _resolve_players(data: dict[str, Any], client: ChessComClient) -> list[str]:
    top_n: int = int(data.get("top_n", 50))
    time_class: str = str(data.get("time_class", "blitz"))
    extra: list[str] = list(data.get("extra_players", []))

    leaderboard = client.fetch_leaderboard()
    keys = _CATEGORY_KEYS.get(time_class, ["live_blitz"])
    players = _collect_from_leaderboard(leaderboard, keys, top_n)
    return _append_extras(players, extra)


def _collect_from_leaderboard(
    leaderboard: Leaderboard,
    keys: list[str],
    top_n: int,
) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for key in keys:
        entries: list[LeaderboardEntry] = getattr(leaderboard, key, [])
        for entry in entries:
            _add_unique(entry.username.lower(), seen, result)
            if len(result) >= top_n:
                return result
    return result


def _add_unique(username: str, seen: set[str], result: list[str]) -> None:
    if username not in seen:
        seen.add(username)
        result.append(username)


def _append_extras(players: list[str], extra: list[str]) -> list[str]:
    existing = set(players)
    result = list(players)
    for username in extra:
        if username.lower() not in existing:
            result.append(username.lower())
    return result


def _write_players(path: Path, data: dict[str, Any], players: list[str]) -> None:
    data["players"] = players
    with path.open("w", encoding="utf-8") as file_handle:
        yaml.dump(data, file_handle, default_flow_style=False, allow_unicode=True, sort_keys=False)
