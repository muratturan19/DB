"""Entry point to launch the FastAPI API server."""

from __future__ import annotations

from pathlib import Path
import os
import logging
from dotenv import load_dotenv
import uvicorn

from api.logging_config import configure_logging

from api import app


def _load_env() -> None:
    """Load environment variables from ``ENV_FILE`` if provided."""
    env_file = os.environ.get("ENV_FILE")
    if env_file and Path(env_file).is_file():
        load_dotenv(env_file)
        os.environ["CONFIG_MISSING"] = "0"
    else:  # pragma: no cover - config missing path logging
        logging.error("Environment file missing; set ENV_FILE to a valid .env path")
        os.environ["CONFIG_MISSING"] = "1"


def main() -> None:
    """Start the API server."""
    configure_logging()
    _load_env()

    # PyInstaller ile paketlenmiş uygulamalar için uvicorn konfigürasyonu
    import sys

    # stdout/stderr'ın None olması durumunda dummy objeler oluştur
    if sys.stdout is None:
        import io
        sys.stdout = io.StringIO()
    if sys.stderr is None:
        import io
        sys.stderr = io.StringIO()

    # Uvicorn'u logging sorunlarını önleyecek şekilde başlat
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_config=None,  # Uvicorn'un kendi logging config'ini devre dışı bırak
        access_log=False
    )


if __name__ == "__main__":
    main()
