"""Tests for database loader helpers."""

from analysis.db import iso_date_to_unix, unix_to_date


def test_iso_date_to_unix_unix_epoch() -> None:
    assert iso_date_to_unix("1970-01-01") == 0


def test_iso_date_to_unix_known_date() -> None:
    # 2024-01-01 00:00:00 UTC = 1704067200
    assert iso_date_to_unix("2024-01-01") == 1704067200


def test_unix_to_date_epoch() -> None:
    assert unix_to_date(0) == "1970-01-01"


def test_unix_to_date_known_date() -> None:
    assert unix_to_date(1704067200) == "2024-01-01"


def test_round_trip() -> None:
    date = "2025-06-15"
    assert unix_to_date(iso_date_to_unix(date)) == date
