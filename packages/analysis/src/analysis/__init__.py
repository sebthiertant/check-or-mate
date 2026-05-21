"""check-or-mate analysis package.

Public API:
    GameRecord        — input domain model
    NormalizedScores  — output domain model
    Scorer            — corpus scoring orchestrator
    load_config       — load ScoringConfig from config.yml
"""

from .config import ScoringConfig, load_config
from .models import GameRecord, GameResult, NormalizedScores
from .scorer import Scorer

__all__ = ["GameRecord", "GameResult", "NormalizedScores", "Scorer", "ScoringConfig", "load_config"]
