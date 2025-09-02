"""Interactive helper to create or update the `.env` file."""

from __future__ import annotations

from pathlib import Path
from dotenv import set_key


ENV_PATH = Path(".env")


def main() -> None:
    """Prompt for configuration values and store them in ``.env``."""
    api_key = input("OpenAI API key: ").strip()
    complaints_path = input("Path to F160_Customer_Claims.xlsx: ").strip()
    model_choice = input(
        "OpenAI Model (1: gpt-4o, 2: gpt-4o-mini, 3: gpt-4-turbo, 4: gpt-3.5-turbo): "
    ).strip()
    models = {
        "1": "gpt-4o",
        "2": "gpt-4o-mini",
        "3": "gpt-4-turbo",
        "4": "gpt-3.5-turbo",
    }
    model_name = models.get(model_choice, "gpt-4o")

    ENV_PATH.touch(exist_ok=True)
    set_key(str(ENV_PATH), "OPENAI_API_KEY", api_key)
    set_key(str(ENV_PATH), "COMPLAINTS_XLSX_PATH", complaints_path)
    set_key(str(ENV_PATH), "OPENAI_MODEL", model_name)
    print(f"Configuration written to {ENV_PATH}")


if __name__ == "__main__":
    main()
