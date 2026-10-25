"""Telemetry uses existing authentication and never advertises an untested model."""

from __future__ import annotations

import sys
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

pytest.importorskip("fastapi")
from fastapi import FastAPI
from fastapi.testclient import TestClient

from openjarvis.server.auth_middleware import AuthMiddleware
from openjarvis.server.command_center import router


def make_client():
    app = FastAPI()
    app.state.engine_name = "freellmapi"
    app.state.model = "auto"
    app.state.agent_name = "simple"
    app.state.session_start = 0
    app.include_router(router)
    app.add_middleware(AuthMiddleware, api_key="local-test-token")
    return TestClient(app)


def test_command_center_requires_existing_api_auth():
    client = make_client()
    assert client.get("/v1/command-center").status_code == 401
    assert (
        client.get(
            "/v1/command-center", headers={"Authorization": "Bearer wrong"}
        ).status_code
        == 401
    )


def test_command_center_samples_metrics_without_contacting_engine(monkeypatch):
    cpu = MagicMock(return_value=12.5)
    fake = SimpleNamespace(
        cpu_percent=cpu,
        virtual_memory=lambda: SimpleNamespace(percent=40.5),
        Process=lambda: SimpleNamespace(
            memory_info=lambda: SimpleNamespace(rss=64 * 1024 * 1024)
        ),
    )
    monkeypatch.setitem(sys.modules, "psutil", fake)
    response = make_client().get(
        "/v1/command-center", headers={"Authorization": "Bearer local-test-token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["cpu_percent"] == 12.5
    assert data["ram_percent"] == 40.5
    assert data["process_ram_mb"] == 64
    assert data["engine"] == "freellmapi"
    assert data["model"] == "auto"
    assert "available" not in data
    assert "api_key" not in data
    cpu.assert_called_once_with(interval=0.1)


def test_command_center_missing_metrics_are_null(monkeypatch):
    monkeypatch.setitem(sys.modules, "psutil", None)
    response = make_client().get(
        "/v1/command-center", headers={"Authorization": "Bearer local-test-token"}
    )
    data = response.json()
    assert response.status_code == 200
    assert data["cpu_percent"] is None
    assert data["ram_percent"] is None
    assert data["process_ram_mb"] is None
