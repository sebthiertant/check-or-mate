"""Endgame quality dimension scorer (split from dimensions.py for line-count)."""

import chess
import chess.pgn

from .models import GameResult


def endgame_quality_score(
    game: chess.pgn.Game,
    piece_count_threshold: int,
    result: GameResult,
) -> float:
    """Fraction of moves played in endgame (≤ piece_count_threshold pieces) × 100."""
    board = game.board()
    endgame_moves = 0
    total_moves = 0
    for move in game.mainline_moves():
        board.push(move)
        total_moves += 1
        if _is_endgame(board, piece_count_threshold):
            endgame_moves += 1
    if total_moves == 0 or endgame_moves == 0:
        return 0.0
    multiplier = 1.0 if result != GameResult.DRAW else 0.7
    return (endgame_moves / total_moves) * multiplier * 100.0


def _is_endgame(board: chess.Board, threshold: int) -> bool:
    """Return True if the total piece count (both sides) is ≤ threshold."""
    piece_count = sum(
        len(board.pieces(piece_type, color))
        for piece_type in chess.PIECE_TYPES
        for color in (chess.WHITE, chess.BLACK)
    )
    return piece_count <= threshold
