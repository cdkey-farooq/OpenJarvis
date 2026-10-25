# FreeLLMAPI + OpenJarvis (optional local integration)

This is an **opt-in** integration for [FreeLLMAPI](https://freellmapi.co/), a self-hosted, OpenAI-compatible router for free-tier model providers. You do not need to modify the main OpenJarvis configuration until you have verified that the router works.

> GitHub stores source code; it does not run FreeLLMAPI or OpenJarvis. Both applications must be installed/running on a machine. FreeLLMAPI is intended for personal, single-user use: do not expose its API or dashboard to the public internet.

## 1. Run FreeLLMAPI

On macOS/Linux/WSL, after installing Docker, follow the [official installation guide](https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/install/01-install.md). The official install command is:

```bash
curl -fsSL https://freellmapi.co/install.sh | bash
```

Review third-party scripts before executing them. On Windows, a desktop installer is available in the [FreeLLMAPI GitHub releases](https://github.com/tashfeenahmed/freellmapi/releases).

Open the **local** FreeLLMAPI dashboard (normally `http://localhost:3001` for Docker installs), add at least one provider's free-tier API key under **Keys**, and configure the fallback chain. Obtain the **unified API key** from the FreeLLMAPI Keys page. A provider key (e.g. from Gemini) is *not* the unified FreeLLMAPI key.

## 2. Install this fork of OpenJarvis

The `freellmapi` engine added in this fork is not necessarily present in upstream OpenJarvis installers. Install from this repository:

```bash
git clone https://github.com/cdkey-farooq/OpenJarvis.git
cd OpenJarvis
uv sync
uv run jarvis init
```

Install `uv` first if needed, as documented in [OpenJarvis installation](install.md). If you already customized your OpenJarvis configuration, skip `jarvis init` rather than overwriting it.

## 3. Connect the engine without committing secrets

On macOS/Linux/WSL:

```bash
export FREELLMAPI_API_KEY="paste-your-unified-key-here"
uv run jarvis ask --engine freellmapi --model auto "Bonjour, présente-toi."
```

On Windows PowerShell (in the `OpenJarvis` folder):

```powershell
$env:FREELLMAPI_API_KEY = "paste-your-unified-key-here"
uv run jarvis ask --engine freellmapi --model auto "Bonjour, présente-toi."
```

The new `freellmapi` engine uses:
- Base host `http://localhost:3001` by default, appending `/v1` internally.
- `FREELLMAPI_API_KEY` for its Bearer token (do not store the key in Git).
- Optional `FREELLMAPI_HOST` if the router runs on a different **trusted** local address; supply the host **without** `/v1`.
- Model `auto` to select from your FreeLLMAPI fallback chain, or a model identifier shown in FreeLLMAPI.

If the quick test works, make the engine the default in your local `~/.openjarvis/config.toml`:

```toml
[engine]
default = "freellmapi"

[intelligence]
default_model = "auto"
```

**Edit those existing sections** rather than duplicating them. You still need the `FREELLMAPI_API_KEY` environment variable whenever Jarvis runs. Changes to `~/.openjarvis/config.toml` are local: they do not need to be pushed to GitHub.

For a quick router health check, open `http://localhost:3001` on the host computer and verify the router is running. If an OpenJarvis query returns a `401`, verify the unified key; if no model can answer, verify the upstream provider keys and fallback chain in FreeLLMAPI.

**Privacy and usage:** FreeLLMAPI forwards prompts to the external model providers you enable. Providers have rate limits and their own terms; "free" does not mean unlimited.
