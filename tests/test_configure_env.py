import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from dotenv import dotenv_values
import configure_env


class ConfigureEnvTest(unittest.TestCase):
    """Tests for the ``configure_env`` helper."""

    def test_model_saved(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            env_path = Path(tmpdir) / ".env"
            with patch.object(configure_env, "ENV_PATH", env_path):
                with patch(
                    "builtins.input", side_effect=["k", "c.xlsx", "2"],
                ):
                    configure_env.main()
                    data = dotenv_values(env_path)
            self.assertEqual(data.get("OPENAI_MODEL"), "gpt-4o-mini")
            self.assertEqual(data.get("OPENAI_API_KEY"), "k")
            self.assertEqual(data.get("COMPLAINTS_XLSX_PATH"), "c.xlsx")


if __name__ == "__main__":
    unittest.main()
