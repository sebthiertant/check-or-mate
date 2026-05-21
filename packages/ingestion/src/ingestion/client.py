"""HTTP client for the Chess.com Public API."""

import httpx

from .models import ArchiveList, GamesArchive

_BASE_URL = "https://api.chess.com/pub"
_DEFAULT_HEADERS = {"User-Agent": "check-or-mate/0.1 (github.com/sebthiertant/check-or-mate)"}


class ChessComClient:
    def __init__(self, http_client: httpx.Client | None = None) -> None:
        self._http = http_client or httpx.Client(headers=_DEFAULT_HEADERS, timeout=30.0)

    def list_archives(self, player: str) -> ArchiveList:
        """Return the list of monthly archive URLs for a player."""
        response = self._http.get(f"{_BASE_URL}/player/{player}/games/archives")
        response.raise_for_status()
        return ArchiveList.model_validate(response.json())

    def fetch_games(self, player: str, year: int, month: int) -> GamesArchive:
        """Fetch all games for a player in the given year/month."""
        response = self._http.get(f"{_BASE_URL}/player/{player}/games/{year}/{month:02d}")
        response.raise_for_status()
        return GamesArchive.model_validate(response.json())

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "ChessComClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
