import unittest
from pathlib import Path
from unittest import mock

from PromptManager import PromptManager


class PromptManagerTextTest(unittest.TestCase):
    """Tests for text prompt loading and caching."""

    def setUp(self) -> None:
        self.manager = PromptManager()
        self.base_dir = Path(__file__).resolve().parents[1] / "Prompts"

    def test_get_text_prompt(self) -> None:
        for method in ["5N1K", "A3", "DMAIC", "Ishikawa"]:
            with self.subTest(method=method):
                expected_path = self.base_dir / f"{method}_Prompt.txt"
                with open(expected_path, "r", encoding="utf-8") as f:
                    expected = f.read()
                result = self.manager.get_text_prompt(method)
                self.assertEqual(result, expected)

    def test_load_text_prompt(self) -> None:
        test_file = self.base_dir / "A3_Prompt.txt"
        with open(test_file, "r", encoding="utf-8") as f:
            expected = f.read()
        result = self.manager.load_text_prompt(str(test_file))
        self.assertEqual(result, expected)

    def test_get_text_prompt_caches_result(self) -> None:
        test_file = self.base_dir / "5N1K_Prompt.txt"
        with open(test_file, "r", encoding="utf-8") as f:
            data = f.read()
        with mock.patch("builtins.open", mock.mock_open(read_data=data)) as m:
            first = self.manager.get_text_prompt("5N1K")
            second = self.manager.get_text_prompt("5N1K")
            self.assertEqual(m.call_count, 1)
            self.assertIs(first, second)

    def test_save_and_reset_text_prompt(self) -> None:
        target = self.base_dir / "A3_Prompt.txt"
        backup = target.with_suffix(".bak")
        target.rename(backup)
        try:
            self.manager.save_text_prompt("A3", "test")
            self.assertEqual(self.manager.get_text_prompt("A3"), "test")
            self.manager.reset_text_prompt("A3")
            with open(target, "r", encoding="utf-8") as f:
                restored = f.read()
            default_path = self.base_dir / "default" / "A3_Prompt.txt"
            with open(default_path, "r", encoding="utf-8") as f:
                default = f.read()
            self.assertEqual(restored, default)
        finally:
            backup.rename(target)


if __name__ == "__main__":
    unittest.main()
