"""Per-game heuristic dimension scorers."""

import io
import re

import chess
import chess.pgn

from .brilliancy import brilliancy_score, eval_swing_score
from .config import ScoringThresholds
from .endgame import endgame_quality_score
from .models import GameRecord, GameResult, PartialRawScores

_PIECE_VALUES: dict[chess.PieceType, int] = {
    chess.PAWN: 1,
    chess.KNIGHT: 3,
    chess.BISHOP: 3,
    chess.ROOK: 5,
    chess.QUEEN: 9,
}

_CLOCK_PATTERN: re.Pattern[str] = re.compile(r"\[%clk (\d+):(\d+):(\d+)\]")


def compute_partial_scores(
    record: GameRecord,
    thresholds: ScoringThresholds,
    evals: list[int] | None = None,
) -> PartialRawScores:
    """Compute per-game heuristic dimensions.

    opening_rarity is deferred to corpus level in the normaliser.
    Pass evals (cp from white's POV, one per half-move) to populate
    eval_swing and brilliancy; omit for a Stockfish-free run (both → 0).
    """
    game = chess.pgn.read_game(io.StringIO(record.pgn))
    if game is None:
        return PartialRawScores(
            sacrifice=0.0,
            eval_swing=0.0,
            brilliancy=0.0,
            time_pressure=0.0,
            endgame_quality=0.0,
            rating_upset=0.0,
        )
    return PartialRawScores(
        sacrifice=_sacrifice_score(game, record.result),
        eval_swing=eval_swing_score(evals) if evals is not None else 0.0,
        brilliancy=brilliancy_score(evals) if evals is not None else 0.0,
        time_pressure=_time_pressure_score(game, thresholds.time_pressure_window_seconds),
        endgame_quality=endgame_quality_score(game, thresholds.endgame_piece_count, record.result),
        rating_upset=_rating_upset_score(record),
    )


def _sacrifice_score(game: chess.pgn.Game, result: GameResult) -> float:
    """Maximum material given up by the non-losing side, in pawn units."""
    board = game.board()
    balances: list[int] = [_material_balance(board)]
    for move in game.mainline_moves():
        board.push(move)
        balances.append(_material_balance(board))
    return max(_white_sacrifice(balances, result), _black_sacrifice(balances, result))


def _material_balance(board: chess.Board) -> int:
    """White minus black material in pawn units."""
    total = 0
    for piece_type, value in _PIECE_VALUES.items():
        total += len(board.pieces(piece_type, chess.WHITE)) * value
        total -= len(board.pieces(piece_type, chess.BLACK)) * value
    return total


def _white_sacrifice(balances: list[int], result: GameResult) -> float:
    """Deepest material dip by white. Returns 0 if white lost."""
    if result == GameResult.BLACK_WINS:
        return 0.0
    peak = balances[0]
    max_dip = 0
    for balance in balances:
        peak = max(peak, balance)
        max_dip = max(max_dip, peak - balance)
    return float(max_dip)


def _black_sacrifice(balances: list[int], result: GameResult) -> float:
    """Deepest material dip by black. Returns 0 if black lost."""
    if result == GameResult.WHITE_WINS:
        return 0.0
    valley = balances[0]
    max_dip = 0
    for balance in balances:
        valley = min(valley, balance)
        max_dip = max(max_dip, balance - valley)
    return float(max_dip)


def _time_pressure_score(game: chess.pgn.Game, threshold_seconds: int) -> float:
    """Count of moves played with fewer than threshold_seconds on the clock."""
    count = 0
    node: chess.pgn.GameNode = game
    while node.variations:
        node = node.variations[0]
        clock = _parse_clock_seconds(node.comment)
        if clock is not None and clock < threshold_seconds:
            count += 1
    return float(count)


def _parse_clock_seconds(comment: str) -> int | None:
    """Extract clock time in seconds from a PGN move comment, or None."""
    match = _CLOCK_PATTERN.search(comment)
    if match is None:
        return None
    hours = int(match.group(1))
    minutes = int(match.group(2))
    seconds = int(match.group(3))
    return hours * 3600 + minutes * 60 + seconds


def _rating_upset_score(record: GameRecord) -> float:
    """Elo gap in favour of the loser (or half-gap for draws)."""
    if record.result == GameResult.WHITE_WINS:
        return float(max(0, record.black_rating - record.white_rating))
    if record.result == GameResult.BLACK_WINS:
        return float(max(0, record.white_rating - record.black_rating))
    return abs(record.white_rating - record.black_rating) * 0.5
