"""Stockfish UCI driver — long-lived subprocess."""

import io
import subprocess
from dataclasses import dataclass

import chess
import chess.pgn

_MATE_SCORE = 30_000  # centipawns used to represent any forced mate


@dataclass(frozen=True)
class EngineConfig:
    """Stockfish engine configuration."""

    path: str
    depth: int = 18


class StockfishEngine:
    """Long-lived Stockfish subprocess communicating over UCI.

    Use as a context manager::

        with StockfishEngine(EngineConfig(path="/usr/games/stockfish")) as engine:
            score = engine.evaluate(fen)
    """

    def __init__(self, config: EngineConfig) -> None:
        self._config = config
        self._process: subprocess.Popen[str] | None = None

    def __enter__(self) -> "StockfishEngine":
        self._process = subprocess.Popen(
            [self._config.path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self._send("uci")
        self._await_token("uciok")
        self._send("isready")
        self._await_token("readyok")
        return self

    def __exit__(self, *_: object) -> None:
        self._send("quit")
        if self._process is not None:
            self._process.wait(timeout=5)

    def evaluate(self, fen: str) -> int:
        """Return centipawn evaluation from white's perspective."""
        self._send(f"position fen {fen}")
        self._send(f"go depth {self._config.depth}")
        return self._read_score()

    def _send(self, command: str) -> None:
        assert self._process is not None and self._process.stdin is not None
        self._process.stdin.write(command + "\n")
        self._process.stdin.flush()

    def _await_token(self, token: str) -> None:
        assert self._process is not None and self._process.stdout is not None
        for line in self._process.stdout:
            if token in line:
                return

    def _read_score(self) -> int:
        """Read output lines until bestmove; return last parsed score."""
        assert self._process is not None and self._process.stdout is not None
        score = 0
        for line in self._process.stdout:
            if line.startswith("info") and "score" in line:
                score = _parse_score(line)
            if line.startswith("bestmove"):
                return score
        return score


def _parse_score(line: str) -> int:
    """Parse 'score cp N' or 'score mate M' from a Stockfish info line."""
    parts = line.split()
    if "score" not in parts:
        return 0
    index = parts.index("score")
    if index + 2 >= len(parts):
        return 0
    score_type = parts[index + 1]
    value = int(parts[index + 2])
    if score_type == "cp":
        return value
    if score_type == "mate":
        return _MATE_SCORE if value > 0 else -_MATE_SCORE
    return 0


def extract_fens(pgn: str) -> list[str]:
    """Return the FEN after each half-move in the main line."""
    game = chess.pgn.read_game(io.StringIO(pgn))
    if game is None:
        return []
    board = game.board()
    fens: list[str] = []
    for move in game.mainline_moves():
        board.push(move)
        fens.append(board.fen())
    return fens
