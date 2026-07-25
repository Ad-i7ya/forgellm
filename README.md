<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:000000,50:1a1a2e,100:6366f1&height=220&section=header&text=ForgeLLM&fontSize=60&fontColor=ffffff&animation=fadeIn" width="100%" alt="ForgeLLM Banner"/>
</p>

<p align="center">
  <b>The free coding agent that runs on your infrastructure.</b><br>
  No subscriptions, no API keys, no lock-in.
</p>

<p align="center">
  <a href="https://github.com/Ad-i7ya/forgellm/stargazers">
    <img src="https://img.shields.io/github/stars/Ad-i7ya/forgellm?style=for-the-badge" alt="GitHub Stars"/>
  </a>
  <a href="https://github.com/Ad-i7ya/forgellm/fork">
    <img src="https://img.shields.io/github/forks/Ad-i7ya/forgellm?style=for-the-badge" alt="GitHub Forks"/>
  </a>
  <img src="https://img.shields.io/github/license/Ad-i7ya/forgellm?style=for-the-badge" alt="License"/>
  <img src="https://img.shields.io/github/last-commit/Ad-i7ya/forgellm?style=for-the-badge" alt="Last Commit"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Workers"/>
  <img src="https://img.shields.io/badge/Ollama-Self--hosted-000000?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama"/>
</p>

---

## ✨ Features

- **🧠 Your models, your infra** — Runs on Ollama. Deploy any open-source model on your VPS.
- **🖥️ CLI & Web** — Code from the terminal with `forgellm` or use the web interface.
- **🛠️ 7 specialized tools** — `read_file`, `write_file`, `edit_file`, `run_command`, `list_files`, `web_search`, `spawn_agent`.
- **📡 Streaming responses** — Real-time token-by-token output.
- **🔒 100% private** — Your code never leaves your infrastructure.
- **🌐 Cloudflare Workers** — Serves the web UI globally with low latency.
- **🚀 One-command deploy** — `wrangler deploy` pushes the worker and static assets.

---

## 🚀 Live Demo

The web interface is deployed at:

**👉 [https://forgellm.adi7ya.workers.dev](https://forgellm.adi7ya.workers.dev)**

Available routes:

| Route | Description |
|-------|-------------|
| `/` | Home landing page |
| `/cli` | CLI landing page & install guide |
| `/web` | Web app builder interface |
| `/chat` | Chat with your Ollama models |
| `/desktop` | Desktop app (beta) |
| `/cloud` | Cloud offering (beta) |

---

## 🛠️ Quick Start

### 1. Start your Ollama server

```bash
ollama serve
ollama pull nemotron-3-super:latest  # or your model of choice
```

### 2. Install the CLI

```bash
npm install -g forgellm
```

### 3. Start coding

```bash
cd your-project
forgellm
```

That's it. No API keys, no accounts.

---

## 📦 Deploy Your Own

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

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Ollama host**

   Edit `wrangler.toml` and set `OLLAMA_HOST` to your Ollama URL:

   ```toml
   [vars]
   OLLAMA_HOST = "https://your-ollama-tunnel.trycloudflare.com"
   ```

4. **Deploy**

   ```bash
   npm run deploy
   ```

5. **Set up tunnel (optional, for remote Ollama)**

   ```bash
   cloudflared tunnel create forgellm
   cloudflared tunnel route dns forgellm ollama.your-domain.com
   ```

---

## ⌨️ CLI Commands

| Command | Description |
|---------|-------------|
| `forgellm` | Start interactive chat |
| `forgellm --model <name>` | Use a specific model |
| `forgellm --host <url>` | Custom Ollama URL |
| `/help` | Show available commands |
| `/models` | List available models |
| `/model <name>` | Switch model |
| `/clear` | Clear screen |
| `/exit` | Quit |

---

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Browser    │───▶│  Cloudflare  │───▶│   Ollama     │
│  (Web UI)    │    │   Worker     │    │   (Your VPS) │
└──────────────┘    └──────────────┘    └──────────────┘
       │                                       │
       │  Terminal                             │
       │  (CLI) ───────────────────────────────┘
```

---

##  Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS
- **Backend:** Cloudflare Workers
- **AI:** Ollama (self-hosted)
- **Default model:** nemotron-3-super:latest
- **Tunnel:** Cloudflare Tunnel (optional)
- **CLI:** Node.js + readline

---

## 🤝 Contributing

Contributions are welcome! Fork the repo, make your changes, and submit a PR.

## 📄 License

[MIT](https://opensource.org/licenses/MIT)
