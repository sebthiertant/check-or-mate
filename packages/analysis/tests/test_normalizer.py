"""Tests for corpus normalisation."""

from analysis.config import ScoringConfig, ScoringThresholds, ScoringWeights
from analysis.models import PartialRawScores, RawScores
from analysis.normalizer import _clamp, build_raw_scores, normalize_corpus

_UNIFORM_WEIGHTS = ScoringWeights(
    sacrifice=0.25,
    eval_swing=0.0,
    brilliancy=0.0,
    time_pressure=0.20,
    endgame_quality=0.20,
    rating_upset=0.20,
    opening_rarity=0.15,
)
_UNIFORM_THRESHOLDS = ScoringThresholds(
    time_pressure_window_seconds=10,
    endgame_piece_count=6,
    rating_upset_max_delta=300,
)
_CONFIG = ScoringConfig(weights=_UNIFORM_WEIGHTS, thresholds=_UNIFORM_THRESHOLDS)


def _raw(
    sacrifice: float = 0,
    eval_swing: float = 0,
    brilliancy: float = 0,
    time_pressure: float = 0,
    endgame_quality: float = 0,
    rating_upset: float = 0,
    opening_rarity: float = 1.0,
) -> RawScores:
    return RawScores(
        sacrifice=sacrifice,
        eval_swing=eval_swing,
        brilliancy=brilliancy,
        time_pressure=time_pressure,
        endgame_quality=endgame_quality,
        rating_upset=rating_upset,
        opening_rarity=opening_rarity,
    )


def _partial(
    sacrifice: float = 0,
    eval_swing: float = 0,
    brilliancy: float = 0,
    time_pressure: float = 0,
    endgame_quality: float = 0,
    rating_upset: float = 0,
) -> PartialRawScores:
    return PartialRawScores(
        sacrifice=sacrifice,
        eval_swing=eval_swing,
        brilliancy=brilliancy,
        time_pressure=time_pressure,
        endgame_quality=endgame_quality,
        rating_upset=rating_upset,
    )


# ── _clamp ────────────────────────────────────────────────────────────────────


def test_clamp_returns_50_when_all_values_equal() -> None:
    assert _clamp(5.0, 5.0, 5.0) == 50


def test_clamp_maps_min_to_zero() -> None:
    assert _clamp(0.0, 0.0, 10.0) == 0


def test_clamp_maps_max_to_100() -> None:
    assert _clamp(10.0, 0.0, 10.0) == 100


def test_clamp_maps_midpoint_to_50() -> None:
    assert _clamp(5.0, 0.0, 10.0) == 50


def test_clamp_enforces_lower_bound() -> None:
    assert _clamp(-5.0, 0.0, 10.0) == 0


def test_clamp_enforces_upper_bound() -> None:
    assert _clamp(15.0, 0.0, 10.0) == 100


# ── build_raw_scores ──────────────────────────────────────────────────────────


def test_build_raw_scores_assigns_opening_rarity() -> None:
    # "B90" appears twice, "C65" once → C65 is rarer.
    partials = [_partial(), _partial(), _partial()]
    eco_codes = ["B90", "B90", "C65"]

    raw = build_raw_scores(partials, eco_codes)

    assert raw[0].opening_rarity == raw[1].opening_rarity  # same ECO, same rarity
    assert raw[2].opening_rarity > raw[0].opening_rarity  # C65 rarer than B90


def test_build_raw_scores_single_eco_has_rarity_one() -> None:
    partials = [_partial()]
    raw = build_raw_scores(partials, ["D37"])
    assert raw[0].opening_rarity == 1.0


def test_build_raw_scores_preserves_other_dimensions() -> None:
    partials = [_partial(sacrifice=3.0, rating_upset=200.0)]
    raw = build_raw_scores(partials, ["E15"])
    assert raw[0].sacrifice == 3.0
    assert raw[0].rating_upset == 200.0


# ── normalize_corpus ──────────────────────────────────────────────────────────


def test_normalize_corpus_returns_empty_for_empty_input() -> None:
    assert normalize_corpus([], _CONFIG) == []


def test_normalize_corpus_returns_same_count_as_input() -> None:
    raw = [_raw(sacrifice=3.0), _raw(sacrifice=0.0)]
    result = normalize_corpus(raw, _CONFIG)
    assert len(result) == 2


def test_normalize_corpus_min_maps_to_zero_max_to_100() -> None:
    raw = [_raw(sacrifice=0.0), _raw(sacrifice=9.0)]
    result = normalize_corpus(raw, _CONFIG)
    assert result[0].sacrifice == 0
    assert result[1].sacrifice == 100


def test_normalize_corpus_single_game_returns_50_for_all_dimensions() -> None:
    raw = [_raw(sacrifice=5.0, rating_upset=100.0)]
    result = normalize_corpus(raw, _CONFIG)
    assert result[0].sacrifice == 50
    assert result[0].rating_upset == 50


def test_normalize_corpus_all_dimensions_in_bounds() -> None:
    raw = [
        _raw(sacrifice=0.0, time_pressure=3.0, rating_upset=0.0),
        _raw(sacrifice=5.0, time_pressure=0.0, rating_upset=150.0),
        _raw(sacrifice=9.0, time_pressure=10.0, rating_upset=300.0),
    ]
    result = normalize_corpus(raw, _CONFIG)
    for scores in result:
        for dim in (
            "sacrifice",
            "eval_swing",
            "brilliancy",
            "time_pressure",
            "endgame_quality",
            "rating_upset",
            "opening_rarity",
            "overall",
        ):
            value = getattr(scores, dim)
            assert 0 <= value <= 100, f"{dim}={value} out of [0, 100]"


def test_normalize_corpus_overall_uses_active_weights_only() -> None:
    # With only sacrifice varying, overall should reflect it.
    raw = [_raw(sacrifice=0.0), _raw(sacrifice=9.0)]
    result = normalize_corpus(raw, _CONFIG)
    assert result[1].overall > result[0].overall


def test_normalize_corpus_overall_top_game_scores_100() -> None:
    # After corpus rescaling the best game reaches 100 overall.
    raw = [_raw(sacrifice=0.0), _raw(sacrifice=9.0)]
    result = normalize_corpus(raw, _CONFIG)
    assert result[1].overall == 100


def test_normalize_corpus_rarity_most_common_maps_to_zero() -> None:
    # "B90" appears 3 times (rarity=1), "C65" appears once (rarity=3).
    # After normalization B90 → 0, C65 → 100.
    raw = [
        _raw(opening_rarity=1.0),  # B90 (×3)
        _raw(opening_rarity=1.0),
        _raw(opening_rarity=1.0),
        _raw(opening_rarity=3.0),  # C65 (×1)
    ]
    result = normalize_corpus(raw, _CONFIG)
    assert result[0].opening_rarity == 0
    assert result[3].opening_rarity == 100
