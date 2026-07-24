/**
 * ForgeLM CLI — Chat Engine
 *
 * Handles connecting to Ollama, fetching models,
 * and streaming chat completions.
 */

import https from "https";
import http from "http";
// TextDecoder is a global in Node.js 18+

const DEFAULT_HOST = "http://localhost:11434";

// ─── Config Loading ───────────────────────────────────────────────────────

export async function loadConfig(hostOverride = null) {
  const host = hostOverride || process.env.OLLAMA_HOST || DEFAULT_HOST;

  try {
    const models = await fetchModels(host);
    return {
      host,
      connected: true,
      models: models || [],
    };
  } catch (err) {
    // Try alternative: if host doesn't work, try localhost
    if (host !== DEFAULT_HOST) {
      try {
        const models = await fetchModels(DEFAULT_HOST);
        return {
          host: DEFAULT_HOST,
          connected: true,
          models: models || [],
        };
      } catch {}
    }
    return null;
  }
}

// ─── Fetch Models ─────────────────────────────────────────────────────────

export async function fetchModels(host) {
  const { data } = await httpRequest(host, "/api/tags", "GET");
  return data.models || [];
}

// ─── Send Chat Message (Streaming with Tool Support) ─────────────────────

export async function* sendChatMessage(host, model, messages, tools = null) {
  const payload = {
    model,
    messages,
    stream: true,
  };
  if (tools) {
    payload.tools = tools;
  }
  const body = JSON.stringify(payload);

  const { response } = await httpRequestStreaming(
    host,
    "/api/chat",
    "POST",
    body
  );

  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.message && json.message.content) {
          yield json.message.content;
        }
        if (json.done) {
          return;
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    try {
      const json = JSON.parse(buffer);
      if (json.message && json.message.content) {
        yield json.message.content;
      }
    } catch {}
  }
}

// ─── HTTP Request Helper ──────────────────────────────────────────────────

function httpRequest(host, path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(host + path);
    const isHttps = url.protocol === "https:";
    const mod = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    };

    if (body) {
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = mod.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: { models: [] } });
        }
      });
    });

    req.on("error", (err) => reject(new Error(`Request failed: ${err.message}`)));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (body) req.write(body);
    req.end();
  });
}

// ─── HTTP Streaming Helper ────────────────────────────────────────────────

function httpRequestStreaming(host, path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(host + path);
    const isHttps = url.protocol === "https:";
    const mod = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    };

    if (body) {
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = mod.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorData = "";
        res.on("data", (chunk) => (errorData += chunk));
        res.on("end", () => {
          try {
            const err = JSON.parse(errorData);
            reject(new Error(err.error || `HTTP ${res.statusCode}`));
          } catch {
            reject(new Error(`HTTP ${res.statusCode}: ${errorData}`));
          }
        });
        return;
      }

      resolve({ response: res });
    });

    req.on("error", (err) => reject(new Error(err.message)));
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (body) req.write(body);
    req.end();
  });
}
