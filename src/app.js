/**
 * ForgeLM — Client-Side Application
 *
 * Handles:
 *   - Chat UI interactions
 *   - Streaming responses from Cloudflare Worker / Ollama
 *   - Conversation management (localStorage)
 *   - Theme toggling (dark/light) + highlight.js theme switching
 *   - Markdown rendering with highlight.js syntax highlighting
 *   - Mobile sidebar toggling
 */

// ─── State ─────────────────────────────────────────────────────────────────

const state = {
  conversations: [],
  currentId: null,
  messages: [],
  model: "",
  models: [],
  streaming: false,
  abortController: null,
  settings: {
    smartScroll: true,
    enterToSend: true,
  },
};

// ─── DOM References ────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);

const dom = {
  messages: $("#messages"),
  chatContainer: $("#chatContainer"),
  input: $("#messageInput"),
  sendBtn: $("#sendBtn"),
  stopBtn: $("#stopBtn"),
  modelSelect: $("#modelSelect"),
  newChatBtn: $("#newChatBtn"),
  themeToggle: $("#themeToggle"),
  conversationList: $("#conversationList"),
  toastContainer: $("#toastContainer"),
  sidebar: $("#sidebar"),
  sidebarOverlay: $("#sidebarOverlay"),
  mobileMenuBtn: $("#mobileMenuBtn"),
  settingsBtn: $("#settingsBtn"),
  settingsModal: $("#settingsModal"),
  settingsClose: $("#settingsClose"),
  themeToggleCheckbox: $("#themeToggleCheckbox"),
  smartScrollToggle: $("#smartScrollToggle"),
  enterToSendToggle: $("#enterToSendToggle"),
  cmdPalette: $("#cmdPalette"),
  cmdPaletteBtn: $("#cmdPaletteBtn"),
  cmdPaletteInput: $("#cmdPaletteInput"),
  cmdPaletteResults: $("#cmdPaletteResults"),
  connectionDot: $("#connectionDot"),
  connectionText: $("#connectionText"),
};

// ─── Markdown Parser (lightweight) ─────────────────────────────────────────

function parseMarkdown(text) {
  // Escape HTML
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings must come before other block elements
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr>");

  // Code blocks (fenced) — before inline code to avoid conflicts
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : "";
    const escaped = escapeHtml(code);
    // Use data-lang for highlight.js detection
    return `<pre><button class="copy-btn" onclick="copyCode(this)">Copy</button><code${langClass} data-lang="${lang || 'text'}">${escaped}</code></pre>`;
  });

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
  html = html.replace(
    /(<li>.*<\/li>\n?)+/g,
    (match) => `<ol>${match}</ol>`
  );

  // Paragraphs (double newlines to paragraph break)
  html = html.replace(/\n\n/g, "</p><p>");

  // Single newlines within paragraphs -> <br>
  html = html.replace(/\n/g, "<br>");

  // Wrap in <p> if not already wrapped
  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return html;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ─── Syntax Highlighting ──────────────────────────────────────────────────

function applyHighlighting(container) {
  // Use requestIdleCallback or setTimeout to defer highlighting
  const defer = window.requestIdleCallback || setTimeout;
  defer(() => {
    if (typeof hljs !== "undefined") {
      container.querySelectorAll("pre code[class*='language-']").forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  }, 0);
}

// ─── Copy Code Handler ─────────────────────────────────────────────────────

window.copyCode = async function (btn) {
  const codeEl = btn.nextElementSibling;
  if (!codeEl) return;
  const code = codeEl.textContent || "";
  try {
    await navigator.clipboard.writeText(code);
    btn.textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "Copy";
      btn.classList.remove("copied");
    }, 2000);
  } catch {
    btn.textContent = "Failed";
  }
};

// ─── Toast Notifications ───────────────────────────────────────────────────

