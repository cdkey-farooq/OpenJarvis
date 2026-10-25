"""Read-only telemetry for the personal JARVIS command center.

Reports backend configuration, not provider availability. No keys, paths,
environment variables, tool execution or external network calls are exposed.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Request

router = APIRouter(prefix="/v1", tags=["command-center"])


@router.get("/command-center")
def command_center(request: Request) -> dict:
    """Sample server metrics without blocking the event loop or CPU sampler."""
    cpu = ram = process_ram = None
    try:
        import psutil

        # A short interval in FastAPI's worker thread gives a meaningful first
        # sample without blocking the ASGI event loop.
        cpu = psutil.cpu_percent(interval=0.1)
        ram = psutil.virtual_memory().percent
        process_ram = psutil.Process().memory_info().rss / (1024 * 1024)
    except (ImportError, OSError, RuntimeError):
        # Missing telemetry must never break conversation or become fake zeroes.
        pass
    except psutil.Error:
        pass
    state = request.app.state
    return {
        "engine": getattr(state, "engine_name", ""),
        "model": getattr(state, "model", ""),
        "agent": getattr(state, "agent_name", None),
        "cpu_percent": cpu,
        "ram_percent": ram,
        "process_ram_mb": process_ram,
        "uptime_seconds": max(0, time.time() - state.session_start),
    }
