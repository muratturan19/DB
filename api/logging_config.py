"""Utilities for configuring application logging."""

from __future__ import annotations

import logging
import os
import sys
from typing import TextIO

__all__ = ["configure_logging"]


def _default_stream() -> TextIO:
    """Return a sensible stream for logging based on TTY availability."""
    if hasattr(sys.stdout, "isatty") and sys.stdout.isatty():
        return sys.stdout
    if hasattr(sys.stderr, "isatty") and sys.stderr.isatty():
        return sys.stderr
    return sys.stderr


def configure_logging() -> None:
    """Initialize basic logging if no user handlers are present."""
    root = logging.getLogger()
    ignore = {"LogCaptureHandler", "_LiveLoggingNullHandler", "_FileHandler"}
    has_real = any(h.__class__.__name__ not in ignore for h in root.handlers)
    if not has_real:
        level_name = os.getenv("LOG_LEVEL", "INFO").upper()
        level = getattr(logging, level_name, logging.INFO)
        logging.basicConfig(level=level, stream=_default_stream())

