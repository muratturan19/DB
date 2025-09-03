import os
import tempfile
import unittest
from pathlib import Path

from Review import Review


class ReviewPromptTest(unittest.TestCase):
    """Tests for Review prompt loading from environment."""

    def setUp(self) -> None:
        self.default_prompt = (
            Path(__file__).resolve().parents[1]
            / "Prompts"
            / "Fixer_General_Prompt.md"
        )
        with open(self.default_prompt, "r", encoding="utf-8") as f:
            self.default_content = f.read()

    def test_missing_env_var_raises(self) -> None:
        os.environ.pop("PROMPTS_DIR", None)
        with self.assertRaises(RuntimeError):
            Review()

    def test_fallback_to_package_files(self) -> None:
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


if __name__ == "__main__":
    unittest.main()
