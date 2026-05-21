"""Tests for per-game heuristic dimension scorers."""

import pytest
from analysis.config import ScoringThresholds
from analysis.dimensions import (
    _black_sacrifice,
    _parse_clock_seconds,
    _white_sacrifice,
    compute_partial_scores,
)
from analysis.models import GameRecord, GameResult

_DEFAULT_THRESHOLDS = ScoringThresholds(
    time_pressure_window_seconds=10,
    endgame_piece_count=6,
    rating_upset_max_delta=300,
)


# ── _parse_clock_seconds ──────────────────────────────────────────────────────


def test_parse_clock_returns_seconds_for_valid_comment() -> None:
    assert _parse_clock_seconds("[%clk 0:00:05]") == 5


def test_parse_clock_handles_hours_and_minutes() -> None:
    assert _parse_clock_seconds("text [%clk 1:30:00] more text") == 5400


def test_parse_clock_returns_none_when_absent() -> None:
    assert _parse_clock_seconds("no clock here") is None


def test_parse_clock_returns_none_for_empty_string() -> None:
    assert _parse_clock_seconds("") is None


# ── _white_sacrifice / _black_sacrifice ───────────────────────────────────────


def test_white_sacrifice_returns_max_dip_when_white_wins() -> None:
    # White gives a knight (-3) and recovers to 0.
    balances = [0, -3, -3, 0]
    assert _white_sacrifice(balances, GameResult.WHITE_WINS) == 3.0


def test_white_sacrifice_returns_zero_when_white_loses() -> None:
    balances = [0, -3, -3]
    assert _white_sacrifice(balances, GameResult.BLACK_WINS) == 0.0


def test_white_sacrifice_returns_zero_for_flat_balance() -> None:
    balances = [0, 0, 0]
    assert _white_sacrifice(balances, GameResult.WHITE_WINS) == 0.0


def test_black_sacrifice_returns_max_dip_when_black_wins() -> None:
    # Black gives a rook (+5 to white), then wins back material.
    balances = [0, 5, 5, 1]
    assert _black_sacrifice(balances, GameResult.BLACK_WINS) == 5.0


def test_black_sacrifice_returns_zero_when_black_loses() -> None:
    balances = [0, 5, 5]
    assert _black_sacrifice(balances, GameResult.WHITE_WINS) == 0.0


def test_black_sacrifice_returns_zero_for_flat_balance() -> None:
    balances = [0, 0, 0]
    assert _black_sacrifice(balances, GameResult.BLACK_WINS) == 0.0


# ── compute_partial_scores — sacrifice ────────────────────────────────────────


def test_sacrifice_is_nonzero_for_opera_game(opera_game_record: GameRecord) -> None:
    scores = compute_partial_scores(opera_game_record, _DEFAULT_THRESHOLDS)
    # Morphy sacrifices both rooks — sacrifice should be > 0.
    assert scores.sacrifice > 0


def test_sacrifice_is_zero_for_equal_draw(equal_game_record: GameRecord) -> None:
    scores = compute_partial_scores(equal_game_record, _DEFAULT_THRESHOLDS)
    assert scores.sacrifice == 0.0


# ── compute_partial_scores — eval_swing ───────────────────────────────────────


def test_eval_swing_is_zero_placeholder(equal_game_record: GameRecord) -> None:
    scores = compute_partial_scores(equal_game_record, _DEFAULT_THRESHOLDS)
    assert scores.eval_swing == 0.0


# ── compute_partial_scores — time pressure ────────────────────────────────────


def test_time_pressure_counts_moves_under_threshold(clocked_game_record: GameRecord) -> None:
    scores = compute_partial_scores(clocked_game_record, _DEFAULT_THRESHOLDS)
    # Moves 1w (5s) and 1b (9s) are below 10s threshold; 2w (11s) and 2b (15s) are not.
    assert scores.time_pressure == 2.0


def test_time_pressure_is_zero_without_clock_annotations(equal_game_record: GameRecord) -> None:
    scores = compute_partial_scores(equal_game_record, _DEFAULT_THRESHOLDS)
    assert scores.time_pressure == 0.0


