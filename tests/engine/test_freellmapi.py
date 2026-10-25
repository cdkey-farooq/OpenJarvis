"""FreeLLMAPI opt-in OpenAI-compatible engine integration."""

from __future__ import annotations

import json

import httpx

from openjarvis.core.types import Message, Role
from openjarvis.engine.openai_compat_engines import FreeLLMAPIEngine


def test_freellmapi_defaults_and_bearer_auth(monkeypatch) -> None:
    monkeypatch.delenv("FREELLMAPI_HOST", raising=False)
    monkeypatch.setenv("FREELLMAPI_API_KEY", "test-unified-key")
    engine = FreeLLMAPIEngine()
    assert engine._host == "http://localhost:3001"

    def respond(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v1/chat/completions"
        assert request.headers["authorization"] == "Bearer test-unified-key"
        body = json.loads(request.content)
        assert body["model"] == "auto"
        return httpx.Response(
            200,
            json={
                "model": "auto",
                "choices": [{"message": {"content": "Bonjour !"}, "finish_reason": "stop"}],
                "usage": {"prompt_tokens": 1, "completion_tokens": 2},
            },
        )

    engine._client.close()
    engine._client = httpx.Client(
        base_url=engine._host,
        headers=engine._headers,
        transport=httpx.MockTransport(respond),
    )
    try:
        response = engine.generate([Message(role=Role.USER, content="Bonjour")], model="auto")
        assert response["content"] == "Bonjour !"
    finally:
        engine.close()


def test_freellmapi_host_override(monkeypatch) -> None:
    monkeypatch.setenv("FREELLMAPI_HOST", "http://127.0.0.1:3010")
    monkeypatch.delenv("FREELLMAPI_API_KEY", raising=False)
    engine = FreeLLMAPIEngine()
    try:
        assert engine._host == "http://127.0.0.1:3010"
    finally:
        engine.close()
