"""check-or-mate ingestion package.

Public API:
    ChessComClient  — HTTP client for Chess.com Public API
    PgnParser       — PGN header extractor
    Store           — SQLite persistence layer
    Syncer          — Incremental sync orchestrator
"""

from .client import ChessComClient
from .parser import PgnParser
from .store import Store
from .sync import Syncer

__all__ = ["ChessComClient", "PgnParser", "Store", "Syncer"]
