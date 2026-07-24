# ⚒️ ForgeLLM CLI

Chat with AI models directly from your terminal.

## Installation

```bash
npm install -g forgellm
```

## Usage

```bash
# Start interactive chat (defaults to nemotron-3-super:latest)
forgellm

# Use a specific model
forgellm --model nemotron-3-super:latest

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
| `/exit` | Exit ForgeLLM |
| `Ctrl+C` | Exit ForgeLLM |

## Requirements

- Node.js 18+
- Ollama server running (locally or remotely)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_HOST` | Ollama server URL | `http://localhost:11434` |
| `FORGELM_MODEL` | Default model name | `nemotron-3-super:latest` |
