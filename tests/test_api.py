import os
import unittest
from unittest.mock import patch

# flake8: noqa

from fastapi.testclient import TestClient
import tempfile
from pathlib import Path
from ComplaintSearch import ComplaintStore
from LLMAnalyzer import OpenAIError

base_prompts = Path(__file__).resolve().parents[1] / "Prompts"
base_guides = Path(__file__).resolve().parents[1] / "Guidelines"
os.environ.setdefault("PROMPTS_DIR", str(base_prompts))
os.environ.setdefault("GUIDELINES_DIR", str(base_guides))

import api  # noqa: E402


class APITest(unittest.TestCase):
    """Tests for FastAPI endpoints."""

    def setUp(self) -> None:
        self.client = TestClient(api.app, raise_server_exceptions=False)

    def test_cors_preflight(self) -> None:
        """OPTIONS request should include CORS headers."""
        response = self.client.options(
            "/analyze",
            headers={
                "Origin": "http://example.com",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertIn(response.status_code, {200, 204})
        self.assertIn("access-control-allow-origin", response.headers)

    def test_analyze_endpoint(self) -> None:
        payload = {
            "details": {"complaint": "c"},
            "guideline": {"fields": []},
            "directives": "",
            "language": "Türkçe",
        }
        with patch.object(
            api.analyzer, "analyze", return_value={"ok": 1}
        ) as mock_analyze:
            response = self.client.post("/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"ok": 1})
        mock_analyze.assert_called_with(
            payload["details"],
            payload["guideline"],
            "",
            "Türkçe",
        )

    def test_analyze_logging(self) -> None:
        payload = {
            "details": {"complaint": "c"},
            "guideline": {"fields": []},
            "directives": "",
            "language": "Türkçe",
        }
        with patch.object(api.analyzer, "analyze", return_value={"ok": 1}):
            with self.assertLogs("api", level="INFO") as cm:
                response = self.client.post("/analyze", json=payload)
        self.assertEqual(response.status_code, 200)
        logs = "\n".join(cm.output)
        self.assertIn("Analyze request body", logs)
        self.assertIn("Analyze result", logs)

    def test_analyze_endpoint_error(self) -> None:
        payload = {
            "details": {},
            "guideline": {},
            "directives": "",
            "language": "Türkçe",
        }
        with patch.object(api.analyzer, "analyze", side_effect=OpenAIError("fail")):
            response = self.client.post("/analyze", json=payload)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["detail"], "fail")

    def test_review_endpoint(self) -> None:
        body = {"text": "t", "context": {"a": "b"}}
        with patch.object(api.reviewer, "perform", return_value="r") as mock_perf:
            response = self.client.post("/review", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"result": "r"})
        mock_perf.assert_called_with("t", a="b")

    def test_report_endpoint(self) -> None:
        body = {"analysis": {}, "complaint_info": {}, "output_dir": "."}
        paths = {"pdf": "/tmp/p.pdf", "excel": "/tmp/e.xlsx"}
        with patch.object(api.reporter, "generate", return_value=paths) as mock_gen:
            response = self.client.post("/report", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"pdf": "/reports/p.pdf", "excel": "/reports/e.xlsx"},
        )
        mock_gen.assert_called_with({}, {}, api.REPORT_DIR)

    def test_report_endpoint_error(self) -> None:
        """Errors from ``ReportGenerator`` should return HTTP 500."""
        body = {"analysis": {}, "complaint_info": {}, "output_dir": "."}
        with patch.object(api.reporter, "generate", side_effect=RuntimeError("boom")):
            with self.assertLogs("api", level="ERROR") as cm:
                response = self.client.post("/report", json=body)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["detail"], "boom")
        self.assertIn("Report generation failed", "\n".join(cm.output))

    def test_reports_static_mount(self) -> None:
        tmp_file = api.REPORT_DIR / "test.txt"
        tmp_file.write_text("hi")
        try:
            response = self.client.get(f"/reports/{tmp_file.name}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.content, b"hi")
        finally:
            tmp_file.unlink()

    def test_complaints_endpoint(self) -> None:
        params = {"keyword": "k", "customer": "c"}
        with patch.object(
            api._store, "search", return_value=[{"id": 1}]
        ) as mock_store, patch.object(
            api._excel_searcher, "search", return_value=[{"id": 2}]
        ) as mock_excel:
            response = self.client.get("/complaints", params=params)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"store": [{"id": 1}], "excel": [{"id": 2}]})
        mock_store.assert_called_with("k")
        mock_excel.assert_called_with(
            {"Müşteri Adı": "c"}, None, start_year=None, end_year=None
        )

    def test_complaints_endpoint_year_range(self) -> None:
        params = {"customer": "c", "start_year": 2020, "end_year": 2022}
        with patch.object(api._excel_searcher, "search", return_value=[]) as mock_excel:
            response = self.client.get("/complaints", params=params)
        self.assertEqual(response.status_code, 200)
        mock_excel.assert_called_with(
            {"Müşteri Adı": "c"}, None, start_year=2020, end_year=2022
        )

    def test_complaints_extra_filters_forwarded(self) -> None:
        params = {"foo": "bar", "customer": "c"}
        with patch.object(api._store, "search") as mock_store, patch.object(
            api._excel_searcher, "search", return_value=[]
        ) as mock_excel:
            response = self.client.get("/complaints", params=params)
        self.assertEqual(response.status_code, 200)
        mock_store.assert_not_called()
        mock_excel.assert_called_with(
            {"foo": "bar", "Müşteri Adı": "c"}, None, start_year=None, end_year=None
        )

    def test_complaints_alias_turkish_key(self) -> None:
        params = {"Müşteri Adı": "c"}
        with patch.object(api._excel_searcher, "search", return_value=[]) as mock_excel:
            response = self.client.get("/complaints", params=params)
        self.assertEqual(response.status_code, 200)
        mock_excel.assert_called_with(
            {"Müşteri Adı": "c"}, None, start_year=None, end_year=None
        )

    def test_options_endpoint(self) -> None:
        with patch.object(
            api._excel_searcher,
            "unique_values",
            return_value=["a", "b"],
        ) as mock_opts:
            response = self.client.get("/options/customer")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"values": ["a", "b"]})
        mock_opts.assert_called_with("Müşteri Adı")

    def test_guide_endpoint(self) -> None:
        with patch.object(
            api._guide_manager,
            "get_format",
            return_value={"method": "8D"},
        ) as mock_get:
            with self.assertLogs("api", level="DEBUG") as cm:
                response = self.client.get("/guide/8D")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"method": "8D"})
        mock_get.assert_called_with("8D")
        logs = "\n".join(cm.output)
        self.assertIn("Guide method", logs)
        self.assertIn("Guide result", logs)

    def test_scan_8d_endpoint(self) -> None:
        with patch.object(api._scanner, "scan", return_value=5) as mock_scan:
            response = self.client.post("/scan_8d")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "count": 5})
        mock_scan.assert_called_once()

    def test_add_complaint_endpoint(self) -> None:
        body = {"complaint": "c", "customer": "cust", "subject": "s", "part_code": "p"}
        with patch.object(api._store, "add_complaint") as mock_add:
            response = self.client.post("/complaints", json=body)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        mock_add.assert_called_with(body)

    def test_review_endpoint_error(self) -> None:
        body = {"text": "t", "context": {}}
        with patch.object(api.reviewer, "perform", side_effect=Exception("boom")):
            response = self.client.post("/review", json=body)
        self.assertEqual(response.status_code, 500)
        self.assertIn("boom", response.json()["detail"])

    def test_complaints_endpoint_error(self) -> None:
        with patch.object(
            api._excel_searcher, "search", side_effect=ValueError("fail")
        ):
            response = self.client.get("/complaints", params={"customer": "c"})
        self.assertEqual(response.status_code, 500)

    def test_complaint_persistence(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            store = ComplaintStore(Path(tmpdir) / "c.json")
            with patch.object(api, "_store", store):
                body = {
                    "complaint": "n",
                    "customer": "AC",
                    "subject": "s",
                    "part_code": "p",
                }
                add_resp = self.client.post("/complaints", json=body)
                self.assertEqual(add_resp.status_code, 200)
                resp = self.client.get("/complaints", params={"keyword": "n"})
            self.assertEqual(resp.status_code, 200)
            self.assertEqual(resp.json()["store"], [body])


if __name__ == "__main__":
    unittest.main()
