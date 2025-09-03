import tempfile
from pathlib import Path
import unittest
from unittest.mock import patch
import os
from fpdf import FPDF
from openpyxl import Workbook

from GuideManager import GuideManager
from ReportGenerator import ReportGenerator


class ReportGeneratorTest(unittest.TestCase):
    """Tests for ReportGenerator.generate."""

    def setUp(self) -> None:
        base_dir = Path(__file__).resolve().parents[1] / "Guidelines"
        os.environ["GUIDELINES_DIR"] = str(base_dir)
        self.manager = GuideManager()
        self.generator = ReportGenerator(self.manager)

    def tearDown(self) -> None:
        del os.environ["GUIDELINES_DIR"]

    def test_generate_creates_files(self) -> None:
        analysis = {"Step1": {"response": "foo"}, "Step2": {"response": "bar"}}
        info = {"customer": "cust", "subject": "sub", "part_code": "code"}
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = self.generator.generate(analysis, info, tmpdir)
            pdf_path = Path(paths["pdf"])
            excel_path = Path(paths["excel"])
            self.assertTrue(pdf_path.exists())
            self.assertTrue(excel_path.exists())

    def test_generate_unique_paths(self) -> None:
        """Consecutive calls should produce different file names."""
        analysis = {"Step1": {"response": "foo"}}
        info = {"customer": "c"}
        with tempfile.TemporaryDirectory() as tmpdir:
            first = self.generator.generate(analysis, info, tmpdir)
            second = self.generator.generate(analysis, info, tmpdir)
            self.assertNotEqual(first["pdf"], second["pdf"])
            self.assertNotEqual(first["excel"], second["excel"])

    def test_generate_handles_unicode(self) -> None:
        """PDF creation should not fail with non-Latin characters."""
        analysis = {"Adım1": {"response": "İşlem tamam"}}
        info = {"customer": "Müşteri", "subject": "Konu", "part_code": "K001"}
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = self.generator.generate(analysis, info, tmpdir)
            self.assertTrue(Path(paths["pdf"]).exists())
            self.assertTrue(Path(paths["excel"]).exists())

    def test_generate_template_uses_manager(self) -> None:
        """``generate_template`` should fetch the correct format via ``GuideManager``."""
        expected = {"fields": []}
        method = "8D"
        with patch.object(GuideManager, "get_format", return_value=expected) as mock_get:
            generator = ReportGenerator(self.manager)
            result = generator.generate_template(method)
            mock_get.assert_called_with(method)
            self.assertEqual(result, expected)

    def test_generate_missing_font_raises(self) -> None:
        """An informative error should be raised when font files are absent."""
        analysis = {"Step": {"response": "foo"}}
        info = {"customer": "c"}
        with tempfile.TemporaryDirectory() as tmpdir, \
             patch.object(Path, "exists", return_value=False):
            with self.assertRaises(FileNotFoundError):
                self.generator.generate(analysis, info, tmpdir)

    def test_generate_uses_env_font(self) -> None:
        """``FONT_PATH`` should override the default font location."""
        analysis = {"Step": {"response": "foo"}}
        info = {"customer": "c"}
        font = Path(__file__).resolve().parents[1] / "Fonts" / "DejaVuSans.ttf"
        called = []

        original_add_font = FPDF.add_font

        def wrapped_add_font(self, family, style="", fname="", uni=False):
            called.append(fname)
            return original_add_font(self, family, style, fname, uni)

        with tempfile.TemporaryDirectory() as tmpdir, \
             patch.dict(os.environ, {"FONT_PATH": str(font)}, clear=False), \
             patch.object(FPDF, "add_font", new=wrapped_add_font):
            self.generator.generate(analysis, info, tmpdir)

        self.assertEqual(Path(called[0]), font)

    def test_generate_uses_epw_if_available(self) -> None:
        """``epw`` attribute should control cell width when present."""
        analysis = {"Step": {"response": "foo"}}
        info = {"customer": "c"}

        class DummyPDF(FPDF):
            def __init__(self) -> None:
                super().__init__()
                self.logged_widths = []

            @property
            def epw(self) -> int:
                return 42

            def multi_cell(self, w, h, text='', *args, **kwargs):
                self.logged_widths.append(w)
                kwargs.setdefault('txt', text)
                return super().multi_cell(w, h, **kwargs)

        dummy = DummyPDF()

        with tempfile.TemporaryDirectory() as tmpdir, \
             patch('ReportGenerator.FPDF', return_value=dummy):
            self.generator.generate(analysis, info, tmpdir)

        self.assertIn(dummy.epw, dummy.logged_widths)

    def test_generate_accepts_string_values(self) -> None:
        """String values in analysis should be handled gracefully."""
        analysis = {"summary": "ok", "Step": {"response": "foo"}}
        info = {"customer": "c"}
        with tempfile.TemporaryDirectory() as tmpdir:
            paths = self.generator.generate(analysis, info, tmpdir)
            self.assertTrue(Path(paths["pdf"]).exists())
            self.assertTrue(Path(paths["excel"]).exists())

    def test_generate_deduplicates_lines(self) -> None:
        """Repeated content should appear only once in the PDF."""
        analysis = {"full_text": "dup", "full_report": {"response": "dup"}}
        info: dict[str, str] = {}

        class CapturePDF(FPDF):
            def __init__(self) -> None:
                super().__init__()
                self.lines: list[str] = []

            def multi_cell(self, w, h, text='', *args, **kwargs):  # type: ignore[override]
                self.lines.append(kwargs.get('txt', text))
                kwargs.setdefault('txt', text)
                return super().multi_cell(w, h, **kwargs)

        pdf = CapturePDF()

        with tempfile.TemporaryDirectory() as tmpdir, \
             patch('ReportGenerator.FPDF', return_value=pdf):
            self.generator.generate(analysis, info, tmpdir)

        occurrences = [line for line in pdf.lines if 'dup' in line]
        self.assertEqual(len(occurrences), 1)

    def test_generate_logs_on_pdf_error(self) -> None:
        """Errors during PDF output should be logged and re-raised."""
        analysis = {"Step": {"response": "foo"}}
        info = {"customer": "c"}
        with tempfile.TemporaryDirectory() as tmpdir, \
             patch.object(FPDF, "output", side_effect=OSError("boom")), \
             self.assertLogs("ReportGenerator", level="ERROR") as log:
            with self.assertRaises(OSError):
                self.generator.generate(analysis, info, tmpdir)

        self.assertIn("Failed to create report file", "\n".join(log.output))

    def test_generate_logs_on_excel_error(self) -> None:
        """Errors during Excel save should be logged and re-raised."""
        analysis = {"Step": {"response": "foo"}}
        info = {"customer": "c"}
        with tempfile.TemporaryDirectory() as tmpdir, \
             patch.object(Workbook, "save", side_effect=OSError("boom")), \
             self.assertLogs("ReportGenerator", level="ERROR") as log:
            with self.assertRaises(OSError):
                self.generator.generate(analysis, info, tmpdir)

        self.assertIn("Failed to create report file", "\n".join(log.output))


if __name__ == "__main__":
    unittest.main()
