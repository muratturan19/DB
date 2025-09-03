import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from Review import Review


class ReviewPromptTest(unittest.TestCase):
    """Tests for Review prompt loading from environment."""

    def setUp(self) -> None:
        root = Path(__file__).resolve().parents[1]
        self.default_prompt = root / "Prompts" / "Fixer_General_Prompt.md"
        with open(self.default_prompt, "r", encoding="utf-8") as f:
            self.default_content = f.read()

    def test_missing_env_var_uses_default(self) -> None:
        os.environ.pop("PROMPTS_DIR", None)
        review = Review()
        self.assertEqual(review.template, self.default_content)

    def test_env_without_prompt_uses_default(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            os.environ["PROMPTS_DIR"] = tmp
            review = Review()
            self.assertEqual(review.template, self.default_content)
        os.environ.pop("PROMPTS_DIR", None)

    def test_loads_from_env_dir(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            custom = Path(tmp) / "Fixer_General_Prompt.md"
            custom.write_text("CUSTOM", encoding="utf-8")
            os.environ["PROMPTS_DIR"] = tmp
            review = Review()
            self.assertEqual(review.template, "CUSTOM")
        os.environ.pop("PROMPTS_DIR", None)

    def test_builtin_prompt_used_when_resource_missing(self) -> None:
        os.environ.pop("PROMPTS_DIR", None)
        with patch("sys.frozen", True, create=True), patch(
            "sys._MEIPASS", "/nonexistent", create=True
        ), patch("os.path.exists", return_value=False):
            review = Review()
            self.assertEqual(review.template, self.default_content)


if __name__ == "__main__":
    unittest.main()
