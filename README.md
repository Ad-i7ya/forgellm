# ForgeLM ⚒️

**The free coding agent that runs on your infrastructure.**

ForgeLM is a completely free, open-source coding assistant that connects to your own Ollama models. Use it via **CLI** in your terminal or through the **Web** interface — no subscriptions, no API keys, no lock-in.

[![GitHub stars](https://img.shields.io/github/stars/Ad-i7ya/forgellm?style=social)](https://github.com/Ad-i7ya/forgellm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Features

- **🧠 Your models, your infra** — Runs on Ollama. Deploy any open-source model on your VPS.
- **🖥️ CLI & Web** — Code from the terminal with `forgelm` or use the web interface.
- **🛠️ 7 specialized tools** — `read_file`, `write_file`, `edit_file`, `run_command`, `list_files`, `web_search`, `spawn_agent`.
- **📡 Streaming responses** — Real-time token-by-token output.
- **🔒 100% private** — Your code never leaves your infrastructure.
- **🌐 Cloudflare Workers** — Serves the web UI globally with low latency.
- **🚀 One-command deploy** — `wrangler deploy` pushes the worker and static assets.

## Quick Start

### 1. Start your Ollama server

```bash
ollama serve
ollama pull nemotron-3-super  # or your model of choice
```

### 2. Install the CLI

```bash
npm install -g forgellm
```

### 3. Start coding

```bash
cd your-project
forgelm
```

That's it. No API keys, no accounts.

## Web Interface

ForgeLM also ships with a web UI served via Cloudflare Workers:

- **`/`** — CLI landing page
- **`/cli`** — CLI landing page with install guide
- **`/web`** — Web app builder interface
- **`/chat`** — Direct chat with your Ollama models

## Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │───▶│  Cloudflare  │───▶│   Ollama     │
│  (Web UI)    │    │   Worker     │    │   (Your VPS) │
└──────────────┘    └──────────────┘    └──────────────┘
       │                                       │
       │  Terminal                             │
       │  (CLI) ───────────────────────────────┘
```

## Deploy Your Own

### Prerequisites

- Node.js 18+
- A Cloudflare account
- A VPS running Ollama
- (Optional) `cloudflared` for tunneling

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/Ad-i7ya/forgellm.git
   cd forgellm
   ```

2. **Configure Ollama host**
   ```bash
   # Edit wrangler.toml and set OLLAMA_HOST to your Ollama URL
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

4. **Set up tunnel (optional, for remote Ollama)**
   ```bash
   cloudflared tunnel create forgellm
   cloudflared tunnel route dns forgellm ollama.your-domain.com
   ```

## CLI Commands

| Command | Description |
|---------|-------------|
| `forgelm` | Start interactive chat |
| `forgelm --model <name>` | Use a specific model |
| `forgelm --host <url>` | Custom Ollama URL |
| `/help` | Show available commands |
| `/models` | List available models |
| `/model <name>` | Switch model |
| `/clear` | Clear screen |
| `/exit` | Quit |

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no frameworks)
- **Backend:** Cloudflare Workers
- **AI:** Ollama (self-hosted)
- **Tunnel:** Cloudflare Tunnel (optional)
- **CLI:** Node.js + readline

## Configuration

All configuration is in `wrangler.toml`:

```toml
[vars]
OLLAMA_HOST = "https://your-ollama-tunnel.trycloudflare.com"
```

## Contributing

Contributions are welcome! Fork the repo, make your changes, and submit a PR.

## License

MIT
