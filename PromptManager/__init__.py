"""Utilities for loading prompt templates."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any, Dict


class PromptManager:
    """Manages LLM prompt templates."""

    def __init__(self) -> None:
        """Initialize the template caches."""
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._text_cache: Dict[str, str] = {}

    def load_prompt(self, path: str) -> Dict[str, Any]:
        """Load a prompt template from ``path``."""
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)

    def load_text_prompt(self, path: str) -> str:
        """Return the text content of a prompt file."""
        with open(path, "r", encoding="utf-8") as file:
            return file.read()

    def get_template(self, method: str) -> Dict[str, Any]:
        """Return the prompt template for ``method`` with caching."""
        if method not in self._cache:
            base_dir = Path(__file__).resolve().parents[1] / "Prompts"
            prompt_path = base_dir / f"{method}_Prompt.json"
            self._cache[method] = self.load_prompt(str(prompt_path))
        return self._cache[method]

    def get_text_prompt(self, method: str) -> str:
        """Return the text prompt for ``method`` with caching."""
        if method not in self._text_cache:
            base_dir = Path(__file__).resolve().parents[1] / "Prompts"
            prompt_path = base_dir / f"{method}_Prompt.txt"
            if prompt_path.exists():
                path_str = str(prompt_path)
                self._text_cache[method] = self.load_text_prompt(path_str)
            else:
                self._text_cache[method] = ""
        return self._text_cache[method]

    def save_text_prompt(self, method: str, text: str) -> None:
        """Persist ``text`` for ``method`` and update the cache."""
        base_dir = Path(__file__).resolve().parents[1] / "Prompts"
        prompt_path = base_dir / f"{method}_Prompt.txt"
        with open(prompt_path, "w", encoding="utf-8") as file:
            file.write(text)
        self._text_cache[method] = text

    def reset_text_prompt(self, method: str) -> None:
        """Restore ``method`` prompt from the ``default`` directory."""
        base_dir = Path(__file__).resolve().parents[1] / "Prompts"
        default_dir = base_dir / "default"
        src = default_dir / f"{method}_Prompt.txt"
        dst = base_dir / f"{method}_Prompt.txt"
        if not src.exists():
            raise FileNotFoundError(src)
        shutil.copy2(src, dst)
        if method in self._text_cache:
            del self._text_cache[method]


__all__ = ["PromptManager"]
