"""Command-line interface for the ingestion pipeline."""

import argparse
from pathlib import Path

from .client import ChessComClient
from .store import Store
from .sync import Syncer


def main() -> None:
    args = _build_argument_parser().parse_args()
    _run_sync(player=args.player, db_path=Path(args.db))


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ingest",
        description="check-or-mate — sync Chess.com games to a local SQLite database",
    )
    subcommands = parser.add_subparsers(dest="command", required=True)

    sync_cmd = subcommands.add_parser("sync", help="Sync games for a player")
    sync_cmd.add_argument("--player", required=True, help="Chess.com username")
    sync_cmd.add_argument("--db", default="data/games.db", help="Path to the SQLite database")

    return parser


def _run_sync(player: str, db_path: Path) -> None:
    with ChessComClient() as client, Store.open(db_path) as store:
        syncer = Syncer(client, store)
        new_games = syncer.sync_player(player)
        print(f"Synced {new_games} new game(s) for {player!r}.")


if __name__ == "__main__":
    main()
