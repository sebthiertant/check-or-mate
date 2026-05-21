"""Command-line interface for the ingestion pipeline."""

import argparse
from pathlib import Path

import yaml

from .client import ChessComClient
from .store import Store
from .sync import Syncer


def main() -> None:
    args = _build_argument_parser().parse_args()
    if args.command == "sync-all":
        _run_sync_all(watchlist_path=Path(args.watchlist), db_path=Path(args.db))
    else:
        _run_sync(player=args.player, db_path=Path(args.db))


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="ingest",
        description="check-or-mate — sync Chess.com games to a local SQLite database",
    )
    subcommands = parser.add_subparsers(dest="command", required=True)

    sync_cmd = subcommands.add_parser("sync", help="Sync games for a single player")
    sync_cmd.add_argument("--player", required=True, help="Chess.com username")
    sync_cmd.add_argument("--db", default="data/games.db", help="Path to the SQLite database")

    sync_all_cmd = subcommands.add_parser(
        "sync-all", help="Sync games for all players in the watchlist"
    )
    sync_all_cmd.add_argument(
        "--watchlist", default="data/watchlist.yml", help="Path to watchlist.yml"
    )
    sync_all_cmd.add_argument("--db", default="data/games.db", help="Path to the SQLite database")

    return parser


def _run_sync(player: str, db_path: Path) -> None:
    with ChessComClient() as client, Store.open(db_path) as store:
        syncer = Syncer(client, store)
        new_games = syncer.sync_player(player)
        print(f"Synced {new_games} new game(s) for {player!r}.")


def _run_sync_all(watchlist_path: Path, db_path: Path) -> None:
    with watchlist_path.open() as file_handle:
        data = yaml.safe_load(file_handle)
    players: list[str] = data.get("players", [])
    for player in players:
        _run_sync(player=player, db_path=db_path)


if __name__ == "__main__":
    main()
