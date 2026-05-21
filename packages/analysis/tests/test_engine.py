"""Tests for the Stockfish engine driver and FEN extraction."""

import os

import pytest
from analysis.engine import EngineConfig, StockfishEngine, _parse_score, extract_fens

# ── _parse_score ──────────────────────────────────────────────────────────────


def test_parse_score_returns_cp_value() -> None:
    line = "info depth 18 seldepth 25 multipv 1 score cp 42 nodes 12345"
    assert _parse_score(line) == 42


def test_parse_score_handles_negative_cp() -> None:
    assert _parse_score("info depth 10 score cp -150 nodes 100") == -150


def test_parse_score_returns_positive_mate_score() -> None:
    assert _parse_score("info depth 5 score mate 3") == 30_000


def test_parse_score_returns_negative_mate_score() -> None:
    assert _parse_score("info depth 5 score mate -2") == -30_000


def test_parse_score_returns_zero_for_line_without_score() -> None:
    assert _parse_score("info depth 18 nodes 12345 nps 500000") == 0


def test_parse_score_returns_zero_for_empty_line() -> None:
    assert _parse_score("") == 0


# ── extract_fens ──────────────────────────────────────────────────────────────


def test_extract_fens_returns_one_fen_per_half_move() -> None:
    pgn = "[Event 'T'][White 'A'][Black 'B'][Result '1/2-1/2']\n\n1. e4 e5 1/2-1/2"
    fens = extract_fens(pgn)
    assert len(fens) == 2


def test_extract_fens_returns_empty_for_invalid_pgn() -> None:
    assert extract_fens("") == []


def test_extract_fens_first_fen_reflects_first_move() -> None:
    pgn = "[Event 'T'][White 'A'][Black 'B'][Result '*']\n\n1. e4 *"
    fens = extract_fens(pgn)
    assert len(fens) == 1
    # After 1.e4, the e-pawn should be on e4 — the FEN starts from black's turn.
    assert " b " in fens[0]


# ── StockfishEngine (integration) ────────────────────────────────────────────

_stockfish_path = os.environ.get("STOCKFISH_PATH", "")
requires_stockfish = pytest.mark.skipif(
    not _stockfish_path,
    reason="Set STOCKFISH_PATH to run Stockfish integration tests",
)


@requires_stockfish
def test_engine_evaluates_starting_position() -> None:
    fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    with StockfishEngine(EngineConfig(path=_stockfish_path, depth=10)) as engine:
        score = engine.evaluate(fen)
    assert abs(score) < 50  # starting position is nearly equal


@requires_stockfish
def test_engine_detects_winning_position() -> None:
    # White queen vs bare king — clearly winning for white.
    fen = "7k/8/6Q1/8/8/8/8/4K3 w - - 0 1"
    with StockfishEngine(EngineConfig(path=_stockfish_path, depth=10)) as engine:
        score = engine.evaluate(fen)
    assert score > 500  # large positive score (white winning)


@requires_stockfish
def test_engine_is_deterministic() -> None:
    fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    with StockfishEngine(EngineConfig(path=_stockfish_path, depth=10)) as engine:
        score1 = engine.evaluate(fen)
        score2 = engine.evaluate(fen)
    assert score1 == score2
