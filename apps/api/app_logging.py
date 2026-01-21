import logging
import re
from typing import Any


REDACT_PATTERNS = [
    re.compile(r"Bearer\s+[A-Za-z0-9\-_\.]+", re.IGNORECASE),
    re.compile(r"(?i)grok[_-]?api[_-]?key\s*[:=]\s*[A-Za-z0-9\-_]+"),
    re.compile(r"(?i)client_secret\s*[:=]\s*[A-Za-z0-9\-_]+"),
]


class RedactionFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        redacted = message
        for pattern in REDACT_PATTERNS:
            redacted = pattern.sub("[REDACTED]", redacted)
        record.msg = redacted
        record.args = ()
        return True


def setup_logging(level: str) -> None:
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logging.getLogger().addFilter(RedactionFilter())


def redact_dict(payload: dict[str, Any]) -> dict[str, Any]:
    safe: dict[str, Any] = {}
    for key, value in payload.items():
        if any(token in key.lower() for token in ["token", "secret", "key"]):
            safe[key] = "[REDACTED]"
        else:
            safe[key] = value
    return safe

