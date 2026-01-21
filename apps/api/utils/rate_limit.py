from __future__ import annotations

from collections import defaultdict
from time import time

from config import settings


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._requests: dict[str, list[float]] = defaultdict(list)

    def allow(self, key: str) -> bool:
        now = time()
        window_start = now - 60
        bucket = [t for t in self._requests[key] if t >= window_start]
        self._requests[key] = bucket
        if len(bucket) >= settings.rate_limit_per_min + settings.rate_limit_burst:
            return False
        self._requests[key].append(now)
        return True


rate_limiter = InMemoryRateLimiter()

