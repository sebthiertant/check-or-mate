"""PGN header extraction."""

import io
from dataclasses import dataclass

import chess.pgn


@dataclass(frozen=True)
class GameHeaders:
    eco: str
    opening_name: str
    date: str  # normalised to YYYY-MM-DD
    result: str  # "1-0", "0-1", "1/2-1/2"


class PgnParser:
    def extract_headers(self, pgn_text: str) -> GameHeaders | None:
        """Parse PGN text and return extracted headers, or None if unreadable."""
        game = chess.pgn.read_game(io.StringIO(pgn_text))
        if game is None:
            return None
        return GameHeaders(
            eco=game.headers.get("ECO", ""),
            opening_name=game.headers.get("Opening", ""),
            date=game.headers.get("Date", "").replace(".", "-"),
            result=game.headers.get("Result", ""),
        )