function showToast(message, type = "info", duration = 3000) {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  dom.toastContainer.appendChild(el);
  setTimeout(() => {
    el.classList.add("toast-out");
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ─── Theme ─────────────────────────────────────────────────────────────────

function getTheme() {
  return localStorage.getItem("forgellm-theme") || "dark";
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("forgellm-theme", theme);

  // Update highlight.js theme stylesheet
  const hljsStylesheet = document.getElementById("hljs-theme");
  if (hljsStylesheet) {
    hljsStylesheet.href =
      theme === "dark"
        ? "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
        : "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css";
  }
}

function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

// ─── Mobile Sidebar ────────────────────────────────────────────────────────

function toggleSidebar() {
  const isOpen = dom.sidebar.classList.toggle("open");
  dom.sidebarOverlay.classList.toggle("visible", isOpen);
  document.body.style.overflow = isOpen ? "hidden" : "";
}

function closeSidebar() {
  dom.sidebar.classList.remove("open");
  dom.sidebarOverlay.classList.remove("visible");
  document.body.style.overflow = "";
}

// ─── Conversations (localStorage) ──────────────────────────────────────────

const STORAGE_KEY = "forgellm-conversations";
const CURRENT_KEY = "forgellm-current";

function loadConversations() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    state.conversations = data ? JSON.parse(data) : [];
  } catch {
    state.conversations = [];
  }
  state.currentId = localStorage.getItem(CURRENT_KEY) || null;
}

function saveConversations() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.conversations));
  if (state.currentId) {
    localStorage.setItem(CURRENT_KEY, state.currentId);
  } else {
    localStorage.removeItem(CURRENT_KEY);
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getCurrentConversation() {
  return state.conversations.find((c) => c.id === state.currentId);
}

function createConversation() {
  const conv = {
    id: generateId(),
    title: "New conversation",
    created: Date.now(),
    messages: [],
    model: state.model,
  };
  state.conversations.unshift(conv);
  state.currentId = conv.id;
  state.messages = [];
  saveConversations();
  renderConversationList();
  renderMessages();
  scrollToBottom();
  return conv;
}

function deleteConversation(id, event) {
  event.stopPropagation();
  state.conversations = state.conversations.filter((c) => c.id !== id);
  if (state.currentId === id) {
    if (state.conversations.length > 0) {
      state.currentId = state.conversations[0].id;
      switchToConversation(state.currentId);
    } else {
      state.currentId = null;
      state.messages = [];
      createConversation();
    }
  }
  saveConversations();
  renderConversationList();
}

function switchToConversation(id) {
  if (state.streaming) return;
  state.currentId = id;
  const conv = getCurrentConversation();
  if (conv) {
    state.messages = conv.messages;
    state.model = conv.model || state.model;
    dom.modelSelect.value = state.model;
  }
  saveConversations();
  renderConversationList();
  renderMessages();
  scrollToBottom();
  closeSidebar(); // Close mobile sidebar after selection
}

function updateConversationTitle(id) {
  const conv = state.conversations.find((c) => c.id === id);
  if (!conv) return;
  const firstUser = conv.messages.find((m) => m.role === "user");
  if (firstUser) {
    const title = firstUser.content
      .replace(/<[^>]*>/g, "")
      .replace(/\n/g, " ")
      .trim();
    conv.title = title.length > 60 ? title.slice(0, 60) + "\u2026" : title;
  }
}

// ─── Conversation List Rendering ──────────────────────────────────────────

function renderConversationList() {
  dom.conversationList.innerHTML = "";
  if (state.conversations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "conversation-item";
    empty.style.justifyContent = "center";
    empty.style.color = "var(--text-tertiary)";
    empty.textContent = "No conversations yet";
    dom.conversationList.appendChild(empty);
    return;
  }

  state.conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = `conversation-item${
      conv.id === state.currentId ? " active" : ""
    }`;
    item.innerHTML = `
      <span class="conv-icon">\uD83D\uDCAC</span>
      <span class="conv-title">${escapeHtml(conv.title)}</span>
      <button class="conv-delete" title="Delete conversation">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    `;
    item.addEventListener("click", () => switchToConversation(conv.id));
    item.querySelector(".conv-delete").addEventListener("click", (e) =>
      deleteConversation(conv.id, e)
    );
    dom.conversationList.appendChild(item);
  });
}

// ─── Message Rendering ─────────────────────────────────────────────────────

