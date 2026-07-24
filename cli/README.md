# ⚒️ ForgeLM CLI

Chat with AI models directly from your terminal.

## Installation

```bash
npm install -g forgellm
```

## Usage

```bash
# Start interactive chat
forgellm

# Use a specific model
forgellm --model nemotron-3-super

# Connect to a remote Ollama instance
forgellm --host https://ollama.your-domain.com
```

## Commands (within chat)

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/models` | List all available models |
| `/model <name>` | Switch to a different model |
| `/clear` | Clear the terminal screen |
| `/exit` | Exit ForgeLM |
| `Ctrl+C` | Exit ForgeLM |

## Requirements

- Node.js 18+
- Ollama server running (locally or remotely)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `FORGELM_MODEL` | Default model name | First available model |
