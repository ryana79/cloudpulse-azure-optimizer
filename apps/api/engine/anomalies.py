from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from statistics import mean, stdev


@dataclass(frozen=True)
class CostPoint:
    date: date
    cost: float


@dataclass(frozen=True)
class AnomalyResult:
    date: date
    cost: float
    mean: float
    stddev: float
    z_score: float


def detect_anomalies(
    points: list[CostPoint],
    window: int,
    z_threshold: float,
    min_abs: float,
) -> list[AnomalyResult]:
    results: list[AnomalyResult] = []
    if len(points) <= window:
        return results

    for idx in range(window, len(points)):
        window_points = [p.cost for p in points[idx - window : idx]]
        if len(window_points) < 2:
            continue
        avg = mean(window_points)
        deviation = stdev(window_points)
        if deviation == 0:
            continue
        current = points[idx]
        z_value = (current.cost - avg) / deviation
        if z_value >= z_threshold and current.cost >= min_abs:
            results.append(
                AnomalyResult(
                    date=current.date,
                    cost=current.cost,
                    mean=avg,
                    stddev=deviation,
                    z_score=z_value,
                )
            )
    return results

