"""Top-level scoring orchestrator."""

from .config import ScoringConfig
from .dimensions import compute_partial_scores
from .models import GameRecord, NormalizedScores
from .normalizer import build_raw_scores, normalize_corpus


class Scorer:
    def __init__(self, config: ScoringConfig) -> None:
        self._config = config

    def score_corpus(self, records: list[GameRecord]) -> list[NormalizedScores]:
        """Score a list of games; returns one NormalizedScores per game, in order."""
        partial_scores = [
            compute_partial_scores(record, self._config.thresholds) for record in records
        ]
        eco_codes = [record.eco for record in records]
        raw_scores = build_raw_scores(partial_scores, eco_codes)
        return normalize_corpus(raw_scores, self._config)
