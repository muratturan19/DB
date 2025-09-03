import importlib
import os
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path


class RunAPITest(unittest.TestCase):
    """Tests for the ``run_api`` entry point."""

    def test_main_with_env_file(self) -> None:
        """``main`` should load dotenv when ``ENV_FILE`` exists."""
        base_prompts = Path(__file__).resolve().parents[1] / "Prompts"
        base_guides = Path(__file__).resolve().parents[1] / "Guidelines"
        with tempfile.TemporaryDirectory() as tmpdir:
            env_path = os.path.join(tmpdir, ".env")
            with open(env_path, "w", encoding="utf-8") as fh:
                fh.write("OPENAI_API_KEY=key")
            with patch.dict(
                os.environ,
                {
                    "ENV_FILE": env_path,
                    "PROMPTS_DIR": str(base_prompts),
                    "GUIDELINES_DIR": str(base_guides),
                },
                clear=True,
            ):
                module = importlib.import_module("run_api")
                with patch.object(module, "uvicorn") as mock_uvicorn, \
                        patch.object(module, "configure_logging") as mock_conf, \
                        patch.object(module, "load_dotenv") as mock_load:
                    module.main()
                    mock_conf.assert_called_once()
                    mock_load.assert_called_once_with(env_path)
                    mock_uvicorn.run.assert_called_once_with(
                        module.app,
                        host="0.0.0.0",
                        port=8000,
                        log_config=None,
                        access_log=False,
                    )
                    self.assertEqual(os.environ["CONFIG_MISSING"], "0")

    def test_main_without_env_file(self) -> None:
        """``main`` should not load dotenv when ``ENV_FILE`` is missing."""
        base_prompts = Path(__file__).resolve().parents[1] / "Prompts"
        base_guides = Path(__file__).resolve().parents[1] / "Guidelines"
        with patch.dict(
            os.environ,
            {
                "PROMPTS_DIR": str(base_prompts),
                "GUIDELINES_DIR": str(base_guides),
            },
            clear=True,
        ):
            module = importlib.import_module("run_api")
            with patch.object(module, "uvicorn") as mock_uvicorn, \
                    patch.object(module, "configure_logging") as mock_conf, \
                    patch.object(module, "load_dotenv") as mock_load:
                module.main()
                mock_conf.assert_called_once()
                mock_load.assert_not_called()
                mock_uvicorn.run.assert_called_once_with(
                    module.app,
                    host="0.0.0.0",
                    port=8000,
                    log_config=None,
                    access_log=False,
                )
                self.assertEqual(os.environ["CONFIG_MISSING"], "1")

    def test_main_replaces_missing_stdio(self) -> None:
        """``main`` should create stdio streams when missing."""
        base_prompts = Path(__file__).resolve().parents[1] / "Prompts"
        base_guides = Path(__file__).resolve().parents[1] / "Guidelines"
        with patch.dict(
            os.environ,
            {
                "PROMPTS_DIR": str(base_prompts),
                "GUIDELINES_DIR": str(base_guides),
            },
            clear=True,
        ):
            module = importlib.import_module("run_api")
            import sys
            with patch.object(module, "uvicorn") as mock_uvicorn, \
                    patch.object(module, "configure_logging"), \
                    patch.object(module, "load_dotenv"), \
                    patch.object(sys, "stdout", None), \
                    patch.object(sys, "stderr", None):
                module.main()
                self.assertIsNotNone(sys.stdout)
                self.assertIsNotNone(sys.stderr)
                mock_uvicorn.run.assert_called_once_with(
                    module.app,
                    host="0.0.0.0",
                    port=8000,
                    log_config=None,
                    access_log=False,
                )


if __name__ == "__main__":
    unittest.main()
