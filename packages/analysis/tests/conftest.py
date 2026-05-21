"""Shared fixtures for analysis tests."""

import pytest
from analysis.models import GameRecord, GameResult

# Minimal PGN without clock annotations — all moves play out equally.
PGN_EQUAL_GAME = """\
[Event "Test"]
[White "A"]
[Black "B"]
[Result "1/2-1/2"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1/2-1/2
"""

# PGN with clock comments — move 1 (white) = 5s, move 1 (black) = 9s, both < 10s threshold.
PGN_CLOCKED_GAME = """\
[Event "Test"]
[White "A"]
[Black "B"]
[Result "1-0"]
[ECO "B00"]

1. e4 { [%clk 0:00:05] } e5 { [%clk 0:00:09] }
2. Nf3 { [%clk 0:00:11] } Nc6 { [%clk 0:00:15] }
3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0
"""

# Famous Opera Game — white sacrifices rooks and wins decisively.
PGN_OPERA_GAME = """\
[Event "Opera Game"]
[White "Morphy"]
[Black "Duke/Count"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7
8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7
14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0
"""


@pytest.fixture
def equal_game_record() -> GameRecord:
    return GameRecord(
        game_id="equal-1",
        pgn=PGN_EQUAL_GAME,
        white_rating=2000,
        black_rating=2000,
        result=GameResult.DRAW,
        eco="C50",
    )


@pytest.fixture
def clocked_game_record() -> GameRecord:
    return GameRecord(
        game_id="clocked-1",
        pgn=PGN_CLOCKED_GAME,
        white_rating=1800,
        black_rating=2100,
        result=GameResult.WHITE_WINS,
        eco="B00",
    )


@pytest.fixture
def opera_game_record() -> GameRecord:
    return GameRecord(
        game_id="opera-1",
        pgn=PGN_OPERA_GAME,
        white_rating=2700,
        black_rating=1500,
        result=GameResult.WHITE_WINS,
        eco="C41",
    )