function renderMessages() {
  dom.messages.innerHTML = "";
  if (state.messages.length === 0) {
    showWelcome();
    return;
  }
  state.messages.forEach((msg) => {
    appendMessageDOM(msg.role, msg.content, msg.streaming);
  });
}

function showWelcome() {
  dom.messages.innerHTML = `
    <div class="welcome">
      <div class="welcome-icon">⚒️</div>
      <h1 class="welcome-title">Welcome to ForgeLM</h1>
      <p class="welcome-subtitle">Your AI-powered coding companion</p>
      <div class="welcome-suggestions">
        <button class="suggestion-chip" data-prompt="Write a Python function to merge two sorted arrays">
          Write a Python function to merge two sorted arrays
        </button>
        <button class="suggestion-chip" data-prompt="Explain how React useEffect works with examples">
          Explain how React useEffect works
        </button>
        <button class="suggestion-chip" data-prompt="Create a Dockerfile for a Node.js app">
          Create a Dockerfile for Node.js
        </button>
        <button class="suggestion-chip" data-prompt="Write a SQL query to find duplicate emails">
          SQL: Find duplicate emails
        </button>
      </div>
    </div>
  `;
  dom.messages.querySelectorAll(".suggestion-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      dom.input.value = chip.dataset.prompt;
      dom.input.dispatchEvent(new Event("input"));
      sendMessage();
    });
  });
}

function appendMessageDOM(role, content, isStreaming = false) {
  // Remove welcome screen if present
  const welcome = dom.messages.querySelector(".welcome");
  if (welcome) welcome.remove();

  // If last message is same role and streaming, update it in-place
  const lastMsg = dom.messages.lastElementChild;
  if (
    isStreaming &&
    lastMsg &&
    lastMsg.dataset.role === role &&
    lastMsg.classList.contains("streaming")
  ) {
    const contentEl = lastMsg.querySelector(".message-content");
    contentEl.innerHTML = parseMarkdown(content) + '<span class="streaming-cursor"></span>';
    smartScroll();
    return;
  }

  const div = document.createElement("div");
  div.className = `message ${role}${isStreaming ? " streaming" : ""}`;
  div.dataset.role = role;

  const avatarHTML =
    role === "user"
      ? `<div class="message-avatar">\uD83D\uDC64</div>`
      : `<div class="message-avatar">⚒️</div>`;

  const contentHTML = isStreaming
    ? parseMarkdown(content) + '<span class="streaming-cursor"></span>'
    : parseMarkdown(content);

  div.innerHTML = `${avatarHTML}<div class="message-content">${contentHTML}</div>`;

  dom.messages.appendChild(div);

  // Apply syntax highlighting to new content
  if (!isStreaming) {
    applyHighlighting(div);
  }

  smartScroll();
}

function updateStreamingContent(content, done = false) {
  const lastMsg = dom.messages.lastElementChild;
  if (!lastMsg || !lastMsg.classList.contains("streaming")) return;

  const contentEl = lastMsg.querySelector(".message-content");
  if (done) {
    lastMsg.classList.remove("streaming");
    contentEl.innerHTML = parseMarkdown(content);
    applyHighlighting(lastMsg);
  } else {
    contentEl.innerHTML = parseMarkdown(content) + '<span class="streaming-cursor"></span>';
  }
  smartScroll();
}

// ─── Smart Scrolling ──────────────────────────────────────────────────────
// Only auto-scroll if the user is near the bottom of the chat container.

function isNearBottom() {
  const el = dom.chatContainer;
  const threshold = 150; // pixels from bottom
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
}

function smartScroll() {
  if (!isNearBottom()) return;
  requestAnimationFrame(() => {
    dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
  });
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
  });
}

// ─── API Configuration ────────────────────────────────────────────────────
// The frontend connects directly to Ollama (via trycloudflare tunnel)
// from the browser, since the Worker can't reach the VPS directly.

let API_BASE = "/api"; // fallback: use Worker's proxy

async function loadConfig() {
  try {
    const res = await fetch("/_config");
    if (res.ok) {
      const config = await res.json();
      if (config.ollamaHost && !config.ollamaHost.includes("localhost") && !config.ollamaHost.includes("internal")) {
        API_BASE = config.ollamaHost + "/api";
        console.log("ForgeLM using Ollama via:", API_BASE);
        return;
      }
    }
    console.warn("ForgeLM config: No valid tunnel URL, falling back to Worker proxy");
  } catch (err) {
    console.warn("ForgeLM config: Could not load config (", err.message, ") — trycloudflare tunnel may not be running");
  }
}

