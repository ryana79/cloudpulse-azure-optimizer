from datetime import date, timedelta

from engine.anomalies import CostPoint, detect_anomalies


def test_detect_anomalies_flags_spike() -> None:
    start = date.today() - timedelta(days=20)
    points = [CostPoint(date=start + timedelta(days=i), cost=10.0) for i in range(14)]
    points += [CostPoint(date=start + timedelta(days=14), cost=10.0)]
    points += [CostPoint(date=start + timedelta(days=15), cost=100.0)]

    results = detect_anomalies(points, window=14, z_threshold=3.0, min_abs=5.0)
    assert results
    assert results[0].cost == 100.0

