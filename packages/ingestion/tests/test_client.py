"""Tests for ChessComClient."""

import httpx
import pytest
from ingestion.client import ChessComClient
from ingestion.models import ArchiveList, GamesArchive

_ARCHIVES_URL = "https://api.chess.com/pub/player/hikaru/games/archives"
_GAMES_URL = "https://api.chess.com/pub/player/hikaru/games/2024/01"

_SAMPLE_GAME = {
    "url": "https://www.chess.com/game/live/123",
    "pgn": '[Event "Live Chess"]\n\n1. e4 *',
    "time_control": "600",
    "end_time": 1705000000,
    "rated": True,
    "time_class": "rapid",
    "white": {"username": "hikaru", "rating": 2850, "result": "win"},
    "black": {"username": "MagnusCarlsen", "rating": 2839, "result": "checkmated"},
}


def _make_client(routes: dict[str, object]) -> ChessComClient:
    def handler(request: httpx.Request) -> httpx.Response:
        body = routes.get(str(request.url))
        if body is None:
            return httpx.Response(404)
        return httpx.Response(200, json=body)

    return ChessComClient(httpx.Client(transport=httpx.MockTransport(handler)))


def test_list_archives_returns_archive_list() -> None:
    client = _make_client({_ARCHIVES_URL: {"archives": [_GAMES_URL]}})

    result = client.list_archives("hikaru")

    assert isinstance(result, ArchiveList)
    assert result.archives == [_GAMES_URL]


def test_fetch_games_returns_games_archive() -> None:
    client = _make_client({_GAMES_URL: {"games": [_SAMPLE_GAME]}})

    result = client.fetch_games("hikaru", 2024, 1)

    assert isinstance(result, GamesArchive)
    assert len(result.games) == 1
    assert result.games[0].white.username == "hikaru"
    assert result.games[0].time_class == "rapid"


def test_fetch_games_pads_month_with_zero() -> None:
    padded_url = "https://api.chess.com/pub/player/hikaru/games/2024/03"
    client = _make_client({padded_url: {"games": []}})

    result = client.fetch_games("hikaru", 2024, 3)

    assert isinstance(result, GamesArchive)


def test_fetch_games_raises_on_http_error() -> None:
    client = _make_client({})

    with pytest.raises(httpx.HTTPStatusError):
        client.fetch_games("nobody", 2024, 1)
