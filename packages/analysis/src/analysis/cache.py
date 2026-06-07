"""Disk-backed evaluation cache keyed by (FEN, depth)."""

import hashlib
import json
import os
import tempfile
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
        content = path.read_text(encoding="utf-8")
        if not content:
            return None
        return int(json.loads(content)["cp"])

    def put(self, fen: str, depth: int, score: int) -> None:
        """Persist a centipawn score for the (FEN, depth) key atomically."""
        path = self._key_path(fen, depth)
        data = json.dumps({"fen": fen, "depth": depth, "cp": score}).encode()
        fd, tmp = tempfile.mkstemp(dir=self._cache_dir, suffix=".tmp")
        try:
            with os.fdopen(fd, "wb") as f:
                f.write(data)
            os.replace(tmp, path)
        except BaseException:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

    def _key_path(self, fen: str, depth: int) -> Path:
        key = hashlib.sha256(f"{fen}\n{depth}".encode()).hexdigest()
        return self._cache_dir / f"{key}.json"
