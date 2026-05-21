"""Corpus evaluator — parallel Stockfish evaluation over multiple games."""

import os
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass
from pathlib import Path

from .cache import EvalCache
from .engine import EngineConfig, StockfishEngine


@dataclass(frozen=True)
class _GameTask:
    fens: tuple[str, ...]
    engine_path: str
    cache_dir: Path
    depth: int


def _evaluate_game(task: _GameTask) -> list[int]:
    """Worker (module-level for pickling): evaluate all positions in one game.

    Uses the disk cache to avoid re-evaluating known positions.
    Spawns one Stockfish process for any uncached FENs.
    """
    cache = EvalCache(task.cache_dir)
    config = EngineConfig(path=task.engine_path, depth=task.depth)
    scores: list[int] = [0] * len(task.fens)
    uncached_indices: list[int] = []

    for index, fen in enumerate(task.fens):
        hit = cache.get(fen, task.depth)
        if hit is not None:
            scores[index] = hit
        else:
            uncached_indices.append(index)

    if not uncached_indices:
        return scores

    with StockfishEngine(config) as engine:
        for index in uncached_indices:
            fen = task.fens[index]
            score = engine.evaluate(fen)
            cache.put(fen, task.depth, score)
            scores[index] = score

    return scores


class Evaluator:
    """Evaluate game positions in parallel using a pool of Stockfish processes."""

    def __init__(self, config: EngineConfig, cache: EvalCache) -> None:
        self._config = config
        self._cache = cache

    def evaluate_corpus(
        self,
        fens_per_game: list[list[str]],
        workers: int | None = None,
    ) -> list[list[int]]:
        """Return cp evals (white POV) for every position in every game."""
        tasks = [
            _GameTask(
                fens=tuple(fens),
                engine_path=self._config.path,
                cache_dir=self._cache.directory,
                depth=self._config.depth,
            )
            for fens in fens_per_game
        ]
        max_workers = workers or os.cpu_count() or 1
        with ProcessPoolExecutor(max_workers=max_workers) as pool:
            return list(pool.map(_evaluate_game, tasks))
