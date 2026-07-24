# 🏗️ ForgeLM Architecture

## Overview

ForgeLM is a serverless AI chat application that connects a browser-based chat interface to locally-hosted LLMs via Ollama, using Cloudflare's edge network as a secure proxy layer.

## System Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Internet                                        │
│  ┌──────────┐    ┌──────────────────┐    ┌────────────────────────┐     │
│  │ Browser  │───▶│ Cloudflare Edge  │───▶│ Cloudflare Worker     │     │
│  │ (User)   │◀───│ (CDN + Proxy)    │◀───│ (forgellm)            │     │
│  └──────────┘    └──────────────────┘    └────────────────────────┘     │
│                                                  │                       │
│                                          ┌───────┴────────┐             │
│                                          │  /api/* routes  │             │
│                                          │  proxied to     │             │
│                                          │  Ollama backend │             │
│                                          └───────┬────────┘             │
│                                                  │                       │
│                                      Cloudflare Tunnel                   │
│                                      (private, outbound-only)            │
│                                                  │                       │
│                                          ┌───────┴────────┐             │
│                                          │   Your VPS     │             │
│                                          │  ┌──────────┐  │             │
│                                          │  │ Ollama   │  │             │
│                                          │  │ Server   │  │             │
│                                          │  │ Port 11434│  │             │
│                                          │  └──────────┘  │             │
│                                          │  ┌──────────┐  │             │
│                                          │  │cloudflared│  │             │
│                                          │  │ Tunnel   │  │             │
│                                          │  └──────────┘  │             │
│                                          └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User sends a message** → Browser sends POST to `https://forgellm.workers.dev/api/chat`
2. **Cloudflare Worker receives request** → Adds CORS headers, forwards to `OLLAMA_HOST/api/chat` with `stream: true`
3. **Cloudflare Tunnel** → Routes the request privately to your VPS's Ollama instance (port 11434)
4. **Ollama processes** → Nemotron-3-super (or selected model) generates a response
5. **Streaming response** → Ollama sends NDJSON chunks back through the tunnel
6. **Worker proxies stream** → Passes the `ReadableStream` directly back to the browser
7. **Browser renders** → `app.js` parses each JSON chunk, updates the message UI in real-time with markdown rendering

## Key Design Decisions

### Why Cloudflare Workers + Tunnel instead of exposing Ollama directly?

| Approach | Security | Latency | Complexity |
|----------|----------|---------|------------|
| Ollama directly exposed | ❌ No auth, open port | ✅ Direct | ✅ Simple |
| Cloudflare Tunnel | ✅ No open ports, DDoS protection | ✅ Edge caching | 🟢 Medium |
| VPN | ✅ Encrypted | ❌ Extra hop | ❌ Complex |
| SSH tunnel | ✅ Encrypted | ❌ No auto-reconnect | ❌ Fragile |

### Why a single Worker for both frontend and API?

- **Simpler deployment** — one `wrangler deploy` command
- **No CORS issues** — frontend and API share the same origin
- **Lower latency** — no cross-origin DNS resolution
- **Easier debugging** — single codebase, single log stream

### Why client-side conversation storage?

- **Zero infrastructure cost** — no database needed
- **Privacy** — conversation data never leaves your browser
- **Speed** — instant load, no API calls to fetch history
- **Simplicity** — no backend state management

## Frontend Architecture

```
┌─────────────────────────────────────────────┐
│              app.js (Module)                 │
│                                              │
│  state ──────────────────────────────────┐   │
│  ├─ conversations[]  ◀─── localStorage   │   │
│  ├─ currentId                          │   │
│  ├─ messages[]                         │   │
│  ├─ model                              │   │
│  ├─ streaming (boolean)                │   │
│  └─ abortController                    │   │
│                                         │   │
│  ┌─────────────────────────────────────┐│   │
│  │ DOM Management                      ││   │
│  │  ├─ renderMessages()                ││   │
│  │  ├─ appendMessageDOM()              ││   │
│  │  ├─ updateStreamingContent()        ││   │
│  │  ├─ renderConversationList()        ││   │
│  │  └─ showWelcome()                   ││   │
│  └─────────────────────────────────────┘│   │
│                                         │   │
│  ┌─────────────────────────────────────┐│   │
│  │ API Layer                           ││   │
│  │  ├─ fetchModels() → GET /api/tags   ││   │
│  │  └─ sendMessage() → POST /api/chat  ││   │
│  └─────────────────────────────────────┘│   │
│                                         │   │
│  ┌─────────────────────────────────────┐│   │
│  │ Markdown Parser                     ││   │
│  │  ├─ parseMarkdown()                 ││   │
│  │  ├─ Syntax highlighting (pre tags)  ││   │
│  │  └─ Code copy button                ││   │
│  └─────────────────────────────────────┘│   │
└─────────────────────────────────────────┘   │
                                              │
  ┌──────────────────────────────────┐        │
  │      styles.css (Global)         │        │
  │  ├─ CSS Variables (themes)       │        │
  │  ├─ Dark theme (default)         │        │
  │  ├─ Light theme                  │        │
  │  ├─ Responsive (mobile)          │        │
  │  └─ Animations                   │        │
  └──────────────────────────────────┘        │
                                              │
  ┌──────────────────────────────────┐        │
  │   index.html (Shell)             │        │
  │  ├─ Sidebar (conversations)      │        │
  │  ├─ Chat area (messages)         │        │
  │  ├─ Input area (textarea + send) │        │
  │  └─ Theme toggle                 │        │
  └──────────────────────────────────┘        │
                                              │
  ┌──────────────────────────────────┐        │
  │  localStorage (Conversations)    │        │
  │  ├─ forgellm-conversations        │        │
  │  └─ forgellm-current              │        │
  └──────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

## Worker Architecture

```
worker.js
│
├─ fetch(request, env, ctx)
│   ├─ OPTIONS → handleCORS()
│   ├─ /api/*  → handleApiRequest()  → fetch(OLLAMA_HOST + path)
│   └─ /*      → env.ASSETS.fetch()  (serves static files)
│
└─ handleApiRequest(request, url, env)
    ├─ Builds target URL from OLLAMA_HOST
    ├─ Strips hop-by-hop headers
    ├─ Forwards request body
    ├─ Returns streaming response (ReadableStream passthrough)
    └─ Error handling → JSON error response (502)
```

## Security Architecture

```
┌──────────────────────────────────────────────┐
│               Security Layers                 │
├──────────────────────────────────────────────┤
│ 1. Cloudflare WAF (Web Application Firewall) │
│ 2. Cloudflare DDoS Protection                │
│ 3. Cloudflare Tunnel (no open ports on VPS)  │
│ 4. No authentication layer (self-hosted)     │
│ 5. CORS restricted to your Worker domain     │
│ 6. Client-side only storage (no DB)          │
└──────────────────────────────────────────────┘
```

## Performance Considerations

- **Streaming**: Uses NDJSON streaming from Ollama → Worker → Browser. No buffering, tokens appear as generated.
- **Caching**: Static assets (HTML/CSS/JS) are cached by Cloudflare's CDN edge.
- **Cold starts**: Cloudflare Workers have minimal cold start latency (~5ms).
- **Ollama inference**: First request may be slow if model needs to load into GPU memory (~5-30s for nemotron-3-super).
- **Concurrent users**: Free Cloudflare Workers plan allows 100k requests/day.

## Scalability

- **Stateless Worker**: Each request is independent. Multiple users can chat simultaneously.
- **Single Ollama instance**: Your VPS Ollama is the bottleneck. For multiple concurrent users, consider:
  - Model quantization (Q4_K_M uses less VRAM)
  - Multiple GPU setup
  - Request queuing in the Worker

## Future Enhancements

- [ ] Code execution sandbox (e.g., WebContainers or Docker)
- [ ] File upload support
- [ ] Conversation search
- [ ] Export conversations (JSON/Markdown)
- [ ] System prompt customization
- [ ] Temperature/top_p parameter controls
- [ ] Multi-modal support (image understanding)
- [ ] RAG (Retrieval-Augmented Generation) with local documents
