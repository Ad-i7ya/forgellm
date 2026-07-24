/**
 * ForgeLM — Cloudflare Worker
 *
 * Routes:
 *   /api/*  → proxied to Ollama on your VPS (via Cloudflare Tunnel)
 *   /*      → served as static assets from ./src/
 *
 * Connect your VPS Ollama instance privately using cloudflared.
 * See docs/TUNNEL.md for setup instructions.
 */

// ─── Configuration ───────────────────────────────────────────────────────────
// Set OLLAMA_HOST as a Worker secret or wrangler.toml variable.
// Default is your VPS Ollama through Cloudflare Tunnel.
// Examples:
//   "http://ollama-tunnel.your-domain.com"  (via cloudflared)
//   "http://192.168.1.100:11434"            (local network)
const DEFAULT_OLLAMA_HOST = "http://localhost:11434";

// ─── Main Handler ────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // ── CORS Preflight ────────────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // ── Config endpoint → tells the frontend where Ollama is ─────────────
    if (url.pathname === "/_config") {
      const ollamaHost = env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST;
      return new Response(JSON.stringify({ ollamaHost }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }

    // ── API Routes → proxy to Ollama (server-side, may be restricted) ─────
    if (url.pathname.startsWith("/api/")) {
      return handleApiRequest(request, url, env);
    }

    // ── Non-API routes → served as static HTML pages ────────────────────
    switch (url.pathname) {
      case "/cli":
      case "/cli/":
        return env.ASSETS.fetch(new Request(new URL(url.origin + "/index.html"), request));
      case "/web":
      case "/web/":
        return env.ASSETS.fetch(new Request(new URL(url.origin + "/web.html"), request));
      case "/chat":
      case "/chat/":
        return env.ASSETS.fetch(new Request(new URL(url.origin + "/chat.html"), request));
      default:
        return env.ASSETS.fetch(request);
    }
  },
};

// ─── API Proxy ───────────────────────────────────────────────────────────────

async function handleApiRequest(request, url, env) {
  const ollamaHost = env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST;
  const targetUrl = `${ollamaHost}${url.pathname}${url.search}`;

  // Build proxied request
  const proxyHeaders = new Headers(request.headers);
  // Remove hop-by-hop headers
  proxyHeaders.delete("cf-connecting-ip");
  proxyHeaders.delete("x-forwarded-for");
  proxyHeaders.delete("x-real-ip");

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: proxyHeaders,
    body: request.body,
    // Ensure duplex is set for streaming
    duplex: "half",
  });

  try {
    const response = await fetch(proxyRequest);

    // Clone headers and add CORS
    const responseHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders())) {
      responseHeaders.set(key, value);
    }

    // Return streaming response for SSE / NDJSON
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("Ollama proxy error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to connect to Ollama backend",
        detail: err.message,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      }
    );
  }
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}
