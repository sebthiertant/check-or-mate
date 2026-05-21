"""Corpus-based normalisation to [0, 100]."""

import dataclasses
from collections import Counter

from .config import ScoringConfig, ScoringWeights
from .models import NormalizedScores, PartialRawScores, RawScores

_DIMENSIONS = (
    "sacrifice",
    "eval_swing",
    "brilliancy",
    "time_pressure",
    "endgame_quality",
    "rating_upset",
    "opening_rarity",
)


def build_raw_scores(
    partial_scores: list[PartialRawScores],
    eco_codes: list[str],
) -> list[RawScores]:
    """Attach corpus-derived opening_rarity to each partial score.

    Rarity = max_eco_count / this_eco_count  →  rarer ECO = higher raw value.
    """
    eco_counts: Counter[str] = Counter(eco_codes)
    max_count = max(eco_counts.values()) if eco_counts else 1

    raw_scores = []
    for partial, eco in zip(partial_scores, eco_codes):
        opening_rarity = max_count / eco_counts[eco]
        raw_scores.append(
            RawScores(
                sacrifice=partial.sacrifice,
                eval_swing=partial.eval_swing,
                brilliancy=partial.brilliancy,
                time_pressure=partial.time_pressure,
                endgame_quality=partial.endgame_quality,
                rating_upset=partial.rating_upset,
                opening_rarity=opening_rarity,
            )
        )
    return raw_scores


def normalize_corpus(
    raw_scores: list[RawScores],
    config: ScoringConfig,
) -> list[NormalizedScores]:
    """Min-max normalise all dimensions, then rescale overall to [0, 100]."""
    if not raw_scores:
        return []

    ranges = _compute_ranges(raw_scores)
    results = [_normalize_one(raw, ranges, config.weights) for raw in raw_scores]
    return _rescale_overall(results)


def _rescale_overall(results: list[NormalizedScores]) -> list[NormalizedScores]:
    """Rescale the weighted overall so the top game in the corpus shows 100."""
    overall_min = min(r.overall for r in results)
    overall_max = max(r.overall for r in results)
    if overall_max == overall_min:
        return results
    return [
        dataclasses.replace(
            r,
            overall=round((r.overall - overall_min) / (overall_max - overall_min) * 100),
        )
        for r in results
    ]


def _compute_ranges(raw_scores: list[RawScores]) -> dict[str, tuple[float, float]]:
    ranges: dict[str, tuple[float, float]] = {}
    for dim in _DIMENSIONS:
        values = [getattr(score, dim) for score in raw_scores]
        ranges[dim] = (min(values), max(values))
    return ranges


def _normalize_one(
    raw: RawScores,
    ranges: dict[str, tuple[float, float]],
    weights: ScoringWeights,
) -> NormalizedScores:
    normalized = {dim: _clamp(getattr(raw, dim), *ranges[dim]) for dim in _DIMENSIONS}
    return NormalizedScores(
        sacrifice=normalized["sacrifice"],
        eval_swing=normalized["eval_swing"],
        brilliancy=normalized["brilliancy"],
        time_pressure=normalized["time_pressure"],
        endgame_quality=normalized["endgame_quality"],
        rating_upset=normalized["rating_upset"],
        opening_rarity=normalized["opening_rarity"],
        overall=_overall(normalized, weights),
    )


def _clamp(value: float, min_val: float, max_val: float) -> int:
    """Normalise a single value to [0, 100]. Returns 50 when all values are equal."""
    if max_val == min_val:
        return 50
    ratio = (value - min_val) / (max_val - min_val)
    return round(max(0.0, min(100.0, ratio * 100.0)))


def _overall(normalized: dict[str, int], weights: ScoringWeights) -> int:
    """Weighted average across all seven dimensions."""
    dimension_weights = {
        "sacrifice": weights.sacrifice,
        "eval_swing": weights.eval_swing,
        "brilliancy": weights.brilliancy,
        "time_pressure": weights.time_pressure,
        "endgame_quality": weights.endgame_quality,
        "rating_upset": weights.rating_upset,
        "opening_rarity": weights.opening_rarity,
    }
    total_weight = sum(dimension_weights.values())
    if total_weight == 0:
        return 0
    weighted_sum = sum(normalized[dim] * weight for dim, weight in dimension_weights.items())
    return round(weighted_sum / total_weight)
