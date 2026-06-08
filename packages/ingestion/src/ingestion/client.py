"""HTTP client for the Chess.com Public API."""

import httpx

from .models import ArchiveList, GamesArchive, Leaderboard

_BASE_URL = "https://api.chess.com/pub"
_DEFAULT_HEADERS = {"User-Agent": "check-or-mate/0.1 (github.com/sebthiertant/check-or-mate)"}


class ChessComClient:
    def __init__(self, http_client: httpx.Client | None = None) -> None:
        # REVERT AFTER DEMO — remove verify=False after demo
        self._http = http_client or httpx.Client(
            headers=_DEFAULT_HEADERS, timeout=30.0, verify=False
        )

    def list_archives(self, player: str) -> ArchiveList:
        """Return the list of monthly archive URLs for a player.

        Returns an empty list for unknown or deactivated accounts (404).
        """
        response = self._http.get(f"{_BASE_URL}/player/{player}/games/archives")
        if response.status_code == 404:
            return ArchiveList(archives=[])
        response.raise_for_status()
        return ArchiveList.model_validate(response.json())

    def fetch_games(self, player: str, year: int, month: int) -> GamesArchive:
        """Fetch all games for a player in the given year/month.

        Returns an empty archive for months with no games or not yet available (404).
        """
        response = self._http.get(f"{_BASE_URL}/player/{player}/games/{year}/{month:02d}")
        if response.status_code == 404:
            return GamesArchive(games=[])
        response.raise_for_status()
        return GamesArchive.model_validate(response.json())

    def fetch_leaderboard(self) -> Leaderboard:
        """Return the top-50 players for each live time control."""
        response = self._http.get(f"{_BASE_URL}/leaderboards")
        response.raise_for_status()
        return Leaderboard.model_validate(response.json())

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "ChessComClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()
