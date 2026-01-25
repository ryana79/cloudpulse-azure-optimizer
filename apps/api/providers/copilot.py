from __future__ import annotations

from config import settings
from providers.grok import build_context_pack
from providers.grok import answer_question as grok_answer_question
from providers.grok import generate_remediation as grok_generate_remediation
from providers.huggingface import answer_question as hf_answer_question
from providers.huggingface import generate_remediation as hf_generate_remediation


def _provider() -> str:
    return settings.copilot_provider.strip().lower()


def answer_question(question: str, context_pack: dict) -> dict:
    if _provider() == "hf":
        return hf_answer_question(question, context_pack)
    return grok_answer_question(question, context_pack)


def generate_remediation(selected_findings: list[dict], format: str) -> dict:
    if _provider() == "hf":
        return hf_generate_remediation(selected_findings, format)
    return grok_generate_remediation(selected_findings, format)


__all__ = ["answer_question", "build_context_pack", "generate_remediation"]
