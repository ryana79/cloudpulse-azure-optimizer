from datetime import date, timedelta

from engine.anomalies import CostPoint, detect_anomalies


def _series(costs: list[float]) -> list[CostPoint]:
    start = date.today() - timedelta(days=len(costs))
    return [CostPoint(date=start + timedelta(days=i), cost=cost) for i, cost in enumerate(costs)]


def test_detect_anomalies_flags_spike() -> None:
    start = date.today() - timedelta(days=20)
    points = [CostPoint(date=start + timedelta(days=i), cost=10.0) for i in range(13)]
    points += [CostPoint(date=start + timedelta(days=13), cost=12.0)]
    points += [CostPoint(date=start + timedelta(days=14), cost=10.0)]
    points += [CostPoint(date=start + timedelta(days=15), cost=100.0)]

    results = detect_anomalies(points, window=14, z_threshold=3.0, min_abs=5.0)
    assert results
    assert results[0].cost == 100.0


def test_detect_anomalies_reports_z_score_against_trailing_window() -> None:
    points = _series([10.0, 12.0, 10.0, 12.0, 10.0, 12.0, 50.0])

    results = detect_anomalies(points, window=6, z_threshold=3.0, min_abs=5.0)
    assert len(results) == 1
    assert results[0].mean == 11.0
    assert results[0].z_score > 3.0


def test_detect_anomalies_ignores_steady_costs() -> None:
    points = _series([10.0, 11.0, 10.0, 11.0, 10.0, 11.0, 10.5])
    assert detect_anomalies(points, window=6, z_threshold=3.0, min_abs=5.0) == []


def test_detect_anomalies_respects_min_abs_floor() -> None:
    points = _series([0.10, 0.12, 0.10, 0.12, 0.10, 0.12, 1.0])
    assert detect_anomalies(points, window=6, z_threshold=3.0, min_abs=5.0) == []


def test_detect_anomalies_skips_zero_variance_windows() -> None:
    points = _series([10.0] * 6 + [100.0])
    assert detect_anomalies(points, window=6, z_threshold=3.0, min_abs=5.0) == []


def test_detect_anomalies_requires_more_points_than_window() -> None:
    points = _series([10.0, 10.0, 10.0])
    assert detect_anomalies(points, window=14, z_threshold=3.0, min_abs=5.0) == []
