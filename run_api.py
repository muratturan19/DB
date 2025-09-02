"""Entry point to launch the FastAPI API server."""

from __future__ import annotations

from pathlib import Path
import os
from dotenv import load_dotenv
import uvicorn

from api.logging_config import configure_logging

from api import app


def _load_env() -> None:
    """Load environment variables from ``.env`` file."""
    env_file = os.environ.get("ENV_FILE")
    if env_file and Path(env_file).is_file():
        load_dotenv(env_file)
        return
    appdata = os.getenv("APPDATA")
    if appdata:
        default_env = Path(appdata) / "DB-App" / ".env"
        if default_env.is_file():
            load_dotenv(default_env)
            return
    load_dotenv()


def main() -> None:
    """Start the API server."""
    configure_logging()
    _load_env()
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