async function apiFetch(path, options = {}) {
  const url = API_BASE + path;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

// ─── API Calls ─────────────────────────────────────────────────────────────

async function fetchModels() {
  try {
    const res = await apiFetch("/tags");
    if (!res.ok) throw new Error("Failed to fetch models");
    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.error("fetchModels error:", err);
    return [];
  }
}

async function sendMessage() {
  const text = dom.input.value.trim();
  if (!text || state.streaming) return;

  // Ensure we have a conversation
  if (!state.currentId) {
    createConversation();
  }
  let conv = getCurrentConversation();
  if (!conv) {
    createConversation();
    conv = getCurrentConversation();
  }

  // Add user message
  const userMsg = { role: "user", content: text, streaming: false };
  state.messages.push(userMsg);
  conv.messages.push(userMsg);
  appendMessageDOM("user", text);
  updateConversationTitle(conv.id);
  renderConversationList();
  saveConversations();

  // Clear input
  dom.input.value = "";
  dom.input.style.height = "auto";
  dom.sendBtn.disabled = true;

  // Create assistant placeholder
  const assistantMsg = { role: "assistant", content: "", streaming: true };
  state.messages.push(assistantMsg);
  conv.messages.push(assistantMsg);
  appendMessageDOM("assistant", "", true);

  // Start streaming
  state.streaming = true;
  dom.sendBtn.classList.add("hidden");
  dom.stopBtn.classList.remove("hidden");

  const controller = new AbortController();
  state.abortController = controller;

  // Build chat history for context
  const messages = state.messages
    .filter((m) => !m.streaming || m === assistantMsg)
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

  try {
    const res = await apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({
        model: state.model,
        messages: messages,
        stream: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line);
          if (chunk.message && chunk.message.content) {
            assistantMsg.content += chunk.message.content;
            updateStreamingContent(assistantMsg.content);
          }
        } catch {
          // Incomplete JSON line, skip
        }
      }
    }

    // Process remaining buffer
    if (buffer.trim()) {
      try {
        const chunk = JSON.parse(buffer);
        if (chunk.message && chunk.message.content) {
          assistantMsg.content += chunk.message.content;
        }
      } catch { /* empty */ }
    }

    assistantMsg.streaming = false;
    updateStreamingContent(assistantMsg.content, true);
  } catch (err) {
    if (err.name === "AbortError") {
      assistantMsg.content += "\n\n*[Generation stopped]*";
    } else {
      assistantMsg.content += `\n\n*Error: ${err.message}*`;
      showToast(`Error: ${err.message}`, "error");
    }
    assistantMsg.streaming = false;
    updateStreamingContent(assistantMsg.content, true);
  } finally {
    state.streaming = false;
    state.abortController = null;
    dom.sendBtn.classList.remove("hidden");
    dom.stopBtn.classList.add("hidden");
    handleInput(); // sync button state with (now-empty) input
    dom.input.focus();
    saveConversations();
  }
}

function stopGeneration() {
  if (state.abortController) {
    state.abortController.abort();
  }
}

// ─── Input Handling ────────────────────────────────────────────────────────

function handleInput() {
  const text = dom.input.value.trim();
  dom.sendBtn.disabled = !text || state.streaming;
  // Auto-resize
  dom.input.style.height = "auto";
  dom.input.style.height = Math.min(dom.input.scrollHeight, 200) + "px";
}

