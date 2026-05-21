"""Incremental sync orchestration."""

from .client import ChessComClient
from .store import Store


class Syncer:
    def __init__(self, client: ChessComClient, store: Store) -> None:
        self._client = client
        self._store = store

    def sync_player(self, player: str) -> int:
        """Fetch and store all new archives for a player.

        Returns the number of newly ingested games.
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
        for game in archive.games:
            self._store.save_game(game)
        self._store.mark_archive_synced(player, archive_url)
        self._store.commit()
        return len(archive.games)


def _parse_archive_url(url: str) -> tuple[int, int]:
    """Extract (year, month) from a Chess.com archive URL."""
    parts = url.rstrip("/").split("/")
    return int(parts[-2]), int(parts[-1])
