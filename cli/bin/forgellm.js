#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ForgeLM CLI — Terminal-based AI Chat
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Usage:
 *   forgellm                          Start interactive chat
 *   forgellm --model nemotron-3-super  Start with a specific model
 *   forgellm --host http://localhost:11434  Use a different Ollama host
 *   forgellm --help                   Show help
 *
 * Environment variables:
 *   OLLAMA_HOST   Override the Ollama server URL
 *   FORGELM_MODEL  Default model to use
 *
 * ForgeLM CLI connects to your Ollama instance (running locally or via
 * a Cloudflare Tunnel) and provides an interactive AI chat experience
 * right in your terminal — with streaming, syntax-highlighted code,
 * and multi-turn conversations.
 */

import { createInterface } from "readline";
import { loadConfig, sendChatMessage } from "../lib/chat.js";
import { toolDefinitions, executeTool } from "../lib/tools.js";
import chalk from "chalk";

// ─── Parse CLI Arguments ─────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = { model: null, host: null, help: false };

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case "--model":
    case "-m":
      flags.model = args[++i];
      break;
    case "--host":
      flags.host = args[++i];
      break;
    case "--help":
    case "-h":
      flags.help = true;
      break;
    case "--version":
    case "-v":
      console.log(`forgellm v${process.env.npm_package_version || "1.0.0"}`);
      process.exit(0);
  }
}

if (flags.help) {
  showHelp();
  process.exit(0);
}

// ─── Help Screen ──────────────────────────────────────────────────────────

