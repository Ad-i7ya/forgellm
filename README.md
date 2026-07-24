<div align="center">

# ⚒️ ForgeLM

**Your AI-Powered Coding Companion**

*Chat with language models on your own infrastructure — private, fast, and free.*

[![Deploy to Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://dash.cloudflare.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Ollama](https://img.shields.io/badge/Ollama-0.32+-blue?logo=ollama)](https://ollama.ai)

---

</div>

## ✨ Features

- **💬 Chat with AI** — Stream responses token-by-token in real-time
- **🔒 Private by Design** — Your models run on your VPS, no data leaves your control
- **⚡ Blazing Fast** — Cloudflare Workers edge network with zero cold starts
- **🎨 Beautiful UI** — Dark/light themes, smooth animations, syntax-highlighted code
- **📝 Conversation History** — All chats saved locally in your browser
- **🔄 Multiple Models** — Switch between any Ollama models on the fly
- **🌐 Cloudflare-Powered** — Static hosting + API proxy on the edge
- **🔐 Secure Tunnel** — Cloudflare Tunnel keeps your VPS private (no open ports)

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Cloudflare      │────▶│  Cloudflare      │────▶│  Your VPS   │
│  (You/User) │     │  Edge Network    │     │  Worker (API)    │     │  Ollama     │
└─────────────┘     └──────────────────┘     └──────────────────┘     └─────────────┘
                                                                       │ LLM Models  │
                                                                       └─────────────┘
                                                              ▲
                                                              │ (private tunnel)
                                                         ┌──────────┐
                                                         │cloudflared│
                                                         └──────────┘

- Frontend: Static site served by Cloudflare Workers (from ./src/)
- API: Cloudflare Worker proxies /api/* requests to your VPS Ollama
- Tunnel: cloudflared creates a private outbound-only connection from VPS to Cloudflare
- Backend: Ollama runs nemotron-3-super (or any model) on your VPS
```

## 🚀 Quick Start

### Prerequisites

- **Cloudflare account** (free tier works)
- **VPS** with Ollama installed and models pulled
- **Node.js** 18+ and npm

### 1. Clone & Install

```bash
git clone https://github.com/Ad-i7ya/forgellm.git
cd forgellm
npm install
```

### 2. Set Up Cloudflare Tunnel (on your VPS)

SSH into your VPS and:

```bash
# Install cloudflared
# (see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)

# Authenticate
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create forgellm-ollama

# Route DNS (replace with your domain)
cloudflared tunnel route dns forgellm-ollama ollama.your-domain.com

# Run the tunnel (it forwards to your local Ollama at localhost:11434)
cloudflared tunnel run forgellm-ollama
```

> For persistent setup, install as a systemd service. See [docs/TUNNEL.md](docs/TUNNEL.md).

### 3. Configure & Deploy

```bash
# Set your Ollama tunnel URL as a secret
npx wrangler secret put OLLAMA_HOST
# Enter: https://ollama.your-domain.com

# Deploy to Cloudflare Workers
npm run deploy
```

### 4. Visit Your ForgeLM

```
https://forgellm.<your-subdomain>.workers.dev
```

## 🛠️ Local Development

```bash
# Start wrangler dev server (with Ollama running locally)
npm run dev
```

This starts a local dev server at `http://localhost:8787`. Make sure Ollama is running on your machine (`ollama serve`).

## 📁 Project Structure

```
forgellm/
├── src/                          # Static frontend assets
│   ├── index.html                # Main HTML page
│   ├── styles.css                # Complete styling (dark/light themes)
│   └── app.js                    # Client-side chat application
├── worker.js                     # Cloudflare Worker (API proxy + static server)
├── wrangler.toml                 # Wrangler deployment configuration
├── package.json                  # Dependencies & scripts
├── docs/
│   ├── ARCHITECTURE.md           # Detailed architecture documentation
│   └── TUNNEL.md                 # Cloudflare Tunnel setup guide
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD
├── README.md                     # This file
├── LICENSE                       # MIT license
└── .gitignore
```

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_HOST` | URL of your Ollama instance (set as secret) | `http://ollama.internal:11434` |

## 🤖 Available Models

ForgeLM auto-detects all models available in your Ollama instance. Currently on your VPS:

| Model | Size |
|-------|------|
| nemotron-3-super | 123.6B (Q4_K_M) |
| deepseek-r1:70b | 70.6B (Q4_K_M) |
| deepseek-coder-v2 | 15.7B (Q4_0) |
| llama3.1:70b | 70.6B (Q4_K_M) |
| gemma4:26b | 25.8B (Q4_K_M) |
| And more... | |

## 🧪 Testing

Visit your deployed URL and:
1. The model selector should list all your Ollama models
2. Type a coding prompt and watch streaming responses
3. Try dark/light theme toggle
4. Create multiple conversations via "New Chat"
5. Delete conversations with the trash icon

## 🔒 Security

- **No open ports**: Cloudflare Tunnel creates an outbound-only connection
- **No data leaks**: Your prompts stay between you and your VPS
- **CORS protected**: The Worker only allows browser-based access
- **Immutable infrastructure**: Deploy with confidence via CI/CD

## 📄 License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
Built with ❤️ by <a href="https://github.com/Ad-i7ya">Aditya</a>
</div>
