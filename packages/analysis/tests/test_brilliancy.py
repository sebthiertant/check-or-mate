"""Tests for brilliancy and eval_swing dimension scorers."""

from analysis.brilliancy import brilliancy_score, eval_swing_score

# ── brilliancy_score ──────────────────────────────────────────────────────────


def test_brilliancy_returns_zero_for_empty_evals() -> None:
    assert brilliancy_score([]) == 0.0


def test_brilliancy_counts_white_improvement_over_200cp() -> None:
    # White plays a move that jumps the eval from 0 to +250.
    assert brilliancy_score([250]) == 1.0


def test_brilliancy_ignores_white_improvement_under_threshold() -> None:
    # White improves by only 100 cp — not brilliant.
    assert brilliancy_score([100]) == 0.0


def test_brilliancy_counts_black_improvement() -> None:
    # After white's modest first move (+10), black finds a brilliant reply
    # that swings the eval from +10 to −200 (a 210 cp gain for black).
    assert brilliancy_score([10, -200]) == 1.0


def test_brilliancy_ignores_black_improvement_under_threshold() -> None:
    # Black gains 150 cp — not > 200, so not counted.
    assert brilliancy_score([100, -50]) == 0.0


def test_brilliancy_counts_multiple_brilliant_moves() -> None:
    # Three moves all swing > 200 cp in favour of the side that played.
    # all_evals: [0, 250, 0, 250]
    # move 1 (white): +250  → brilliant
    # move 2 (black): 250−0 = +250 for black → brilliant
    # move 3 (white): +250  → brilliant
    assert brilliancy_score([250, 0, 250]) == 3.0


def test_brilliancy_exact_threshold_is_not_counted() -> None:
    # Exactly 200 cp improvement does NOT qualify (must be strictly > 200).
    assert brilliancy_score([200]) == 0.0


# ── eval_swing_score ──────────────────────────────────────────────────────────


def test_eval_swing_returns_zero_for_empty_evals() -> None:
    assert eval_swing_score([]) == 0.0


def test_eval_swing_returns_zero_for_single_eval() -> None:
    # Only one eval means one swing from 0: |100-0| = 100
    assert eval_swing_score([100]) == 100.0


def test_eval_swing_returns_max_swing() -> None:
    # Swings: |50-0|=50, |300-50|=250, |100-300|=200 → max = 250
    assert eval_swing_score([50, 300, 100]) == 250.0


def test_eval_swing_handles_negative_evals() -> None:
    # Swings: |-200-0|=200, |150-(-200)|=350 → max = 350
    assert eval_swing_score([-200, 150]) == 350.0


def test_eval_swing_is_symmetric_around_zero() -> None:
    # Swing from +200 to -200: |−200−200| = 400
    assert eval_swing_score([200, -200]) == 400.0
