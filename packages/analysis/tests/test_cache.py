"""Tests for the disk-backed evaluation cache."""

from pathlib import Path

from analysis.cache import EvalCache


def test_cache_miss_returns_none(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    assert cache.get("some fen", 18) is None


def test_cache_roundtrip(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    cache.put("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 18, 42)
    assert cache.get("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 18) == 42


def test_cache_depth_is_part_of_key(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    cache.put("fen1", 18, 42)
    # Same FEN but different depth → cache miss.
    assert cache.get("fen1", 12) is None


def test_cache_different_fens_are_independent(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    cache.put("fen_a", 18, 10)
    cache.put("fen_b", 18, 20)
    assert cache.get("fen_a", 18) == 10
    assert cache.get("fen_b", 18) == 20


def test_cache_handles_negative_scores(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    cache.put("losing_fen", 18, -300)
    assert cache.get("losing_fen", 18) == -300


def test_cache_creates_nested_directory(tmp_path: Path) -> None:
    cache_dir = tmp_path / "nested" / "evals"
    EvalCache(cache_dir)
    assert cache_dir.exists()


def test_cache_directory_property(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    assert cache.directory == tmp_path


def test_cache_overwrites_existing_entry(tmp_path: Path) -> None:
    cache = EvalCache(tmp_path)
    cache.put("fen1", 18, 10)
    cache.put("fen1", 18, 99)
    assert cache.get("fen1", 18) == 99
