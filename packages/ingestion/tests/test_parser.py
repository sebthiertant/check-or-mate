"""Tests for PgnParser."""

from ingestion.parser import GameHeaders, PgnParser

_SAMPLE_PGN = """\
[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.01.15"]
[White "hikaru"]
[Black "MagnusCarlsen"]
[Result "1-0"]
[ECO "B90"]
[Opening "Sicilian Defense: Najdorf Variation"]

1. e4 c5 2. Nf3 d6 1-0
"""


def test_extract_headers_returns_correct_eco() -> None:
    parser = PgnParser()

    headers = parser.extract_headers(_SAMPLE_PGN)

    assert headers is not None
    assert headers.eco == "B90"


def test_extract_headers_normalises_date_separators() -> None:
    parser = PgnParser()

    headers = parser.extract_headers(_SAMPLE_PGN)

    assert headers is not None
    assert headers.date == "2024-01-15"


def test_extract_headers_returns_result() -> None:
    parser = PgnParser()

    headers = parser.extract_headers(_SAMPLE_PGN)

    assert headers is not None
    assert headers.result == "1-0"


def test_extract_headers_returns_opening_name() -> None:
    parser = PgnParser()

    headers = parser.extract_headers(_SAMPLE_PGN)

    assert headers is not None
    assert "Najdorf" in headers.opening_name


def test_extract_headers_returns_none_for_empty_string() -> None:
    parser = PgnParser()

    result = parser.extract_headers("")

    assert result is None


def test_extract_headers_returns_game_headers_instance() -> None:
    parser = PgnParser()

    headers = parser.extract_headers(_SAMPLE_PGN)

    assert isinstance(headers, GameHeaders)
