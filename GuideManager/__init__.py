"""Guide management module."""

from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any, Dict


class GuideNotFoundError(FileNotFoundError):
    """Raised when the requested guide file cannot be found."""


class GuideManager:
    """Manages guide steps and resources for quality-report methods."""

    def __init__(self) -> None:
        """Initialize the guide cache."""
        self._cache: Dict[str, Dict[str, Any]] = {}

    def load_guide(self, path: str) -> Dict[str, Any]:
        """Load guide information from the given path."""
        try:
            with open(path, "r", encoding="utf-8") as file:
                return json.load(file)
        except FileNotFoundError as exc:
            raise GuideNotFoundError(path) from exc

    def get_format(self, method: str) -> Dict[str, Any]:
        """Return the guide dictionary for the given method."""
        if method not in self._cache:
            base_dir = Path(__file__).resolve().parents[1] / "Guidelines"
            guide_path = base_dir / f"{method}_Guide.json"
            self._cache[method] = self.load_guide(str(guide_path))
        return self._cache[method]

    def save_guide(self, method: str, data: Dict[str, Any]) -> None:
        """Persist ``data`` for ``method`` and update the cache."""
        base_dir = Path(__file__).resolve().parents[1] / "Guidelines"
        guide_path = base_dir / f"{method}_Guide.json"
        with open(guide_path, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)
        self._cache[method] = data

    def reset_guide(self, method: str) -> None:
        """Restore ``method`` guideline from the ``default`` directory."""
        base_dir = Path(__file__).resolve().parents[1] / "Guidelines"
        default_dir = base_dir / "default"
        src = default_dir / f"{method}_Guide.json"
        dst = base_dir / f"{method}_Guide.json"
        if not src.exists():
            raise GuideNotFoundError(str(src))
        shutil.copy2(src, dst)
        if method in self._cache:
            del self._cache[method]


__all__ = ["GuideManager", "GuideNotFoundError"]
