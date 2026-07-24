/**
 * ForgeLM — CORS Proxy
 *
 * A lightweight proxy that adds CORS headers and forwards requests to Ollama.
 * Run this on the VPS, then point your Cloudflare Tunnel to it.
 *
 * Usage:
 *   node cors-proxy.js
 *   # Or with PM2: pm2 start cors-proxy.js --name forgellm-cors
 *
 * Then start tunnel:
 *   cloudflared tunnel --url http://localhost:13500
 */

const http = require("http");
const httpProxy = require("http");

const PROXY_PORT = 13500;
const OLLAMA_HOST = "localhost";
const OLLAMA_PORT = 11434;

const server = http.createServer((req, res) => {
  const options = {
    hostname: OLLAMA_HOST,
    port: OLLAMA_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `${OLLAMA_HOST}:${OLLAMA_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "86400");

    // Forward status code and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Stream the response
    proxyRes.pipe(res);
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to connect to Ollama" }));
  });

  // Forward request body
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(
    `ForgeLM CORS Proxy listening on http://localhost:${PROXY_PORT}`
  );
  console.log(`Forwarding to Ollama at http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
});
