"""Load and expose scoring configuration from config.yml."""

from dataclasses import dataclass
from pathlib import Path

import yaml

# Default path: packages/analysis/config.yml (relative to this source file).
_DEFAULT_CONFIG_PATH = Path(__file__).parent.parent.parent / "config.yml"


@dataclass(frozen=True)
class ScoringWeights:
    sacrifice: float
    eval_swing: float
    brilliancy: float
    time_pressure: float
    endgame_quality: float
    rating_upset: float
    opening_rarity: float


@dataclass(frozen=True)
class ScoringThresholds:
    time_pressure_window_seconds: int
    endgame_piece_count: int
    rating_upset_max_delta: int


@dataclass(frozen=True)
class ScoringConfig:
    weights: ScoringWeights
    thresholds: ScoringThresholds


def load_config(path: Path | None = None) -> ScoringConfig:
    """Load ScoringConfig from the given YAML file, or from the bundled default."""
    config_path = path or _DEFAULT_CONFIG_PATH
    with config_path.open(encoding="utf-8") as file_handle:
        data = yaml.safe_load(file_handle)

    scoring = data["scoring"]
    raw_weights = scoring["weights"]
    raw_thresholds = scoring["thresholds"]

    weights = ScoringWeights(
        sacrifice=float(raw_weights["sacrifice"]),
        eval_swing=float(raw_weights["eval_swing"]),
        brilliancy=float(raw_weights["brilliancy"]),
        time_pressure=float(raw_weights["time_pressure"]),
        endgame_quality=float(raw_weights["endgame_quality"]),
        rating_upset=float(raw_weights["rating_upset"]),
        opening_rarity=float(raw_weights["opening_rarity"]),
    )
    thresholds = ScoringThresholds(
        time_pressure_window_seconds=int(raw_thresholds["time_pressure_window_s"]),
        endgame_piece_count=int(raw_thresholds["endgame_piece_count"]),
        rating_upset_max_delta=int(raw_thresholds["rating_upset_max_delta"]),
    )
    return ScoringConfig(weights=weights, thresholds=thresholds)
