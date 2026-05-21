"""Disk-backed evaluation cache keyed by (FEN, depth)."""

import hashlib
import json
from pathlib import Path


class EvalCache:
    """Cache Stockfish centipawn evaluations to disk.

    Each entry is stored as ``{cache_dir}/{sha256(fen+depth)}.json``.
    """

    def __init__(self, cache_dir: Path) -> None:
        self._cache_dir = cache_dir
        cache_dir.mkdir(parents=True, exist_ok=True)

    @property
    def directory(self) -> Path:
        """The cache directory path (exposed for subprocess serialisation)."""
        return self._cache_dir

    def get(self, fen: str, depth: int) -> int | None:
        """Return cached centipawn score or None on miss."""
        path = self._key_path(fen, depth)
        if not path.exists():
            return None
        return int(json.loads(path.read_text(encoding="utf-8"))["cp"])

    def put(self, fen: str, depth: int, score: int) -> None:
        """Persist a centipawn score for the (FEN, depth) key."""
        path = self._key_path(fen, depth)
        path.write_text(
            json.dumps({"fen": fen, "depth": depth, "cp": score}),
            encoding="utf-8",
        )

    def _key_path(self, fen: str, depth: int) -> Path:
        key = hashlib.sha256(f"{fen}\n{depth}".encode()).hexdigest()
        return self._cache_dir / f"{key}.json"
