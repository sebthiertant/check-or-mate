"""Incremental sync orchestration."""

from .client import ChessComClient
from .models import RawGame
from .store import Store


class Syncer:
    def __init__(self, client: ChessComClient, store: Store) -> None:
        self._client = client
        self._store = store

    def sync_player(self, player: str) -> int:
        """Fetch and store all new archives for a player.

        Returns the number of newly ingested games (PGN-less games are skipped).
        """
        archive_list = self._client.list_archives(player)
        total = 0
        for archive_url in archive_list.archives:
            total += self._sync_archive(player, archive_url)
        return total

    def _sync_archive(self, player: str, archive_url: str) -> int:
        if self._store.is_archive_synced(player, archive_url):
            return 0
        year, month = _parse_archive_url(archive_url)
        archive = self._client.fetch_games(player, year, month)
        saved = _save_games_with_pgn(self._store, archive.games)
        self._store.mark_archive_synced(player, archive_url)
        self._store.commit()
        return saved


def _save_games_with_pgn(store: Store, games: list[RawGame]) -> int:
    """Save only games that have a PGN; return the count of saved games."""
    count = 0
    for game in games:
        if game.pgn:
            store.save_game(game)
            count += 1
    return count


def _parse_archive_url(url: str) -> tuple[int, int]:
    """Extract (year, month) from a Chess.com archive URL."""
    parts = url.rstrip("/").split("/")
    return int(parts[-2]), int(parts[-1])
