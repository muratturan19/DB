import importlib
import os
import tempfile
import unittest
from unittest.mock import patch


class RunAPITest(unittest.TestCase):
    """Tests for the ``run_api`` entry point."""

    def test_main_with_env_file(self) -> None:
        """``main`` should load dotenv when ``ENV_FILE`` exists."""
        with tempfile.TemporaryDirectory() as tmpdir:
            env_path = os.path.join(tmpdir, ".env")
            with open(env_path, "w", encoding="utf-8") as fh:
                fh.write("OPENAI_API_KEY=key")
            with patch.dict(os.environ, {"ENV_FILE": env_path}, clear=True):
                module = importlib.import_module("run_api")
                with patch.object(module, "uvicorn") as mock_uvicorn, \
                        patch.object(module, "configure_logging") as mock_conf, \
                        patch.object(module, "load_dotenv") as mock_load:
                    module.main()
                    mock_conf.assert_called_once()
                    mock_load.assert_called_once_with(env_path)
                    mock_uvicorn.run.assert_called_once_with(
                        module.app, host="0.0.0.0", port=8000
                    )
                    self.assertEqual(os.environ["CONFIG_MISSING"], "0")

    def test_main_without_env_file(self) -> None:
        """``main`` should not load dotenv when ``ENV_FILE`` is missing."""
        with patch.dict(os.environ, {}, clear=True):
            module = importlib.import_module("run_api")
            with patch.object(module, "uvicorn") as mock_uvicorn, \
                    patch.object(module, "configure_logging") as mock_conf, \
                    patch.object(module, "load_dotenv") as mock_load:
                module.main()
                mock_conf.assert_called_once()
                mock_load.assert_not_called()
                mock_uvicorn.run.assert_called_once_with(
                    module.app, host="0.0.0.0", port=8000
                )
                self.assertEqual(os.environ["CONFIG_MISSING"], "1")


if __name__ == "__main__":
    unittest.main()
