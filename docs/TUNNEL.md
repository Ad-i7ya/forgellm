# 🔒 Cloudflare Tunnel Setup for ForgeLLM

This guide explains how to connect your VPS Ollama instance to ForgeLLM via Cloudflare Tunnel — **without opening any ports** on your VPS.

## Why Cloudflare Tunnel?

- **No open firewall ports** — the tunnel initiates an *outbound* connection from your VPS to Cloudflare
- **DDoS protection** — Cloudflare shields your origin
- **Automatic TLS** — encrypted connections without certificate management
- **High availability** — auto-reconnects if connection drops
- **Free tier works** — no additional cost beyond your Cloudflare plan

## Prerequisites

- A domain managed by Cloudflare (e.g., `your-domain.com`)
- SSH access to your VPS
- Ollama running on your VPS (default: `http://localhost:11434`)

## Step 1: Install cloudflared on Your VPS

### Linux (amd64)
```bash
# Download cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared

# Make it executable
chmod +x /usr/local/bin/cloudflared

# Verify
cloudflared version
```

### Linux (arm64) — Raspberry Pi, etc.
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
cloudflared version
```

## Step 2: Authenticate cloudflared

```bash
cloudflared tunnel login
```

This opens a browser window asking you to log in to your Cloudflare account. Select the domain you want to use. A certificate file will be downloaded to `~/.cloudflared/cert.pem`.

> **On a headless VPS?** Copy the login URL from the terminal output and open it in your local browser. Or set up a local browser session.

## Step 3: Create a Tunnel

```bash
cloudflared tunnel create forgellm-ollama
```

This creates a tunnel and generates a credentials file at `~/.cloudflared/<tunnel-id>.json`. Note the tunnel ID — you will need it.

## Step 4: Configure DNS

Route your domain (or subdomain) to the tunnel:

```bash
cloudflared tunnel route dns forgellm-ollama ollama.your-domain.com
```

Now `ollama.your-domain.com` points to your tunnel.

## Step 5: Create Tunnel Configuration

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: forgellm-ollama
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  # Route all traffic to Ollama on localhost
  - hostname: ollama.your-domain.com
    service: http://localhost:11434
  # Catch-all: 404 for anything else
  - service: http_status:404
```

Replace `<tunnel-id>` with the actual ID from step 3.

## Step 6: Run the Tunnel

### Test the tunnel
```bash
cloudflared tunnel run forgellm-ollama
```

Leave this running and test from another terminal:
```bash
curl https://ollama.your-domain.com/api/tags
```

You should see your Ollama models listed.

### Run as a Systemd Service (persistent)

Create `/etc/systemd/system/cloudflared-tunnel.service`:

```ini
[Unit]
Description=Cloudflare Tunnel for Ollama
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run forgellm-ollama
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable cloudflared-tunnel
systemctl start cloudflared-tunnel
systemctl status cloudflared-tunnel
```

## Step 7: Secure Ollama (Optional but Recommended)

Ollama by default listens on all interfaces when behind the tunnel. Let's make sure only the tunnel can access it:

### Bind Ollama to localhost only (if running directly)
```bash
# Edit your ollama service or run:
ollama serve
# By default, Ollama binds to 127.0.0.1:11434 — it's already localhost-only.
```

### Verify
```bash
# From outside the VPS, this should work (via tunnel):
curl https://ollama.your-domain.com/api/tags

# From inside the VPS, this should work:
curl http://localhost:11434/api/tags

# From the public internet (without tunnel), this should FAIL:
curl http://your-vps-ip:11434/api/tags  # Should timeout or refuse
```

## Step 8: Update ForgeLLM Configuration

Now set your OLLAMA_HOST in ForgeLLM:

```bash
# From your local machine (where ForgeLLM project is)
npx wrangler secret put OLLAMA_HOST
# Enter: https://ollama.your-domain.com
```

Re-deploy ForgeLLM:

```bash
npm run deploy
```

## Troubleshooting

### Tunnel won't connect
```bash
# Check tunnel logs
journalctl -u cloudflared-tunnel -f

# Test locally
cloudflared tunnel run forgellm-ollama --metrics 0.0.0.0:12345
```

### DNS not resolving
```bash
# Wait a few minutes for DNS propagation
# Verify with dig
dig ollama.your-domain.com

# Re-route if needed
cloudflared tunnel route dns forgellm-ollama ollama.your-domain.com --overwrite-dns
```

### Ollama returns connection refused
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running:
ollama serve
```

### ForgeLLM shows "Failed to connect"
```bash
# Test the tunnel endpoint directly
curl https://ollama.your-domain.com/api/tags

# If this works but ForgeLLM doesn't, check your Worker logs:
npm run logs
```

## Security Checklist

- [ ] No inbound firewall ports open (check with `ufw status` or `iptables -L`)
- [ ] Ollama listening only on `127.0.0.1:11434`
- [ ] Tunnel uses a unique subdomain (`ollama.*` not `www.*`)
- [ ] cloudflared runs as a systemd service with auto-restart
- [ ] Regular updates of cloudflared (`cloudflared update`)

## Alternative: Quick Test (No Domain)

If you don't have a domain, you can use `cloudflared tunnel --url` for a quick test:

```bash
cloudflared tunnel --url http://localhost:11434
```

This creates a temporary `*.trycloudflare.com` URL. Update your ForgeLLM Worker's `OLLAMA_HOST` to this temporary URL for testing.
