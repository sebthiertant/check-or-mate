"""CLI: python -m analysis score --since YYYY-MM-DD --db data/games.db"""

import argparse
import dataclasses
import io
import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

import chess.pgn

from .cache import EvalCache
from .config import load_config
from .engine import EngineConfig
from .evaluator import Evaluator
from .models import GameRecord, GameResult, NormalizedScores
from .scorer import Scorer


def main() -> None:
    args = _build_argument_parser().parse_args()
    _run_score(
        db_path=Path(args.db),
        since=args.since,
        config_path=Path(args.config) if args.config else None,
        engine_path=args.engine_path,
        output_path=Path(args.output) if args.output else None,
    )


def _build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="analysis",
        description="check-or-mate — score Chess.com games from the local SQLite database",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    score_cmd = sub.add_parser("score", help="Compute heuristic scores for all games")
    score_cmd.add_argument(
        "--since", default="2000-01-01", help="Include games from this date (YYYY-MM-DD)"
    )
    score_cmd.add_argument("--db", default="data/games.db", help="Path to the SQLite database")
    score_cmd.add_argument("--config", default=None, help="Path to an alternative config.yml")
    score_cmd.add_argument("--engine-path", default=None, help="Path to Stockfish binary")
    score_cmd.add_argument("--output", default=None, help="Write JSON scores to this file")
    return parser


def _run_score(
    db_path: Path,
    since: str,
    config_path: Path | None = None,
    engine_path: str | None = None,
    output_path: Path | None = None,
) -> None:
    config = load_config(config_path)
    records = _load_game_records(db_path, since)

    if not records:
        print(f"No games found in {db_path} since {since}.")
        return

    evaluator = _build_evaluator(engine_path) if engine_path else None
    scorer = Scorer(config, evaluator)
    scores = scorer.score_corpus(records)

    _print_header()
    for record, normalized in zip(records, scores):
        print(
            f"{record.game_id:<40s}  "
            f"overall={normalized.overall:3d}  "
            f"sac={normalized.sacrifice:3d}  "
            f"tp={normalized.time_pressure:3d}  "
            f"eq={normalized.endgame_quality:3d}  "
            f"ru={normalized.rating_upset:3d}  "
            f"or={normalized.opening_rarity:3d}"
        )
    print(f"\n{len(records)} game(s) scored.")
    if output_path:
        _write_json(output_path, records, scores)


def _build_evaluator(engine_path: str) -> Evaluator:
    config = EngineConfig(path=engine_path)
    cache = EvalCache(Path("data/eval_cache"))
    return Evaluator(config, cache)


def _write_json(
    output_path: Path, records: list[GameRecord], scores: list[NormalizedScores]
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    data = [{"game_id": r.game_id, **dataclasses.asdict(s)} for r, s in zip(records, scores)]
    output_path.write_text(json.dumps(data, indent=2))
    print(f"Scores written to {output_path}.")


def _print_header() -> None:
    print(
        f"{'game_id':<40s}  "
        f"{'overall':>7s}  {'sac':>3s}  {'tp':>3s}  {'eq':>3s}  {'ru':>3s}  {'or':>3s}"
    )
    print("-" * 78)


def _load_game_records(db_path: Path, since: str) -> list[GameRecord]:
    since_timestamp = _iso_date_to_unix(since)
    connection = sqlite3.connect(db_path)
    rows = connection.execute(
        "SELECT game_id, pgn, white_rating, black_rating FROM games WHERE end_time >= ?",
        (since_timestamp,),
    ).fetchall()
    connection.close()

    records = []
    for game_id, pgn, white_rating, black_rating in rows:
        record = _build_game_record(game_id, pgn, white_rating, black_rating)
        if record is not None:
            records.append(record)
    return records


def _build_game_record(
    game_id: str, pgn: str, white_rating: int, black_rating: int
) -> GameRecord | None:
    game = chess.pgn.read_game(io.StringIO(pgn))
    if game is None:
        return None
    result_str = game.headers.get("Result", "")
    try:
        result = GameResult(result_str)
    except ValueError:
        return None
    eco = game.headers.get("ECO", "")
    return GameRecord(
        game_id=game_id,
        pgn=pgn,
        white_rating=white_rating,
        black_rating=black_rating,
        result=result,
        eco=eco,
    )


def _iso_date_to_unix(date_string: str) -> int:
    """Convert an ISO date string (YYYY-MM-DD) to a UTC Unix timestamp."""
    year, month, day = (int(part) for part in date_string.split("-"))
    return int(datetime(year, month, day, tzinfo=UTC).timestamp())
