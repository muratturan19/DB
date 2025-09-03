import logging
import os
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

base_prompts = Path(__file__).resolve().parents[1] / "Prompts"
base_guides = Path(__file__).resolve().parents[1] / "Guidelines"
os.environ.setdefault("PROMPTS_DIR", str(base_prompts))
os.environ.setdefault("GUIDELINES_DIR", str(base_guides))

from api.logging_config import configure_logging


class LoggingConfigTest(unittest.TestCase):
    """Tests for the logging configuration helper."""

    def setUp(self) -> None:
        self.root = logging.getLogger()
        self.orig_handlers = self.root.handlers[:]
        for handler in self.root.handlers:
            self.root.removeHandler(handler)

    def tearDown(self) -> None:
        for handler in self.root.handlers:
            self.root.removeHandler(handler)
        for handler in self.orig_handlers:
            self.root.addHandler(handler)

    def test_basic_config_called_no_handlers(self) -> None:
        with patch("api.logging_config.sys.stdout", new=MagicMock()) as mock_stdout, \
             patch("api.logging_config.sys.stderr", new=MagicMock()) as mock_stderr, \
             patch("logging.basicConfig") as mock_basic:
            mock_stdout.isatty.return_value = False
            mock_stderr.isatty.return_value = False
            configure_logging()
            mock_basic.assert_called_once_with(level=logging.INFO, stream=mock_stderr)

    def test_level_from_env(self) -> None:
        with patch("api.logging_config.sys.stdout", new=MagicMock()) as mock_stdout, \
             patch("api.logging_config.sys.stderr", new=MagicMock()) as mock_stderr, \
             patch("logging.basicConfig") as mock_basic, \
             patch.dict(os.environ, {"LOG_LEVEL": "DEBUG"}):
            mock_stdout.isatty.return_value = False
            mock_stderr.isatty.return_value = False
            configure_logging()
            mock_basic.assert_called_once_with(level=logging.DEBUG, stream=mock_stderr)

    def test_no_config_when_handlers_exist(self) -> None:
        handler = logging.NullHandler()
        self.root.addHandler(handler)
        try:
            with patch("api.logging_config.sys.stdout", new=MagicMock()) as mock_stdout, \
                 patch("api.logging_config.sys.stderr", new=MagicMock()) as mock_stderr, \
                 patch("logging.basicConfig") as mock_basic:
                mock_stdout.isatty.return_value = False
                mock_stderr.isatty.return_value = False
                configure_logging()
                mock_basic.assert_not_called()
        finally:
            self.root.removeHandler(handler)

    def test_prefers_stdout_when_tty(self) -> None:
        with patch("api.logging_config.sys.stdout", new=MagicMock()) as mock_stdout, \
             patch("api.logging_config.sys.stderr", new=MagicMock()) as mock_stderr, \
             patch("logging.basicConfig") as mock_basic:
            mock_stdout.isatty.return_value = True
            mock_stderr.isatty.return_value = True
            configure_logging()
            mock_basic.assert_called_once_with(level=logging.INFO, stream=mock_stdout)


if __name__ == "__main__":
    unittest.main()