function handleKeydown(e) {
  // Ignore IME composition events (e.g., Japanese/Chinese input)
  if (e.isComposing || e.keyCode === 229) return;

  // Enter to send (Shift+Enter for newline)
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// ─── Models Loading ────────────────────────────────────────────────────────

async function loadModels() {
  try {
    const models = await fetchModels();
    state.models = models;
    dom.modelSelect.innerHTML = "";

    if (models.length === 0) {
      dom.modelSelect.innerHTML = '<option value="">No models found</option>';
      dom.modelSelect.disabled = true;
      return;
    }

    models.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.name;
      const size = m.details?.parameter_size ? ` (${m.details.parameter_size})` : "";
      opt.textContent = `${m.name}${size}`;
      dom.modelSelect.appendChild(opt);
    });
    dom.modelSelect.disabled = false;

    // Set default model — prefer nemotron, then first available
    const nemotron = models.find((m) =>
      m.name.toLowerCase().includes("nemotron")
    );
    state.model = nemotron ? nemotron.name : models[0].name;
    dom.modelSelect.value = state.model;

    // Load or create conversation
    loadConversations();
    if (state.currentId) {
      const conv = getCurrentConversation();
      if (conv) {
        state.messages = conv.messages;
        state.model = conv.model || state.model;
        dom.modelSelect.value = state.model;
      }
    }
    if (!state.currentId) {
      createConversation();
    }
    renderConversationList();
    renderMessages();
    scrollToBottom();
  } catch (err) {
    console.error("loadModels error:", err);
    dom.modelSelect.innerHTML = '<option value="">Failed to load models</option>';
    dom.modelSelect.disabled = true;
    showToast("Could not connect to Ollama. Is the tunnel running?", "error");
    // Initialize with defaults
    loadConversations();
    if (!state.currentId) createConversation();
    renderConversationList();
  }
}

// ─── Settings Modal ───────────────────────────────────────────────────────

function openSettings() {
  dom.settingsModal.classList.add("open");
}

function closeSettings() {
  dom.settingsModal.classList.remove("open");
}

// ─── Command Palette ───────────────────────────────────────────────────────

function openCmdPalette() {
  dom.cmdPalette.classList.add("open");
  dom.cmdPaletteInput.value = "";
  dom.cmdPaletteInput.focus();
  // Show all items
  dom.cmdPaletteResults.querySelectorAll(".cmd-palette-item").forEach((item) => {
    item.style.display = "flex";
  });
}

function closeCmdPalette() {
  dom.cmdPalette.classList.remove("open");
  dom.input.focus();
}

function filterCmdPalette() {
  const query = dom.cmdPaletteInput.value.toLowerCase().trim();
  dom.cmdPaletteResults.querySelectorAll(".cmd-palette-item").forEach((item) => {
    const label = item.querySelector(".cmd-label").textContent.toLowerCase();
    item.style.display = !query || label.includes(query) ? "flex" : "none";
  });
}

function executeCmdPaletteAction(action) {
  closeCmdPalette();
  switch (action) {
    case "new-chat":
      if (!state.streaming) createConversation();
      break;
    case "toggle-theme":
      toggleTheme();
      break;
    case "open-settings":
      openSettings();
      break;
    case "clear-chat":
      if (state.streaming) return;
      state.messages = [];
      const conv = getCurrentConversation();
      if (conv) conv.messages = [];
      saveConversations();
      renderMessages();
      showToast("Conversation cleared", "success");
      break;
    case "show-shortcuts":
      openSettings();
      break;
  }
}

// ─── Update Connection Status ──────────────────────────────────────────────

function setConnectionStatus(status, text) {
  dom.connectionDot.className = `connection-dot ${status}`;
  dom.connectionText.textContent = text;
}

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────

function handleGlobalKeydown(e) {
  // Cmd+K / Ctrl+K → command palette
  if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    if (dom.cmdPalette.classList.contains("open")) {
      closeCmdPalette();
    } else {
      openCmdPalette();
    }
    return;
  }

  // Escape → close modals
  if (e.key === "Escape") {
    if (dom.cmdPalette.classList.contains("open")) {
      closeCmdPalette();
      return;
    }
    if (dom.settingsModal.classList.contains("open")) {
      closeSettings();
      return;
    }
    if (dom.sidebar.classList.contains("open")) {
      closeSidebar();
      return;
    }
  }

  // Ctrl+, → settings
  if ((e.metaKey || e.ctrlKey) && e.key === ",") {
    e.preventDefault();
    openSettings();
    return;
  }

  // Ctrl+Shift+N → new chat
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "N") {
    e.preventDefault();
    if (!state.streaming) createConversation();
    return;
  }

  // Ctrl+Shift+T → toggle theme
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "T") {
    e.preventDefault();
    toggleTheme();
    return;
  }

  // Ctrl+/ → show shortcuts (open settings)
  if ((e.metaKey || e.ctrlKey) && e.key === "/") {
    e.preventDefault();
    openSettings();
    return;
  }
}