function showHelp() {
  const B = chalk.bold;
  console.log(`
${chalk.hex("#6363f1").bold("⚒️  ForgeLM CLI")} — AI coding companion in your terminal

${B("Usage:")}
  ${chalk.cyan("forgellm")}                    Start interactive chat
  ${chalk.cyan("forgellm --model <name>")}     Start with a specific model
  ${chalk.cyan("forgellm --host <url>")}       Use custom Ollama server
  ${chalk.cyan("forgellm --help")}             Show this help

${B("Options:")}
  ${chalk.cyan("-m, --model <name>")}    Model to use (default: nemotron-3-super)
  ${chalk.cyan("    --host <url>")}       Ollama server URL (default: auto-detected)
  ${chalk.cyan("-h, --help")}             Show this help message
  ${chalk.cyan("-v, --version")}          Show version

${B("Environment:")}
  ${chalk.yellow("OLLAMA_HOST")}     Override Ollama server URL
  ${chalk.yellow("FORGELM_MODEL")}    Default model name

${B("Examples:")}
  ${chalk.gray("# Start chat with nemotron")}
  forgellm

  ${chalk.gray("# Use a specific model")}
  forgellm --model deepseek-coder-v2

  ${chalk.gray("# Connect to a remote Ollama")}
  forgellm --host https://ollama.your-domain.com
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.clear();

  // Show splash — Freebuff-style
  console.log(`\n${chalk.hex("#6363f1").bold("◆ forgelm")}`);
  console.log(`${chalk.gray("npm install -g forgellm")}`);
  console.log();

  // Load config
  const config = await loadConfig(flags.host);
  if (!config) {
    console.log(chalk.red("✗ Could not connect to Ollama."));
    console.log(chalk.yellow("  Make sure Ollama is running or set OLLAMA_HOST."));
    process.exit(1);
  }

  if (!config.connected) {
    console.log(chalk.yellow(`⚠  Connected to Ollama server but no models found.`));
  }

  // Show connection info
  console.log(chalk.green(`✓ Connected to ${chalk.cyan(config.host)}`));
  console.log();

  // Select model — default to nemotron-3-super:latest
  let model = flags.model || process.env.FORGELM_MODEL || null;
  if (!model) {
    const nemotron = config.models.find((m) =>
      m.name.toLowerCase().includes("nemotron-3-super")
    ) || config.models.find((m) =>
      m.name.toLowerCase().includes("nemotron")
    );
    model = nemotron ? nemotron.name : "nemotron-3-super:latest";
  }

  console.log(`${chalk.gray(model)} ${chalk.gray("·")} ${chalk.gray(process.cwd().split("/").pop() || "~")}`);
  console.log();

  // ── Interactive Chat Loop ─────────────────────────────────────────────
  const messages = [];
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "",
    terminal: true,
  });

  async function chatLoop() {
    rl.question(
      chalk.hex("#6363f1")("› "),
      async (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
          chatLoop();
          return;
        }

        // Handle commands
        if (trimmed.startsWith("/")) {
          const cmd = trimmed.toLowerCase();
          if (cmd === "/exit" || cmd === "/quit") {
            console.log(chalk.gray("\n  Goodbye! 👋\n"));
            rl.close();
            return;
          }
          if (cmd === "/help" || cmd === "/?") {
            showCLIHelp();
            chatLoop();
            return;
          }
          if (cmd === "/clear") {
            console.clear();
            chatLoop();
            return;
          }
          if (cmd.startsWith("/model ")) {
            const newModel = cmd.slice(7).trim();
            if (config.models.find((m) => m.name === newModel)) {
              model = newModel;
              console.log(chalk.green(`  ✓ Switched to model: ${model}\n`));
            } else {
              console.log(
                chalk.red(
                  `  ✗ Model "${newModel}" not found. Available: ${config.models
                    .map((m) => m.name)
                    .join(", ")}\n`
                )
              );
            }
            chatLoop();
            return;
          }
          if (cmd.startsWith("/models")) {
            console.log(
              chalk.blue(
                `  ◉ Available models:\n    ${config.models
                  .map((m) => m.name)
                  .join("\n    ")}\n`
              )
            );
            chatLoop();
            return;
          }
          // Unknown command
          console.log(
            chalk.yellow(
              `  ⚠  Unknown command. Type ${chalk.cyan("/help")} for commands.\n`
            )
          );
          chatLoop();
          return;
        }

        // Add user message
        messages.push({ role: "user", content: trimmed });

        // Show thinking indicator
        process.stdout.write(chalk.gray("└ analyzing request..."));

        try {
          // Stream the response with tool support
          let fullResponse = "";
          let firstChunk = true;
          let toolCalls = [];

          for await (const chunk of sendChatMessage(
            config.host,
            model,
            messages,
            toolDefinitions
          )) {
            if (firstChunk) {
              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);
              process.stdout.write(chalk.hex("#54a967")("└ ") + chalk.gray(""));
              firstChunk = false;
            }
            if (typeof chunk === "object" && chunk.tool_calls) {
              toolCalls = chunk.tool_calls;
            } else if (typeof chunk === "string") {
              fullResponse += chunk;
              process.stdout.write(chunk);
            }
          }

          // Handle tool calls
          if (toolCalls.length > 0) {
            process.stdout.write("\n");
            messages.push({ role: "assistant", content: fullResponse });

            for (const tc of toolCalls) {
              const fn = tc.function;
              const fnName = fn.name;
              const fnArgs = JSON.parse(fn.arguments);

              process.stdout.write(
                chalk.gray(`  🔧 Running tool: ${fnName}...`)
              );

              const result = await executeTool(fnName, fnArgs);

              process.stdout.clearLine(0);
              process.stdout.cursorTo(0);

              messages.push({
                role: "tool",
                content: JSON.stringify(result),
                name: fnName,
              });
            }

            // Get final response after tools
            process.stdout.write(chalk.gray("  ⚒️  Processing results..."));
            let finalResponse = "";
            firstChunk = true;

            for await (const chunk of sendChatMessage(
              config.host,
              model,
              messages
            )) {
              if (firstChunk) {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(
                  chalk.hex("#54a967")("└ ") + chalk.gray("")
                );
                firstChunk = false;
              }
              finalResponse += chunk;
              process.stdout.write(chunk);
            }

            process.stdout.write("\n\n");
            messages.push({ role: "assistant", content: finalResponse });
          } else {
            process.stdout.write("\n\n");
            messages.push({ role: "assistant", content: fullResponse });
          }
        } catch (err) {
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          console.log(chalk.red(`\n  ✗ Error: ${err.message}\n`));
        }

        chatLoop();
      }
    );
  }

  chatLoop();
}

// ─── CLI Help ─────────────────────────────────────────────────────────────

function showCLIHelp() {
  console.log(`
${chalk.bold("  Available Commands:")}
  ${chalk.cyan("/help")}        Show this help message
  ${chalk.cyan("/models")}      List available models
  ${chalk.cyan("/model <name>")} Switch to a different model
  ${chalk.cyan("/clear")}       Clear the screen
  ${chalk.cyan("/exit")}        Exit ForgeLM
  ${chalk.cyan("Ctrl+C")}       Exit ForgeLM

${chalk.bold("  Tips:")}
  • Press ${chalk.cyan("↑/↓")} to navigate input history
  • Code blocks are color-formatted automatically
  • Conversations are session-only (not saved between sessions)
`);
}

// ─── Start ────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error(chalk.red(`\n  ✗ Fatal error: ${err.message}\n`));
  process.exit(1);
});
