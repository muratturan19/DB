"""Utilities for reviewing generated reports using a second LLM."""

from __future__ import annotations

import os
import logging
from pathlib import Path
from importlib import resources as pkg_resources
import Prompts


class ReviewLLMError(RuntimeError):
    """Raised when the review LLM cannot be used."""


class Review:
    """Reviews generated reports or analysis results."""

    def __init__(
        self, model: str | None = None, template_path: str | None = None
    ) -> None:
        """Initialize with optional LLM model name and prompt template."""
        if model is None:
            model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.model = model
        self.logger = logging.getLogger(__name__)

        if template_path is None:
            base_dir = os.environ.get("PROMPTS_DIR")
            if base_dir:
                primary = Path(base_dir) / "Fixer_General_Prompt.md"
                if primary.exists():
                    template_path = primary

        if template_path is not None:
            with open(template_path, "r", encoding="utf-8") as file:
                self.template = file.read()
        else:  # pragma: no cover - executed only when file is bundled
            try:
                resource = (
                    pkg_resources.files(Prompts)
                    .joinpath("Fixer_General_Prompt.md")
                    .read_text(encoding="utf-8")
                )
                self.template = resource
            except (FileNotFoundError, ModuleNotFoundError) as exc:
                raise ReviewLLMError("Prompt template not found") from exc

    def _query_llm(self, prompt: str) -> str:
        """Return the LLM response for the given prompt."""
        self.logger.debug("Review._query_llm start")
        try:
            from openai import OpenAI  # type: ignore
        except ImportError as exc:  # pragma: no cover - optional dependency
            raise ReviewLLMError("openai package is not installed") from exc

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ReviewLLMError("OPENAI_API_KEY not set")
        client = OpenAI(api_key=api_key)

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
            )
            tokens = getattr(
                getattr(response, "usage", None),
                "total_tokens",
                None,
            )
            if tokens is not None:
                self.logger.info("Review tokens used: %s", tokens)
            content = response.choices[0].message.content
            result = content.strip()
            self.logger.debug("Review._query_llm end")
            return result
        except Exception as exc:  # pragma: no cover - network issues
            message = str(exc).lower()
            if "invalid" in message or "incorrect" in message:
                raise ReviewLLMError("Invalid OpenAI API key") from exc
            self.logger.error("Review error: %s", exc)
            self.logger.debug("Review._query_llm end")
            return f"LLM review placeholder for: {prompt[:50]}"

    def _build_prompt(self, text: str, **context: str) -> str:
        """Return the review prompt filled with context and text."""
        params = {
            "method": context.get("method", ""),
            "customer": context.get("customer", ""),
            "subject": context.get("subject", ""),
            "part_code": context.get("part_code", ""),
            "initial_report_text": text,
            "guideline_json": context.get("guideline_json", ""),
            "language": context.get("language", ""),
        }
        return self.template.format(**params)

    def perform(self, text: str, **context: str) -> str:
        """Return a reviewed version of ``text``.

        ``context`` may include a ``language`` key specifying the desired
        response language.
        """
        prompt = self._build_prompt(text, **context)
        return self._query_llm(prompt)


__all__ = ["Review", "ReviewLLMError"]