// ─── Event Binding ─────────────────────────────────────────────────────────

function init() {
  // Theme
  setTheme(getTheme());
  dom.themeToggle.addEventListener("click", toggleTheme);

  // Input
  dom.input.addEventListener("input", handleInput);
  dom.input.addEventListener("keydown", handleKeydown);
  dom.sendBtn.addEventListener("click", sendMessage);
  dom.stopBtn.addEventListener("click", stopGeneration);

  // New chat
  dom.newChatBtn.addEventListener("click", () => {
    if (state.streaming) return;
    createConversation();
    closeSidebar();
  });

  // Model selection
  dom.modelSelect.addEventListener("change", () => {
    state.model = dom.modelSelect.value;
    const conv = getCurrentConversation();
    if (conv) {
      conv.model = state.model;
      saveConversations();
    }
  });

  // Mobile sidebar
  if (dom.mobileMenuBtn) {
    dom.mobileMenuBtn.addEventListener("click", toggleSidebar);
  }
  if (dom.sidebarOverlay) {
    dom.sidebarOverlay.addEventListener("click", closeSidebar);
  }

  // Settings modal
  if (dom.settingsBtn) {
    dom.settingsBtn.addEventListener("click", openSettings);
  }
  if (dom.settingsClose) {
    dom.settingsClose.addEventListener("click", closeSettings);
  }
  if (dom.settingsModal) {
    dom.settingsModal.addEventListener("click", (e) => {
      if (e.target === dom.settingsModal) closeSettings();
    });
  }

  // Settings toggles
  if (dom.themeToggleCheckbox) {
    dom.themeToggleCheckbox.checked = getTheme() === "dark";
    dom.themeToggleCheckbox.addEventListener("change", () => {
      setTheme(dom.themeToggleCheckbox.checked ? "dark" : "light");
    });
  }
  if (dom.smartScrollToggle) {
    dom.smartScrollToggle.addEventListener("change", () => {
      state.settings.smartScroll = dom.smartScrollToggle.checked;
    });
  }
  if (dom.enterToSendToggle) {
    dom.enterToSendToggle.addEventListener("change", () => {
      state.settings.enterToSend = dom.enterToSendToggle.checked;
    });
  }

  // Command palette
  if (dom.cmdPaletteBtn) {
    dom.cmdPaletteBtn.addEventListener("click", openCmdPalette);
  }
  if (dom.cmdPaletteInput) {
    dom.cmdPaletteInput.addEventListener("input", filterCmdPalette);
    dom.cmdPaletteInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCmdPalette();
        return;
      }
      if (e.key === "Enter") {
        const visible = dom.cmdPaletteResults.querySelector(".cmd-palette-item[style*='flex'], .cmd-palette-item:not([style*='display: none'])");
        if (visible) {
          executeCmdPaletteAction(visible.dataset.action);
        }
      }
    });
  }
  if (dom.cmdPalette) {
    dom.cmdPalette.addEventListener("click", (e) => {
      if (e.target === dom.cmdPalette) closeCmdPalette();
    });
  }

  // Command palette item clicks
  dom.cmdPaletteResults.querySelectorAll(".cmd-palette-item").forEach((item) => {
    item.addEventListener("click", () => {
      executeCmdPaletteAction(item.dataset.action);
    });
  });

  // Global keyboard shortcuts
  document.addEventListener("keydown", handleGlobalKeydown);

  // Focus input on page load
  dom.input.focus();

  // Set connection status
  setConnectionStatus("loading", "Connecting...");

  // Load config (tunnel URL), then models and conversations
  loadConfig()
    .then(() => loadModels())
    .then(() => setConnectionStatus("connected", "Connected"))
    .catch(() => setConnectionStatus("disconnected", "Disconnected"));
}

// ─── Start ─────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", init);
