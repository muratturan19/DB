import json
import os
import tempfile
from pathlib import Path
import unittest
import unittest.mock

from GuideManager import GuideManager, GuideNotFoundError


class GuideManagerTest(unittest.TestCase):
    """Tests for GuideManager guide loading."""

    def setUp(self) -> None:
        self.base_dir = Path(__file__).resolve().parents[1] / "Guidelines"
        os.environ["GUIDELINES_DIR"] = str(self.base_dir)
        self.manager = GuideManager()

    def tearDown(self) -> None:
        os.environ.pop("GUIDELINES_DIR", None)

    def test_get_format(self) -> None:
        for method in ["5N1K", "8D", "A3", "DMAIC", "Ishikawa"]:
            with self.subTest(method=method):
                expected_path = self.base_dir / f"{method}_Guide.json"
                with open(expected_path, "r", encoding="utf-8") as f:
                    expected = json.load(f)
                result = self.manager.get_format(method)
                self.assertEqual(result, expected)

    def test_missing_env_var_raises(self) -> None:
        """``GUIDELINES_DIR`` must be set."""
        del os.environ["GUIDELINES_DIR"]
        with self.assertRaises(RuntimeError):
            GuideManager().get_format("8D")

    def test_fallback_to_package_files(self) -> None:
        """Missing files in ``GUIDELINES_DIR`` fall back to packaged ones."""
        with tempfile.TemporaryDirectory() as tmp:
            os.environ["GUIDELINES_DIR"] = tmp
            manager = GuideManager()
            expected_path = self.base_dir / "A3_Guide.json"
            with open(expected_path, "r", encoding="utf-8") as f:
                expected = json.load(f)
            result = manager.get_format("A3")
            self.assertEqual(result, expected)
        os.environ["GUIDELINES_DIR"] = str(self.base_dir)

    def test_load_guide(self) -> None:
        test_file = self.base_dir / "5N1K_Guide.json"
        with open(test_file, "r", encoding="utf-8") as f:
            expected = json.load(f)
        result = self.manager.load_guide(str(test_file))
        self.assertEqual(result, expected)

    def test_get_format_caches_result(self) -> None:
        """Repeated calls should not reopen the guideline file."""
        test_file = self.base_dir / "8D_Guide.json"
        with open(test_file, "r", encoding="utf-8") as f:
            data = f.read()

        with unittest.mock.patch(
            "builtins.open", unittest.mock.mock_open(read_data=data)
        ) as mocked_open:
            first = self.manager.get_format("8D")
            second = self.manager.get_format("8D")

            self.assertEqual(mocked_open.call_count, 1)
            self.assertIs(first, second)

    def test_reset_guide_restores_default(self) -> None:
        """``reset_guide`` should copy the default guide back."""
        target = self.base_dir / "8D_Guide.json"
        backup = target.with_suffix(".bak")
        target.rename(backup)
        try:
            with open(target, "w", encoding="utf-8") as f:
                json.dump({"method": "8D", "steps": []}, f)
            self.manager.reset_guide("8D")
            with open(target, "r", encoding="utf-8") as f:
                restored = json.load(f)
            default_path = self.base_dir / "default" / "8D_Guide.json"
            with open(default_path, "r", encoding="utf-8") as f:
                default = json.load(f)
            self.assertEqual(restored, default)
        finally:
            backup.rename(target)

    def test_load_guide_missing_file_raises(self) -> None:
        """``load_guide`` raises ``GuideNotFoundError`` for invalid paths."""
        missing = self.base_dir / "missing.json"
        with self.assertRaises(GuideNotFoundError):
            self.manager.load_guide(str(missing))

    def test_get_format_missing_file_raises(self) -> None:
        """Missing guides should raise ``GuideNotFoundError``."""
        target = self.base_dir / "DMAIC_Guide.json"
        backup = target.with_suffix(".json.bak")
        target.rename(backup)
        try:
            with self.assertRaises(GuideNotFoundError):
                self.manager.get_format("DMAIC")
        finally:
            backup.rename(target)

    def test_get_format_unknown_method_raises(self) -> None:
        with self.assertRaises(GuideNotFoundError):
            self.manager.get_format("UNKNOWN")


if __name__ == "__main__":
    unittest.main()
