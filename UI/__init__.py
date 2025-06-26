"""User interface utilities."""

from typing import List, Optional
import subprocess
import sys
from pathlib import Path


def run_streamlit() -> None:
    """Launch the Streamlit application.

    When running from a PyInstaller-built executable, execute Streamlit's CLI
    directly in-process to avoid missing metadata errors.
    """
    from . import streamlit_app

    script = Path(streamlit_app.__file__).resolve()
    if getattr(sys, "frozen", False):
        sys.argv = ["streamlit", "run", str(script)]
        import streamlit.web.cli as stcli
        stcli.main()
    else:
        subprocess.run(["streamlit", "run", str(script)], check=True)


def run_cli(args: Optional[List[str]] = None) -> None:
    """Run the CLI application with optional ``args``.

    The CLI module is imported lazily to avoid the overhead at package import
    time.
    """
    from .cli import main

    main(args)


class UI:
    """Handles user interactions and supports quality-report methods."""

    def start(self) -> None:
        """Start the CLI."""
        run_cli()


__all__ = ["UI", "run_cli", "run_streamlit"]
