"""Top-level scoring orchestrator."""

from .config import ScoringConfig
from .dimensions import compute_partial_scores
from .engine import extract_fens
from .evaluator import Evaluator
from .models import GameRecord, NormalizedScores
from .normalizer import build_raw_scores, normalize_corpus


class Scorer:
    def __init__(
        self,
        config: ScoringConfig,
        evaluator: Evaluator | None = None,
    ) -> None:
        self._config = config
        self._evaluator = evaluator

    def score_corpus(self, records: list[GameRecord]) -> list[NormalizedScores]:
        """Score a list of games; returns one NormalizedScores per game, in order."""
        evals_per_game = self._get_evals(records)
        partial_scores = [
            compute_partial_scores(record, self._config.thresholds, evals)
            for record, evals in zip(records, evals_per_game)
        ]
        eco_codes = [record.eco for record in records]
        raw_scores = build_raw_scores(partial_scores, eco_codes)
        return normalize_corpus(raw_scores, self._config)

    def _get_evals(self, records: list[GameRecord]) -> list[list[int] | None]:
        """Return engine evaluations per game, or None for each if no evaluator."""
        if self._evaluator is None:
            return [None] * len(records)
        fens_per_game = [extract_fens(record.pgn) for record in records]
        result: list[list[int] | None] = list(self._evaluator.evaluate_corpus(fens_per_game))
        return result
