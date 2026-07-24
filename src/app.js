/* ═══════════════════════════════════════════════════════════════════════════
   ForgeLM — App JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ═════════════════════════════════════════════════════════════════════
  // LANDING PAGE
  // ═════════════════════════════════════════════════════════════════════

  // ─── Scroll-triggered animations ────────────────────────────────────
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          // Animate in
          const delay = parseFloat(el.dataset.delay) || 0;
          setTimeout(() => {
            el.style.opacity = '1';
            if (el.dataset.animate === 'slide-up') {
              el.style.transform = 'translateY(0)';
            } else if (el.dataset.animate === 'slide-right') {
              el.style.transform = 'translateX(0)';
            } else if (el.dataset.animate === 'scale-y') {
              el.style.transform = 'scaleY(1)';
            }
          }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => {
      el.style.opacity = '0';
      if (el.dataset.animate === 'slide-up') {
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      } else if (el.dataset.animate === 'slide-right') {
        el.style.transform = 'translateX(-24px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      } else if (el.dataset.animate === 'scale-y') {
        el.style.transform = 'scaleY(0)';
        el.style.transformOrigin = 'top';
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      }
      observer.observe(el);
    });

    // Also trigger all lp-gpu elements (legacy from Freebuff)
    setTimeout(() => {
      document.querySelectorAll('.lp-gpu').forEach(el => {
        const currOpacity = el.style.opacity;
        const currTransform = el.style.transform;
        if (currOpacity === '' || currOpacity === '0') {
          el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          el.style.opacity = '1';
          if (el.style.transform && el.style.transform.includes('translateY')) {
            el.style.transform = 'translateY(0)';
          }
        }
        // Stagger children
        const children = el.querySelectorAll(':scope > *');
        children.forEach((child, i) => {
          if (child.style.opacity === '0') {
            setTimeout(() => {
              child.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
              child.style.opacity = '1';
              if (child.style.transform && child.style.transform.includes('translateY')) {
                child.style.transform = 'translateY(0)';
              }
            }, 200 + i * 100);
          }
        });
      });
    }, 300);
  }

  // ─── Header scroll effect ──────────────────────────────────────────
  function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    // Show header with fade-in
    setTimeout(() => {
      header.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, 200);

    // Header background opacity on scroll
    const headerBg = header.querySelector('[aria-hidden="true"]');
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (headerBg) {
        const opacity = Math.min(scrollY / 300, 1);
        headerBg.style.opacity = String(opacity);
      }
    }, { passive: true });
  }

  // ─── Product Tab Switching ─────────────────────────────────────────
  function initProductTabs() {
    const tabs = document.querySelectorAll('.product-tab');
    const panels = document.querySelectorAll('.product-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const product = tab.dataset.product;
        
        // Update tab states
        tabs.forEach(t => {
          t.classList.remove('active');
          const span = t.querySelector('span.absolute');
          if (span) span.remove();
          t.style.color = 'rgba(255,255,255,0.55)';
        });
        
        tab.classList.add('active');
        tab.style.color = 'white';
        const highlight = document.createElement('span');
        highlight.className = 'absolute inset-0 -z-10 rounded-full bg-white/10';
        tab.prepend(highlight);

        // Update panel
        panels.forEach(p => {
          p.classList.add('hidden');
          p.classList.remove('active');
        });
        const activePanel = document.querySelector(`.product-panel[data-product="${product}"]`);
        if (activePanel) {
          activePanel.classList.remove('hidden');
          activePanel.classList.add('active');
        }
      });

      // Ensure initial state
      const isActive = tab.classList.contains('active');
      if (isActive) {
        tab.style.color = 'white';
        const existingSpan = tab.querySelector('span.absolute');
        if (!existingSpan) {
          const highlight = document.createElement('span');
          highlight.className = 'absolute inset-0 -z-10 rounded-full bg-white/10';
          tab.prepend(highlight);
        }
      }
    });
  }

  // ─── Copy buttons ─────────────────────────────────────────────────
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cmd = btn.dataset.cmd || btn.textContent.trim();
        try {
          await navigator.clipboard.writeText(cmd);
          const original = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4 text-forest-bright"><path d="M20 6 9 17l-5-5"/></svg>';
          
          // Restore icons in button that originally had them
          setTimeout(() => {
            if (btn.dataset.cmd) {
              btn.innerHTML = original;
            }
          }, 2000);
        } catch (e) {
          // Fallback: select text
          const range = document.createRange();
          const textNode = btn.querySelector('.flex-1') || btn;
          range.selectNodeContents(textNode);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      });
    });
  }

  // ─── Quick start toggle (CLI page) ───────────────────────────────
  function initQuickStart() {
    const toggleBtn = document.querySelector('.quick-start-btn');
    const content = document.querySelector('.quick-start-content');
    if (!toggleBtn || !content) return;

    toggleBtn.addEventListener('click', () => {
      const isHidden = content.classList.contains('hidden');
      content.classList.toggle('hidden');
      toggleBtn.setAttribute('aria-expanded', !isHidden);
      const chevron = toggleBtn.querySelector('.lucide-chevron-down');
      if (chevron) {
        chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
      }
    });
  }

  // ─── FAQ Accordion ───────────────────────────────────────────────
  function initFAQs() {
    const triggers = document.querySelectorAll('.faq-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-item');
        if (!item) return;
        const content = item.querySelector('.faq-content');
        const chevron = trigger.querySelector('.lucide-chevron-down');
        const isOpen = content.style.maxHeight !== '0px' && content.style.maxHeight !== '';
        
        if (isOpen) {
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        } else {
          content.style.maxHeight = content.scrollHeight + 'px';
          content.style.opacity = '1';
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  // ─── Pricing comparison animation ──────────────────────────────────
  function initPricingAnimation() {
    const container = document.querySelector('.lp-gpu > .overflow-hidden.rounded-t-\\[20px\\]');
    if (!container) return;

    // Animate the pricing bars
    setTimeout(() => {
      const bars = container.querySelectorAll('[class*="rounded-l-\\[3px\\]"]');
      bars.forEach((bar, i) => {
        setTimeout(() => {
          bar.style.transition = 'width 1.2s ease';
          // Get the target width from the bar's inline style
          const match = bar.style.width;
          if (match) {
            bar.style.width = '0px';
            requestAnimationFrame(() => {
              bar.style.width = match;
            });
          }
        }, 500 + i * 200);
      });

      // Animate price labels
      const labels = container.querySelectorAll('[class*="tabular-nums"]');
      labels.forEach(label => {
        if (label.textContent.includes('/ yr') || label.textContent.includes('$')) {
          label.style.transition = 'opacity 0.6s ease';
          label.style.opacity = '1';
        }
      });

      // Animate the green indicator bar
      const indicator = container.querySelector('.rounded-full.bg-forest-bright');
      if (indicator) {
        indicator.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        indicator.style.opacity = '1';
        indicator.style.transform = 'scaleY(1)';
      }
    }, 800);
  }

  // ═════════════════════════════════════════════════════════════════════
  // INIT LANDING
  // ═════════════════════════════════════════════════════════════════════

  // Detect if we're on the landing page (not chat)
  const isLandingPage = !window.location.pathname.includes('/chat');

  if (isLandingPage) {
    // Initialize everything after a small delay
    setTimeout(() => {
      // Header animations
      initHeaderScroll();
      
      // Scroll-based animations
      initScrollAnimations();
      
      // Product tab switching
      initProductTabs();
      
      // Copy buttons
      initCopyButtons();
      
      // Quick start toggle
      initQuickStart();
      
      // FAQ accordion
      initFAQs();
      
      // Animate sky background gradient
      const skyBg = document.querySelector('.hero-bg-sky');
      if (skyBg) {
        setTimeout(() => {
          skyBg.style.transition = 'opacity 1.5s ease';
          skyBg.style.opacity = '1';
        }, 400);
      }

      // Animate hills background
      const hillsBg = document.querySelector('.hero-bg-hills');
      if (hillsBg) {
        setTimeout(() => {
          hillsBg.style.transition = 'opacity 1.8s ease';
          hillsBg.style.opacity = '1';
        }, 600);
      }

      // Animate bushes
      const bushes = document.querySelector('.hero-bg-bushes');
      if (bushes) {
        setTimeout(() => {
          bushes.style.transition = 'opacity 1.5s ease';
          bushes.style.opacity = '1';
        }, 1000);
      }

      // Animate hero heading
      const heroHeading = document.querySelector('.lp-hero-heading')?.closest('.lp-gpu');
      if (heroHeading) {
        setTimeout(() => {
          heroHeading.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          heroHeading.style.opacity = '1';
          heroHeading.style.transform = 'translateY(0)';
        }, 400);
      }

      // Stars background fade
      const starsContainer = document.querySelector('.lp-gpu.pointer-events-none.absolute');
      if (starsContainer) {
        setTimeout(() => {
          starsContainer.style.transition = 'opacity 1.5s ease';
          starsContainer.style.opacity = '1';
        }, 600);
      }

      // Pricing comparison fade in
      const pricingElement = document.querySelector('.lp-gpu.absolute.inset-x-0.top-\\[11\\%\\]');
      if (pricingElement) {
        setTimeout(() => {
          pricingElement.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
          pricingElement.style.opacity = '1';
        }, 1200);
        initPricingAnimation();
      }

      // Gradient background behind hero
      const gradientBg = document.querySelector('.bg-\\[linear-gradient\\(to_bottom\\,#03060a_0\\%\\,#060c12_24\\%\\,#101f23_44\\%\\,#172a29_57\\%\\,#121a1a_71\\%\\,#070a0b_86\\%\\,#000000_100\\%\\)\\]');
      if (gradientBg) {
        setTimeout(() => {
          gradientBg.style.transition = 'opacity 1.5s ease';
          gradientBg.style.opacity = '1';
        }, 200);
      }

      // Section animations - observe sections
      const sections = document.querySelectorAll('#cli > div, #web > div, #chat > div');
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            sectionObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      sections.forEach(section => {
        sectionObserver.observe(section);
      });
    }, 100);
  }

  // ═════════════════════════════════════════════════════════════════════
  // CHAT FUNCTIONALITY (for /chat route or when navigated)
  // ═════════════════════════════════════════════════════════════════════

  const isChatPage = window.location.pathname.includes('/chat') || 
                     document.getElementById('chat-app');

  if (isChatPage || document.getElementById('chat-interface')) {
    initChatApp();
  }

  function initChatApp() {
    // ─── DOM References ──────────────────────────────────────────────
    const dom = {};
    dom.chat = document.getElementById('chat-messages');
    dom.input = document.getElementById('chat-input');
    dom.sendBtn = document.getElementById('send-btn');
    dom.modelSelect = document.getElementById('model-select');
    dom.newChatBtn = document.getElementById('new-chat-btn');
    dom.conversations = document.getElementById('conversations');
    dom.themeToggle = document.getElementById('theme-toggle');
    dom.statusIndicator = document.getElementById('status-indicator');
    dom.statusText = document.getElementById('status-text');

    // Settings modal
    dom.settingsBtn = document.getElementById('settings-btn');
    dom.settingsModal = document.getElementById('settings-modal');
    dom.settingsClose = document.getElementById('settings-close');
    dom.themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
    dom.smartScrollToggle = document.getElementById('smart-scroll-toggle');
    dom.enterToSendToggle = document.getElementById('enter-to-send-toggle');

    // Command palette
    dom.cmdPalette = document.getElementById('cmd-palette');
    dom.cmdPaletteBtn = document.getElementById('cmd-palette-btn');
    dom.cmdPaletteInput = document.getElementById('cmd-palette-input');
    dom.cmdPaletteResults = document.getElementById('cmd-palette-results');

    // Connection
    dom.connectionDot = document.getElementById('connection-dot');
    dom.connectionText = document.getElementById('connection-text');

    // ─── State ──────────────────────────────────────────────────────
    const state = {
      streaming: false,
      abortController: null,
      conversations: JSON.parse(localStorage.getItem('forgelm_conversations') || '[]'),
      currentId: Date.now().toString(),
      ollamaHost: 'http://localhost:11434',
      models: [],
      settings: JSON.parse(localStorage.getItem('forgelm_settings') || JSON.stringify({
        theme: 'dark',
        smartScroll: true,
        enterToSend: true
      }))
    };

    // ─── Config Loading ──────────────────────────────────────────────
    async function loadConfig() {
      try {
        const res = await fetch('/_config');
        const data = await res.json();
        if (data.host) {
          state.ollamaHost = data.host;
        }
        return true;
      } catch (e) {
        console.log('No config, using default host');
        return false;
      }
    }

    // ─── Theme ────────────────────────────────────────────────────────
    function setTheme(theme) {
      state.settings.theme = theme;
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
      if (dom.themeToggleCheckbox) dom.themeToggleCheckbox.checked = theme === 'light';
      saveSettings();
    }

    function toggleTheme() {
      setTheme(state.settings.theme === 'dark' ? 'light' : 'dark');
    }

    // ─── Settings ──────────────────────────────────────────────────
    function saveSettings() {
      localStorage.setItem('forgelm_settings', JSON.stringify(state.settings));
    }

    function openSettings() {
      if (dom.settingsModal) dom.settingsModal.classList.remove('hidden');
    }

    function closeSettings() {
      if (dom.settingsModal) dom.settingsModal.classList.add('hidden');
    }

    // ─── Command Palette ────────────────────────────────────────────
    let cmdPaletteSelectedIndex = 0;

    function openCmdPalette() {
      if (!dom.cmdPalette || !dom.cmdPaletteInput) return;
      dom.cmdPalette.classList.remove('hidden');
      dom.cmdPaletteInput.value = '';
      dom.cmdPaletteInput.focus();
      filterCmdPalette('');
    }

    function closeCmdPalette() {
      if (dom.cmdPalette) dom.cmdPalette.classList.add('hidden');
      if (dom.input) dom.input.focus();
    }

    function filterCmdPalette(query) {
      if (!dom.cmdPaletteResults) return;
      const items = dom.cmdPaletteResults.querySelectorAll('.cmd-palette-item');
      const q = query.toLowerCase();
      let firstVisible = -1;
      items.forEach((item, i) => {
        const label = (item.dataset.label || item.textContent).toLowerCase();
        if (label.includes(q)) {
          item.style.display = 'flex';
          if (firstVisible === -1) firstVisible = i;
        } else {
          item.style.display = 'none';
        }
      });
      cmdPaletteSelectedIndex = firstVisible >= 0 ? firstVisible : 0;
      updateCmdPaletteSelection(items);
    }

    function updateCmdPaletteSelection(items) {
      items.forEach((item, i) => {
        item.classList.toggle('bg-white/[0.08]', i === cmdPaletteSelectedIndex);
        item.classList.toggle('text-white', i === cmdPaletteSelectedIndex);
        item.classList.toggle('text-white/70', i !== cmdPaletteSelectedIndex);
      });
      const selected = items[cmdPaletteSelectedIndex];
      if (selected) selected.scrollIntoView({ block: 'nearest' });
    }

    function executeCmdPaletteAction(action) {
      closeCmdPalette();
      switch (action) {
        case 'new-chat':
          if (dom.newChatBtn) dom.newChatBtn.click();
          break;
        case 'toggle-theme':
          toggleTheme();
          break;
        case 'open-settings':
          openSettings();
          break;
        case 'clear-chat':
          if (dom.chat) {
            dom.chat.innerHTML = '';
            localStorage.removeItem('forgelm_messages_' + state.currentId);
          }
          break;
      }
    }

    // ─── Connection Status ─────────────────────────────────────────
    function setConnectionStatus(status, text) {
      if (dom.connectionDot) {
        dom.connectionDot.className = 'h-2 w-2 rounded-full ' + 
          (status === 'connected' ? 'bg-forest-bright' : 
           status === 'connecting' ? 'bg-yellow-500' : 
           'bg-red-500');
      }
      if (dom.connectionText) {
        dom.connectionText.textContent = text || status;
      }
    }

    // ─── Model Loading ──────────────────────────────────────────────
    async function loadModels() {
      try {
        setConnectionStatus('connecting', 'Connecting...');
        const url = `${state.ollamaHost}/api/tags`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        state.models = data.models || [];
        
        if (dom.modelSelect) {
          dom.modelSelect.innerHTML = state.models.map(m => 
            `<option value="${m.name}">${m.name}</option>`
          ).join('');
          
          // Prefer nemotron or first available
          const preferred = state.models.find(m => m.name.includes('nemotron'));
          if (preferred) dom.modelSelect.value = preferred.name;
        }
        
        setConnectionStatus('connected', `${state.models.length} models`);
        return state.models;
      } catch (e) {
        setConnectionStatus('disconnected', 'Disconnected');
        dom.modelSelect.innerHTML = '<option value="">No models found</option>';
        return [];
      }
    }

    // ─── Chat ──────────────────────────────────────────────────────
    function addMessage(content, role, modelName) {
      if (!dom.chat) return;
      const msg = document.createElement('div');
      msg.className = `flex gap-2.5 ${role === 'user' ? 'justify-end' : ''}`;
      
      const inner = document.createElement('div');
      inner.className = `max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
        role === 'user' 
          ? 'bg-[#6363f1]/10 text-white/90 rounded-br-sm' 
          : 'bg-white/[0.06] text-white/85 rounded-bl-sm'
      }`;
      
      if (role === 'assistant' && modelName) {
        const header = document.createElement('div');
        header.className = 'mb-1 flex items-center gap-1.5 text-[11px]';
        header.innerHTML = `<span class="text-forest-bright/90">ForgeLM</span><span class="text-white/30">·</span><span class="text-white/40">${modelName}</span>`;
        inner.appendChild(header);
      }
      
      if (role === 'user') {
        inner.innerHTML += escapeHtml(content);
      } else {
        inner.innerHTML += formatMessage(content);
      }
      
      msg.appendChild(inner);
      dom.chat.appendChild(msg);
      smartScroll();
    }

    function smartScroll() {
      if (!state.settings.smartScroll) return;
      const chatArea = dom.chat?.closest('.overflow-y-auto') || dom.chat;
      if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
      }
    }

    function isNearBottom() {
      const chatArea = dom.chat?.closest('.overflow-y-auto') || dom.chat;
      if (!chatArea) return true;
      return chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 100;
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    function formatMessage(text) {
      // Code blocks
      text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const langLabel = lang || 'code';
        return `<div class="mt-2 rounded-lg border border-white/[0.08] bg-black/40 overflow-hidden">
          <div class="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
            <span class="text-[11px] text-white/40 font-mono">${escapeHtml(langLabel)}</span>
            <button class="copy-code-btn text-[11px] text-white/30 hover:text-white transition-colors" data-code="${escapeHtml(code.trim())}">Copy</button>
          </div>
          <pre class="p-3 overflow-x-auto"><code class="text-[12px] leading-relaxed text-white/70 font-mono">${escapeHtml(code.trim())}</code></pre>
        </div>`;
      });
      
      // Inline code
      text = text.replace(/`([^`]+)`/g, '<code class="rounded bg-white/[0.08] px-1 py-0.5 text-[12px] font-mono text-white/80">$1</code>');
      
      // Bold
      text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white/90">$1</strong>');
      
      // Line breaks
      text = text.replace(/\n/g, '<br/>');
      
      return text;
    }

    async function sendMessage() {
      if (!dom.input || state.streaming) return;
      
      const text = dom.input.value.trim();
      if (!text) return;
      
      // Clear input
      dom.input.value = '';
      dom.input.style.height = 'auto';
      if (dom.sendBtn) dom.sendBtn.disabled = true;
      
      addMessage(text, 'user');
      
      const model = dom.modelSelect?.value || 'nemotron-3-super';
      
      state.abortController = new AbortController();
      state.streaming = true;
      if (dom.sendBtn) dom.sendBtn.disabled = true;
      
      // Create assistant message container
      const msgDiv = document.createElement('div');
      msgDiv.className = 'flex gap-2.5';
      const innerDiv = document.createElement('div');
      innerDiv.className = 'max-w-[80%] rounded-2xl rounded-bl-sm bg-white/[0.06] px-3.5 py-2.5 text-[13px] leading-relaxed text-white/85';
      
      const header = document.createElement('div');
      header.className = 'mb-1 flex items-center gap-1.5 text-[11px]';
      header.innerHTML = `<span class="text-forest-bright/90">ForgeLM</span><span class="text-white/30">·</span><span class="text-white/40">${model}</span>`;
      innerDiv.appendChild(header);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'streaming-content';
      innerDiv.appendChild(contentDiv);
      msgDiv.appendChild(innerDiv);
      dom.chat.appendChild(msgDiv);
      
      let fullResponse = '';
      
      try {
        const url = `${state.ollamaHost}/api/chat`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: text }],
            stream: true
          }),
          signal: state.abortController.signal
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line);
              if (json.message && json.message.content) {
                fullResponse += json.message.content;
                contentDiv.innerHTML = formatMessage(fullResponse);
                smartScroll();
              }
            } catch (e) {
              // Skip malformed lines
            }
          }
        }
        
        // Flush buffer
        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer);
            if (json.message && json.message.content) {
              fullResponse += json.message.content;
              contentDiv.innerHTML = formatMessage(fullResponse);
            }
          } catch (e) {}
        }
        
        // Save to conversation history
        saveConversation(text, fullResponse, model);
        
      } catch (e) {
        if (e.name !== 'AbortError') {
          contentDiv.innerHTML = `<span class="text-red-400">Error: ${e.message}</span>`;
        }
      } finally {
        state.streaming = false;
        state.abortController = null;
        if (dom.sendBtn) dom.sendBtn.disabled = true;
        handleInput();
      }
    }

    function saveConversation(prompt, response, model) {
      const key = 'forgelm_messages_' + state.currentId;
      const messages = JSON.parse(localStorage.getItem(key) || '[]');
      messages.push({ role: 'user', content: prompt });
      messages.push({ role: 'assistant', content: response, model });
      localStorage.setItem(key, JSON.stringify(messages));
      
      // Update conversation list
      const existing = state.conversations.find(c => c.id === state.currentId);
      if (existing) {
        existing.title = prompt.slice(0, 50);
        existing.updated = Date.now();
      } else {
        state.conversations.unshift({ id: state.currentId, title: prompt.slice(0, 50), created: Date.now() });
      }
      localStorage.setItem('forgelm_conversations', JSON.stringify(state.conversations));
      renderConversations();
    }

    function renderConversations() {
      if (!dom.conversations) return;
      dom.conversations.innerHTML = state.conversations.slice(0, 20).map(c => 
        `<div class="conversation-item flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer" data-id="${c.id}">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square h-3.5 w-3.5 shrink-0"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span class="truncate">${escapeHtml(c.title)}</span>
        </div>`
      ).join('');
      
      // Add click handlers
      dom.conversations.querySelectorAll('.conversation-item').forEach(el => {
        el.addEventListener('click', () => {
          state.currentId = el.dataset.id;
          loadConversation(state.currentId);
        });
      });
    }

    function loadConversation(id) {
      const key = 'forgelm_messages_' + id;
      const messages = JSON.parse(localStorage.getItem(key) || '[]');
      state.currentId = id;
      if (dom.chat) dom.chat.innerHTML = '';
      messages.forEach(m => addMessage(m.content, m.role, m.model));
    }

    function newChat() {
      state.currentId = Date.now().toString();
      if (dom.chat) dom.chat.innerHTML = '';
    }

    // ─── Input Handling ────────────────────────────────────────────
    function handleInput() {
      if (!dom.input || !dom.sendBtn) return;
      const text = dom.input.value.trim();
      dom.sendBtn.disabled = !text || state.streaming;
      
      // Auto-resize
      dom.input.style.height = 'auto';
      dom.input.style.height = Math.min(dom.input.scrollHeight, 150) + 'px';
    }

    function handleKeydown(e) {
      if (e.key === 'Enter' && !e.shiftKey && state.settings.enterToSend) {
        e.preventDefault();
        sendMessage();
      } else if (e.key === 'Enter' && e.shiftKey) {
        // Shift+Enter always inserts newline
        return;
      }
    }

    // ─── Keyboard Shortcuts ────────────────────────────────────────
    function handleGlobalKeydown(e) {
      // Cmd/Ctrl + K → Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCmdPalette();
      }
      // Cmd/Ctrl + , → Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
      }
      // Cmd/Ctrl + Shift + N → New chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        newChat();
      }
      // Cmd/Ctrl + Shift + T → Toggle theme
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        toggleTheme();
      }
      // Escape → Close modals
      if (e.key === 'Escape') {
        if (dom.cmdPalette && !dom.cmdPalette.classList.contains('hidden')) {
          closeCmdPalette();
        } else if (dom.settingsModal && !dom.settingsModal.classList.contains('hidden')) {
          closeSettings();
        }
      }
    }

    // ─── Init Chat ─────────────────────────────────────────────────
    function init() {
      // Apply theme
      setTheme(state.settings.theme);

      // Load config and models
      loadConfig().then(() => loadModels());
      
      // Render conversations
      renderConversations();
      
      // Event listeners
      if (dom.sendBtn) dom.sendBtn.addEventListener('click', sendMessage);
      if (dom.input) {
        dom.input.addEventListener('input', handleInput);
        dom.input.addEventListener('keydown', handleKeydown);
      }
      if (dom.themeToggle) dom.themeToggle.addEventListener('click', toggleTheme);
      if (dom.newChatBtn) dom.newChatBtn.addEventListener('click', newChat);
      
      // Settings
      if (dom.settingsBtn) dom.settingsBtn.addEventListener('click', openSettings);
      if (dom.settingsClose) dom.settingsClose.addEventListener('click', closeSettings);
      if (dom.themeToggleCheckbox) dom.themeToggleCheckbox.addEventListener('change', toggleTheme);
      if (dom.smartScrollToggle) dom.smartScrollToggle.addEventListener('change', (e) => {
        state.settings.smartScroll = e.target.checked;
        saveSettings();
      });
      if (dom.enterToSendToggle) dom.enterToSendToggle.addEventListener('change', (e) => {
        state.settings.enterToSend = e.target.checked;
        saveSettings();
      });
      
      // Close settings modal when clicking outside
      if (dom.settingsModal) dom.settingsModal.addEventListener('click', (e) => {
        if (e.target === dom.settingsModal) closeSettings();
      });
      
      // Command palette
      if (dom.cmdPaletteBtn) dom.cmdPaletteBtn.addEventListener('click', openCmdPalette);
      if (dom.cmdPaletteInput) {
        dom.cmdPaletteInput.addEventListener('input', (e) => filterCmdPalette(e.target.value));
        dom.cmdPaletteInput.addEventListener('keydown', (e) => {
          const items = dom.cmdPaletteResults?.querySelectorAll('.cmd-palette-item:not([style*="display: none"])') || [];
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const visible = Array.from(items);
            const curIdx = visible.indexOf(items[cmdPaletteSelectedIndex]);
            cmdPaletteSelectedIndex = items.indexOf(visible[Math.min(curIdx + 1, visible.length - 1)]);
            updateCmdPaletteSelection(items);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const visible = Array.from(items);
            const curIdx = visible.indexOf(items[cmdPaletteSelectedIndex]);
            cmdPaletteSelectedIndex = items.indexOf(visible[Math.max(curIdx - 1, 0)]);
            updateCmdPaletteSelection(items);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const visible = Array.from(items);
            if (visible.length > 0) {
              const idx = Math.min(cmdPaletteSelectedIndex, items.length - 1);
              const action = items[idx]?.dataset.action;
              if (action) executeCmdPaletteAction(action);
            }
          } else if (e.key === 'Escape') {
            closeCmdPalette();
          }
        });
      }
      if (dom.cmdPalette) dom.cmdPalette.addEventListener('click', (e) => {
        if (e.target === dom.cmdPalette) closeCmdPalette();
      });
      if (dom.cmdPaletteResults) {
        dom.cmdPaletteResults.addEventListener('mouseover', (e) => {
          const item = e.target.closest('.cmd-palette-item');
          if (item) {
            const items = dom.cmdPaletteResults.querySelectorAll('.cmd-palette-item');
            const idx = Array.from(items).indexOf(item);
            if (idx >= 0) {
              cmdPaletteSelectedIndex = idx;
              updateCmdPaletteSelection(items);
            }
          }
        });
        dom.cmdPaletteResults.addEventListener('click', (e) => {
          const item = e.target.closest('.cmd-palette-item');
          if (item) {
            const action = item.dataset.action;
            if (action) executeCmdPaletteAction(action);
          }
        });
      }
      
      // Keyboard shortcuts
      document.addEventListener('keydown', handleGlobalKeydown);
    }

    init();
  }
})();
