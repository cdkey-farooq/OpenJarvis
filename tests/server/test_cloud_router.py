"""Regression tests for OpenRouter model ID normalization."""

from __future__ import annotations

import pytest

from openjarvis.core.types import Message
from openjarvis.server import cloud_router


def test_get_provider_detects_bare_openrouter_id():
    assert cloud_router.get_provider("anthropic/claude-haiku-4.5") == "openrouter"


def test_get_provider_detects_litellm_prefixed_openrouter_id():
    model = "openrouter/anthropic/claude-haiku-4.5"
    assert cloud_router.get_provider(model) == "openrouter"


@pytest.mark.parametrize(
    "requested_model,expected_forwarded_model",
    [
        ("anthropic/claude-haiku-4.5", "anthropic/claude-haiku-4.5"),
        ("openrouter/anthropic/claude-haiku-4.5", "anthropic/claude-haiku-4.5"),
        ("openrouter/auto", "openrouter/auto"),
    ],
)
@pytest.mark.asyncio
async def test_stream_cloud_normalizes_openrouter_model_before_forwarding(
    monkeypatch, requested_model, expected_forwarded_model
):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    captured: dict[str, str] = {}

    async def fake_stream_openai(model, messages, temperature, max_tokens, **kwargs):
        captured["model"] = model
        yield "ok"

    monkeypatch.setattr(cloud_router, "_stream_openai", fake_stream_openai)

    tokens = [
        token
        async for token in cloud_router.stream_cloud(
            requested_model, [Message(role="user", content="hi")]
        )
    ]

    assert tokens == ["ok"]
    assert captured["model"] == expected_forwarded_model


@pytest.mark.parametrize("model", ["gemini-2.5-flash", "gpt-4o", "auto"])
def test_freellmapi_models_preserve_configured_router(model):
    from openjarvis.engine.openai_compat_engines import FreeLLMAPIEngine
    from openjarvis.server.routes import _uses_direct_cloud_router

    engine = FreeLLMAPIEngine()
    try:
        assert _uses_direct_cloud_router(engine, model) is False
    finally:
        engine.close()


def test_cloud_models_still_use_direct_router_with_other_engines():
    from types import SimpleNamespace

    from openjarvis.server.routes import _uses_direct_cloud_router

    assert (
        _uses_direct_cloud_router(
            SimpleNamespace(engine_id="ollama"), "gemini-2.5-flash"
        )
        is True
    )
