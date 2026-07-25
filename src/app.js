/* ═══════════════════════════════════════════════════════════════════════════
   ForgeLLM — App JavaScript
   Handles landing page animations, parallax, reveals, copy buttons, FAQ, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const CUBIC_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const CUBIC_IN_OUT = 'cubic-bezier(0.65, 0, 0.35, 1)';

  function whenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* ─── Helpers ───────────────────────────────────────────────────── */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setStyle(el, props) {
    Object.assign(el.style, props);
  }

  function revealElement(el, options = {}) {
    if (!el) return;
    const duration = options.duration || '0.9s';
    const delay = options.delay || '0s';
    const transform = options.transform !== undefined ? options.transform : '';
    el.style.transition = `opacity ${duration} ${CUBIC_OUT} ${delay}, transform ${duration} ${CUBIC_OUT} ${delay}`;
    el.style.opacity = '1';
    if (transform || el.style.transform) {
      // If caller provides a transform, use it; otherwise try to neutralize an inline translateY.
      if (transform) {
        el.style.transform = transform;
      } else if (/translateY\s*\(/i.test(el.style.transform || '')) {
        el.style.transform = el.style.transform.replace(/translateY\([^)]+\)/gi, 'translateY(0)');
      }
    }
  }

  /* ─── Hero staggered reveal on load ──────────────────────────────── */
  function initHeroReveal() {
    const hero = document.querySelector('main > section:first-of-type');
    if (!hero) return;

    const layers = hero.querySelectorAll('.lp-gpu');
    if (!layers.length) return;

    layers.forEach((el, i) => {
      const delay = 80 + i * 70; // ms
      setTimeout(() => {
        if (prefersReducedMotion()) {
          revealElement(el, { duration: '0.01s', delay: '0s' });
          return;
        }
        revealElement(el, { delay: '0s' });
      }, delay);
    });

    // Also reveal any inner elements that start hidden (pricing labels, bars, labels)
    const hiddenInner = hero.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]');
    hiddenInner.forEach((el, i) => {
      if (el.closest('.lp-gpu')) return; // already handled above
      setTimeout(() => revealElement(el, { delay: '0s' }), 260 + i * 55);
    });
  }

  /* ─── Scroll-triggered reveals for feature sections ──────────────── */
  function initScrollReveals() {
    if (prefersReducedMotion()) {
      document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.transition = `opacity 0.85s ${CUBIC_OUT}, transform 0.85s ${CUBIC_OUT}`;
          el.style.opacity = '1';
          if (/translateY\s*\(/i.test(el.style.transform || '')) {
            el.style.transform = el.style.transform.replace(/translateY\([^)]+\)/gi, 'translateY(0)');
          } else if (!el.style.transform || el.style.transform === 'none') {
            el.style.transform = 'translateY(0)';
          }
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    // Observe non-hero elements with hidden inline styles.
    const hero = document.querySelector('main > section:first-of-type');
    document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]').forEach(el => {
      if (hero && hero.contains(el)) return; // skip hero, handled separately
      observer.observe(el);
    });
  }

  /* ─── Pricing bars grow into view ────────────────────────────────── */
  function initPricingBars() {
    const bars = document.querySelectorAll('.lp-pricing-bar');
    if (!bars.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = el.dataset.targetWidth || el.getAttribute('style').match(/width:\s*([^;]+)/)?.[1];
          if (target) {
            el.style.transition = 'width 1.3s ' + CUBIC_OUT;
            el.style.width = target;
          }
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.15 });

    bars.forEach(bar => {
      const style = bar.getAttribute('style') || '';
      const match = style.match(/width:\s*([^;]+)/);
      if (match && match[1]) {
        bar.dataset.targetWidth = match[1].trim();
      }
      observer.observe(bar);
    });
  }

  /* ─── Mountain / hills / bushes parallax ─────────────────────────── */
  function initMountainParallax() {
    const hero = document.querySelector('main > section:first-of-type');
    if (!hero) return;

    const sky = hero.querySelector('img[src*="sky-bg"]');
    const hills = hero.querySelector('img[src*="hills-bg"]');
    const bushes = hero.querySelector('img[src*="bushes-fg"]');

    let ticking = false;

    function update() {
      const rect = hero.getBoundingClientRect();
      const heroHeight = rect.height || window.innerHeight;
      // progress: 0 when hero top is at viewport top, 1 when hero bottom leaves viewport
      const progress = Math.max(0, Math.min(1, -rect.top / heroHeight));
      const px = window.scrollY;

      // The iconic "mountain moves up as you scroll" parallax.
      if (sky) {
        sky.style.transform = `translateY(${progress * 20}px)`;
      }
      if (hills) {
        // Hills rise faster than the sky, creating depth.
        hills.style.transform = `translateY(${-progress * 60 - 20}px)`;
      }
      if (bushes) {
        // Foreground bushes also rise, but a bit more.
        bushes.style.transform = `translateY(${-progress * 90}px)`;
      }

      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    update();
  }

  /* ─── Header backdrop fade on scroll ──────────────────────────────── */
  function initHeader() {
    const header = document.querySelector('header.lp-gpu');
    if (!header) return;
    const bg = header.querySelector('[aria-hidden="true"]');
    if (!bg) return;

    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      bg.style.opacity = String(Math.min(y / 220, 1));
    }, { passive: true });
  }

  /* ─── Footer giant text parallax reveal ──────────────────────────── */
  function initFooterParallax() {
    const footerText = document.querySelector('.lp-footer-giant, .lp-giant-text, [aria-label="forgellm"]');
    if (!footerText) return;

    const parent = footerText.closest('section, div');
    if (!parent) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footerText.style.transition = `opacity 0.9s ${CUBIC_OUT}, transform 0.9s ${CUBIC_OUT}`;
          footerText.style.opacity = '1';
          footerText.style.transform = 'translateY(0)';
          observer.unobserve(footerText);
        }
      });
    }, { threshold: 0.1 });

    observer.observe(footerText);
  }

  /* ─── Copy button helpers ───────────────────────────────────────── */
  function initCopyButtons() {
    function createCheckSvg() {
      return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4 text-forest-bright"><path d="M20 6 9 17l-5-5"/></svg>';
    }

    document.querySelectorAll('button[aria-label="Copy"], button[aria-label="Copy install command"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const wrapper = btn.closest('.flex, .inline-flex');
        const textEl = wrapper ? wrapper.querySelector('code, span.flex-1, .select-all') : null;
        const text = (textEl ? textEl.textContent.trim() : '') || (btn.dataset.cmd || '');
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          const original = btn.innerHTML;
          btn.innerHTML = createCheckSvg();
          setTimeout(() => { btn.innerHTML = original; }, 2000);
        } catch (e) {}
      });
    });
  }

  /* ─── FAQ accordion ──────────────────────────────────────────────── */
  function initFAQs() {
    document.querySelectorAll('.faq-trigger, .faq-item > button').forEach(trigger => {
      if (trigger.dataset.faqBound) return;
      trigger.dataset.faqBound = '1';
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-item') || trigger.parentElement;
        if (!item) return;
        const content = item.querySelector('.faq-content, .overflow-hidden');
        const chevron = trigger.querySelector('svg');
        if (!content) return;
        const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';
        if (isOpen) {
          content.style.maxHeight = '0px';
          content.style.opacity = '0';
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        } else {
          content.style.transition = 'max-height 0.35s ease, opacity 0.35s ease';
          content.style.maxHeight = (content.scrollHeight || 200) + 'px';
          content.style.opacity = '1';
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  /* ─── Smooth scroll for anchor links ──────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ─── Mobile products menu ───────────────────────────────────────── */
  function initMobileMenu() {
    const btn = document.querySelector('button[aria-haspopup="menu"]');
    const menu = document.getElementById('mobile-products-menu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      menu.classList.toggle('hidden');
      const chevron = btn.querySelector('.lucide-chevron-down');
      if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        btn.setAttribute('aria-expanded', 'false');
        menu.classList.add('hidden');
        const chevron = btn.querySelector('.lucide-chevron-down');
        if (chevron) chevron.style.transform = 'rotate(0deg)';
      }
    });
  }

  /* ─── Hero product tabs on home page ──────────────────────────────── */
  function initHeroTabs() {
    const hero = document.querySelector('main > section:first-of-type .relative.z-30');
    if (!hero) return;
    const tabs = hero.querySelectorAll('.flex.items-center button.rounded-full');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const label = tab.textContent.trim().toLowerCase();
        const routes = { cli: '/cli', desktop: '/desktop', web: '/web', cloud: '/cloud', chat: '/chat' };
        if (routes[label]) {
          window.location.href = routes[label];
        }
      });
    });
  }

  /* ─── Expandable install / quick-start dropdowns ──────────────────── */
  function initExpandables() {
    document.querySelectorAll('button[aria-expanded]').forEach(btn => {
      // Skip mobile menu (handled above) and FAQ (handled separately)
      if (btn.hasAttribute('aria-haspopup')) return;
      if (btn.closest('.faq-item')) return;

      // Install guide / quick start buttons
      const panel = btn.nextElementSibling;
      if (!panel) return;

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        panel.style.display = isOpen ? 'none' : 'block';
        const chevron = btn.querySelector('.lucide-chevron-down');
        if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });
    });
  }

  /* ─── Hero terminal model cycling ────────────────────────────────── */
  function initHeroModelCycle() {
    const slot = document.querySelector('[data-hero-model-slot]');
    if (!slot) return;

    const FALLBACK_MODELS = [
      'nemotron-3-super',
      'deepseek-r1:70b',
      'deepseek-coder-v2',
      'llama3.1:70b',
      'gemma4:26b',
      'gpt-oss:20b',
      'hermes3'
    ];

    function buildItem(name) {
      const el = document.createElement('span');
      el.className = 'lp-hero-models__item';
      el.innerHTML = '<span class="lp-hero-models__name">' + name.replace(/</g, '&lt;') + '</span>';
      return el;
    }

    function setModels(names) {
      // keep the currently visible first item so the first transition is clean
      slot.innerHTML = '';
      names.slice(0, 12).forEach(name => slot.appendChild(buildItem(name)));
      const items = Array.from(slot.children);
      if (!items.length) return;
      items.forEach((it, i) => { if (i !== 0) it.classList.remove('is-active'); });
      items[0].classList.add('is-active');

      let index = 0;
      const interval = Math.max(3000, 2400); // slow, official-feeling cadence
      setInterval(() => {
        const current = items[index];
        index = (index + 1) % items.length;
        const next = items[index];
        if (current) current.classList.remove('is-active');
        if (next) next.classList.add('is-active');
      }, interval);
    }

    fetch('/api/tags', { signal: AbortSignal.timeout(5000) })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('tags failed')))
      .then(data => {
        const models = (data.models || []).map(m => m.name).filter(Boolean);
        if (models.length) {
          setModels(models);
        } else {
          setModels(FALLBACK_MODELS);
        }
      })
      .catch(() => setModels(FALLBACK_MODELS));
  }

  /* ─── Init ───────────────────────────────────────────────────────── */
  whenReady(() => {
    initHeroReveal();
    initScrollReveals();
    initPricingBars();
    initMountainParallax();
    initHeader();
    initFooterParallax();
    initCopyButtons();
    initFAQs();
    initSmoothScroll();
    initMobileMenu();
    initHeroTabs();
    initExpandables();
    initHeroModelCycle();
  });
})();
