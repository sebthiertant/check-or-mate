"""Tests for the corpus evaluator."""

import os
from pathlib import Path

import pytest
from analysis.cache import EvalCache
from analysis.engine import EngineConfig, extract_fens
from analysis.evaluator import Evaluator, _evaluate_game, _GameTask

# ── _evaluate_game (unit — no Stockfish needed when cache is warm) ────────────


def test_evaluate_game_returns_cached_scores(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    cache.put("fen1", 18, 42)
    cache.put("fen2", 18, -15)

    task = _GameTask(
        fens=("fen1", "fen2"),
        engine_path="/fake/stockfish",
        cache_dir=tmp_path,
        depth=18,
    )
    result = _evaluate_game(task)
    assert result == [42, -15]


def test_evaluate_game_returns_correct_length(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    for index in range(5):
        cache.put(f"fen{index}", 18, index * 10)

    task = _GameTask(
        fens=tuple(f"fen{index}" for index in range(5)),
        engine_path="/fake/stockfish",
        cache_dir=tmp_path,
        depth=18,
    )
    result = _evaluate_game(task)
    assert len(result) == 5


def test_evaluate_game_handles_empty_fens(tmp_path: Path) -> None:
    task = _GameTask(fens=(), engine_path="/fake/stockfish", cache_dir=tmp_path, depth=18)
    assert _evaluate_game(task) == []


# ── Evaluator.evaluate_corpus (integration) ──────────────────────────────────

_stockfish_path = os.environ.get("STOCKFISH_PATH", "")
requires_stockfish = pytest.mark.skipif(
    not _stockfish_path,
    reason="Set STOCKFISH_PATH to run Stockfish integration tests",
)

_PGN_SIMPLE = "[Event 'T'][White 'A'][Black 'B'][Result '1-0']\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0"


@requires_stockfish
def test_evaluator_corpus_returns_one_list_per_game(tmp_path: Path) -> None:
    config = EngineConfig(path=_stockfish_path, depth=5)
    evaluator = Evaluator(config, EvalCache(tmp_path))
    fens = extract_fens(_PGN_SIMPLE)
    results = evaluator.evaluate_corpus([fens], workers=1)
    assert len(results) == 1
    assert len(results[0]) == len(fens)


@requires_stockfish
def test_evaluator_scores_are_centipawn_range(tmp_path: Path) -> None:
    config = EngineConfig(path=_stockfish_path, depth=5)
    evaluator = Evaluator(config, EvalCache(tmp_path))
    fens = extract_fens(_PGN_SIMPLE)
    results = evaluator.evaluate_corpus([fens], workers=1)
    for score in results[0]:
        assert -10_000 < score < 10_000


@requires_stockfish
def test_evaluator_uses_cache_on_second_run(tmp_path: Path) -> None:
    config = EngineConfig(path=_stockfish_path, depth=5)
    cache = EvalCache(tmp_path)
    evaluator = Evaluator(config, cache)
    fens = extract_fens(_PGN_SIMPLE)
    first = evaluator.evaluate_corpus([fens], workers=1)
    second = evaluator.evaluate_corpus([fens], workers=1)
    assert first == second
