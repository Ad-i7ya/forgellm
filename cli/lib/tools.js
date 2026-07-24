/**
 * ForgeLM CLI — Tool System
 *
 * Defines tools that the AI can invoke: read/write files,
 * run commands, search the web, and spawn agents.
 *
 * Uses Ollama's tool/function calling API (supported since v0.3.0).
 */

import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

// ─── Tool Definitions (sent to Ollama) ──────────────────────────────────

export const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the contents of a file on the local filesystem",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute or relative path to the file",
          },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write or overwrite a file on the local filesystem",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute or relative path to the file",
          },
          content: {
            type: "string",
            description: "The full content to write to the file",
          },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_file",
      description: "Edit a file by replacing specific strings within it",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute or relative path to the file",
          },
          old_string: {
            type: "string",
            description: "The exact string to replace",
          },
          new_string: {
            type: "string",
            description: "The string to replace it with",
          },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Execute a shell command on the local machine and get its output",
      parameters: {
        type: "object",
        properties: {
          command: {
            type: "string",
            description: "The shell command to execute",
          },
          timeout: {
            type: "number",
            description: "Timeout in seconds (default: 30)",
          },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files and directories in a specified path",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Directory path to list (default: current directory)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for information. Use this when you need current information or documentation.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "spawn_agent",
      description:
        "Spawn a specialized sub-agent to complete a task independently. Use for complex multi-step tasks.",
      parameters: {
        type: "object",
        properties: {
          task: {
            type: "string",
            description: "The task to delegate to the sub-agent",
          },
          agent_type: {
            type: "string",
            description:
              "Type of agent (e.g., 'coder', 'researcher', 'debugger')",
            enum: ["coder", "researcher", "debugger", "reviewer"],
          },
        },
        required: ["task", "agent_type"],
      },
    },
  },
];

// ─── Tool Executors ──────────────────────────────────────────────────────

export async function executeTool(toolName, args) {
  switch (toolName) {
    case "read_file":
      return executeReadFile(args.path);
    case "write_file":
      return executeWriteFile(args.path, args.content);
    case "edit_file":
      return executeEditFile(args.path, args.old_string, args.new_string);
    case "run_command":
      return executeCommand(args.command, args.timeout || 30);
    case "list_files":
      return executeListFiles(args.path || ".");
    case "web_search":
      return executeWebSearch(args.query);
    case "spawn_agent":
      return executeSpawnAgent(args.task, args.agent_type);
    default:
      return {
        error: `Unknown tool: ${toolName}`,
      };
  }
}

async function executeReadFile(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    const content = await fs.readFile(resolvedPath, "utf-8");
    return { content, path: resolvedPath };
  } catch (err) {
    return { error: `Failed to read file: ${err.message}` };
  }
}

async function executeWriteFile(filePath, content) {
  try {
    const resolvedPath = path.resolve(filePath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, content, "utf-8");
    return { success: true, path: resolvedPath };
  } catch (err) {
    return { error: `Failed to write file: ${err.message}` };
  }
}

async function executeEditFile(filePath, oldString, newString) {
  try {
    const resolvedPath = path.resolve(filePath);
    const content = await fs.readFile(resolvedPath, "utf-8");
    if (!content.includes(oldString)) {
      return {
        error: `String not found in file. Make sure to include the exact string including whitespace.`,
      };
    }
    const updated = content.replace(oldString, newString);
    await fs.writeFile(resolvedPath, updated, "utf-8");
    return { success: true, path: resolvedPath };
  } catch (err) {
    return { error: `Failed to edit file: ${err.message}` };
  }
}

async function executeCommand(command, timeoutSec = 30) {
  try {
    const output = execSync(command, {
      encoding: "utf-8",
      timeout: timeoutSec * 1000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      cwd: process.cwd(),
    });
    return { stdout: output.trim() || "(empty output)" };
  } catch (err) {
    return {
      stdout: err.stdout?.trim() || "",
      stderr: err.stderr?.trim() || err.message,
      exitCode: err.status || 1,
      error: true,
    };
  }
}

async function executeListFiles(dirPath) {
  try {
    const resolvedPath = path.resolve(dirPath);
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
    const files = entries.map((e) => ({
      name: e.name,
      type: e.isDirectory() ? "directory" : "file",
      size: e.isFile() ? "(unknown)" : undefined,
    }));
    return { path: resolvedPath, files };
  } catch (err) {
    return { error: `Failed to list directory: ${err.message}` };
  }
}

async function executeWebSearch(query) {
  // Simple web search using a public API
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1`;
    const res = await fetch(url);
    const data = await res.json();
    const results = [];
    if (data.AbstractText) {
      results.push({ title: "Summary", snippet: data.AbstractText });
    }
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push({ title: topic.Text, snippet: topic.Text });
        }
      }
    }
    return {
      query,
      results: results.length > 0 ? results : [{ title: "No results found" }],
    };
  } catch (err) {
    return { error: `Web search failed: ${err.message}`, query };
  }
}

async function executeSpawnAgent(task, agentType) {
  // Simulate spawning a sub-agent
  const agentPrompts = {
    coder: `You are a coding expert. Complete this task:\n${task}\nProvide working code with explanations.`,
    researcher: `You are a research assistant. Investigate:\n${task}\nProvide findings with sources.`,
    debugger: `You are a debugging specialist. Debug this:\n${task}\nIdentify issues and provide fixes.`,
    reviewer: `You are a code reviewer. Review this:\n${task}\nProvide constructive feedback.`,
  };

  const prompt = agentPrompts[agentType] || agentPrompts.coder;
  return {
    agent_type: agentType,
    task,
    status: "completed",
    result: `[${agentType} agent] would process: "${task.slice(0, 100)}..."`,
  };
}
