import os
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi.testclient import TestClient
from dotenv import dotenv_values

from api import app


class SetupEndpointTest(unittest.TestCase):
    """Tests for the /setup endpoint."""

    def setUp(self) -> None:
        self.tmpdir = TemporaryDirectory()
        self.env_path = Path(self.tmpdir.name) / ".env"
        os.environ["ENV_FILE"] = str(self.env_path)
        self.client = TestClient(app)

    def tearDown(self) -> None:
        self.tmpdir.cleanup()
        os.environ.pop("ENV_FILE", None)

    def test_setup_writes_env_file(self) -> None:
        response = self.client.post(
            "/setup",
            json={"apiKey": "sk-test", "excelPath": "/tmp/test.xlsx"},
        )
        self.assertEqual(response.status_code, 200)
        data = dotenv_values(self.env_path)
        self.assertEqual(data.get("OPENAI_API_KEY"), "sk-test")
        self.assertEqual(data.get("COMPLAINTS_XLSX_PATH"), "/tmp/test.xlsx")


if __name__ == "__main__":
    unittest.main()