def test_time_pressure_threshold_is_exclusive(clocked_game_record: GameRecord) -> None:
    # Raise threshold to 12s — now move 2w (11s) also qualifies.
    thresholds = ScoringThresholds(
        time_pressure_window_seconds=12,
        endgame_piece_count=6,
        rating_upset_max_delta=300,
    )
    scores = compute_partial_scores(clocked_game_record, thresholds)
    assert scores.time_pressure == 3.0


# ── compute_partial_scores — endgame quality ─────────────────────────────────


def test_endgame_quality_is_zero_for_short_opening_game(equal_game_record: GameRecord) -> None:
    # 3-move game stays in opening; no position has ≤ 6 pieces.
    scores = compute_partial_scores(equal_game_record, _DEFAULT_THRESHOLDS)
    assert scores.endgame_quality == 0.0


def test_endgame_quality_is_zero_for_opera_game(opera_game_record: GameRecord) -> None:
    # The Opera Game ends by middlegame checkmate; no position has ≤ 6 pieces.
    scores = compute_partial_scores(opera_game_record, _DEFAULT_THRESHOLDS)
    assert scores.endgame_quality == 0.0


# PGN starting from a KQ vs K endgame position — all moves qualify (3 pieces ≤ 6).
_PGN_KQ_VS_K = """\
[Event "Endgame Test"]
[White "A"]
[Black "B"]
[Result "1-0"]
[ECO "A00"]
[FEN "7k/8/6Q1/8/8/8/8/4K3 w - - 0 1"]
[SetUp "1"]

1. Qg7 Kh7 2. Kf2 Kh8 3. Kg3 Kh7 4. Kh4 Kh8 5. Kh5 Kh7 6. Qg6+ Kh8 7. Qg7# 1-0
"""


def test_endgame_quality_is_nonzero_for_pure_endgame() -> None:
    record = GameRecord(
        game_id="kq-endgame",
        pgn=_PGN_KQ_VS_K,
        white_rating=2000,
        black_rating=2000,
        result=GameResult.WHITE_WINS,
        eco="A00",
    )
    scores = compute_partial_scores(record, _DEFAULT_THRESHOLDS)
    assert scores.endgame_quality > 0.0


# ── compute_partial_scores — rating upset ─────────────────────────────────────


def test_rating_upset_is_zero_when_favourite_wins(opera_game_record: GameRecord) -> None:
    # Morphy (2700) beats 1500-rated opponent — not an upset.
    scores = compute_partial_scores(opera_game_record, _DEFAULT_THRESHOLDS)
    assert scores.rating_upset == 0.0


def test_rating_upset_is_nonzero_when_underdog_wins(clocked_game_record: GameRecord) -> None:
    # White (1800) beats Black (2100) → upset of 300.
    scores = compute_partial_scores(clocked_game_record, _DEFAULT_THRESHOLDS)
    assert scores.rating_upset == 300.0


def test_rating_upset_draws_return_half_gap() -> None:
    record = GameRecord(
        game_id="draw-1",
        pgn="[Event 'T'][White 'A'][Black 'B'][Result '1/2-1/2']\n\n1/2-1/2",
        white_rating=2000,
        black_rating=2200,
        result=GameResult.DRAW,
        eco="A00",
    )
    scores = compute_partial_scores(record, _DEFAULT_THRESHOLDS)
    assert scores.rating_upset == pytest.approx(100.0)


# ── invalid PGN ───────────────────────────────────────────────────────────────


def test_all_scores_are_zero_for_empty_pgn() -> None:
    record = GameRecord(
        game_id="empty",
        pgn="",
        white_rating=2000,
        black_rating=2000,
        result=GameResult.DRAW,
        eco="A00",
    )
    scores = compute_partial_scores(record, _DEFAULT_THRESHOLDS)
    assert scores.sacrifice == 0.0
    assert scores.time_pressure == 0.0
    assert scores.endgame_quality == 0.0
    assert scores.rating_upset == 0.0
