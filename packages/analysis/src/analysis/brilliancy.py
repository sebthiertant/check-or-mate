"""Engine-based dimension scorers: brilliancy and eval swing."""


def brilliancy_score(evals_white_pov: list[int]) -> float:
    """Count moves where eval improves > 200 cp for the side that just moved.

    evals_white_pov: cp evals from white's perspective, one per half-move.
    Index 0 = after white move 1, index 1 = after black move 1, etc.
    Starting position is assumed to be 0 cp.
    """
    if not evals_white_pov:
        return 0.0
    all_evals = [0, *evals_white_pov]
    count = 0
    for move_index in range(1, len(all_evals)):
        if _improvement(all_evals, move_index) > 200:
            count += 1
    return float(count)


def eval_swing_score(evals_white_pov: list[int]) -> float:
    """Maximum absolute centipawn swing between consecutive positions."""
    if not evals_white_pov:
        return 0.0
    all_evals = [0, *evals_white_pov]
    return float(max(abs(all_evals[i] - all_evals[i - 1]) for i in range(1, len(all_evals))))


def _improvement(all_evals: list[int], move_index: int) -> int:
    """Centipawn gain for the side that played the move at move_index."""
    previous = all_evals[move_index - 1]
    current = all_evals[move_index]
    if move_index % 2 == 1:  # white moved (odd half-move index)
        return current - previous
    return previous - current  # black moved
