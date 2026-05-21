"""End-to-end tests for the Scorer orchestrator."""

from analysis.config import load_config
from analysis.models import GameRecord, GameResult, NormalizedScores
from analysis.scorer import Scorer

_PGN_EQUAL = """\
[Event "Test"]
[White "A"]
[Black "B"]
[Result "1/2-1/2"]
[ECO "C50"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1/2-1/2
"""

_PGN_CLOCKED = """\
[Event "Test"]
[White "A"]
[Black "B"]
[Result "1-0"]
[ECO "B00"]

1. e4 { [%clk 0:00:05] } e5 { [%clk 0:00:09] }
2. Nf3 { [%clk 0:00:11] } Nc6 { [%clk 0:00:15] }
3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 1-0
"""

_PGN_OPERA = """\
[Event "Opera Game"]
[White "Morphy"]
[Black "Duke/Count"]
[Result "1-0"]
[ECO "C41"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7
8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7
14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0
"""

_CONFIG = load_config()


def _make_record(
    game_id: str,
    pgn: str,
    white_rating: int,
    black_rating: int,
    result: GameResult,
    eco: str,
) -> GameRecord:
    return GameRecord(
        game_id=game_id,
        pgn=pgn,
        white_rating=white_rating,
        black_rating=black_rating,
        result=result,
        eco=eco,
    )


def test_score_corpus_returns_one_result_per_game() -> None:
    records = [
        _make_record("g1", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
        _make_record("g2", _PGN_OPERA, 2700, 1500, GameResult.WHITE_WINS, "C41"),
    ]
    scores = Scorer(_CONFIG).score_corpus(records)
    assert len(scores) == 2


def test_score_corpus_all_dimensions_in_bounds() -> None:
    records = [
        _make_record("g1", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
        _make_record("g2", _PGN_CLOCKED, 1800, 2100, GameResult.WHITE_WINS, "B00"),
        _make_record("g3", _PGN_OPERA, 2700, 1500, GameResult.WHITE_WINS, "C41"),
    ]
    scores = Scorer(_CONFIG).score_corpus(records)

    for normalized in scores:
        for dim in (
            "sacrifice",
            "eval_swing",
            "brilliancy",
            "time_pressure",
            "endgame_quality",
            "rating_upset",
            "opening_rarity",
            "overall",
        ):
            value = getattr(normalized, dim)
            assert 0 <= value <= 100, f"game {normalized} — {dim}={value} out of [0, 100]"


def test_score_corpus_returns_normalized_scores_instances() -> None:
    records = [
        _make_record("g1", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
    ]
    scores = Scorer(_CONFIG).score_corpus(records)
    assert isinstance(scores[0], NormalizedScores)


def test_score_corpus_engine_dimensions_normalize_to_50_without_evaluator() -> None:
    records = [
        _make_record("g1", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
        _make_record("g2", _PGN_OPERA, 2700, 1500, GameResult.WHITE_WINS, "C41"),
    ]
    scores = Scorer(_CONFIG).score_corpus(records)
    for score in scores:
        # Without an Evaluator, eval_swing and brilliancy are 0 for every game
        # → all equal → normalised to 50.
        assert score.eval_swing == 50
        assert score.brilliancy == 50


def test_score_corpus_sacrificial_game_scores_higher_sacrifice() -> None:
    records = [
        _make_record("equal", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
        _make_record("opera", _PGN_OPERA, 2700, 1500, GameResult.WHITE_WINS, "C41"),
    ]
    scores = Scorer(_CONFIG).score_corpus(records)
    assert scores[1].sacrifice > scores[0].sacrifice


def test_score_corpus_rarity_differs_for_distinct_ecos() -> None:
    records = [
        _make_record("g1", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
        _make_record("g2", _PGN_EQUAL, 2000, 2000, GameResult.DRAW, "C50"),
        _make_record("g3", _PGN_OPERA, 2700, 1500, GameResult.WHITE_WINS, "C41"),
    ]
    scores = Scorer(_CONFIG).score_corpus(records)
    assert scores[2].opening_rarity > scores[0].opening_rarity
