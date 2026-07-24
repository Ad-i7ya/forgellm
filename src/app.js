/* ═══════════════════════════════════════════════════════════════════════════
   ForgeLLM — App JavaScript
   Handles landing page animations, copy buttons, FAQ accordions, and header.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  function whenReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  // ─── Scroll / load reveal for elements with hidden inline styles ───
  function revealElement(el) {
    el.style.opacity = '1';
    if (/translateY\s*\(/i.test(el.style.transform || '')) {
      el.style.transform = el.style.transform.replace(/translateY\([^)]+\)/, 'translateY(0)');
    } else if (/\btransform:\s*none\b/i.test(el.getAttribute('style') || '')) {
      el.style.transform = 'translateY(0)';
    }
  }

  function initReveals() {
    const els = Array.from(document.querySelectorAll('[style*="opacity:0"], [style*="opacity: 0"]'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
          revealElement(el);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });

    els.forEach(el => observer.observe(el));

    // Also reveal .lp-gpu elements on load with a stagger
    const gpus = Array.from(document.querySelectorAll('.lp-gpu'));
    gpus.forEach((el, i) => {
      if (!el.style.opacity) el.style.opacity = '0';
      setTimeout(() => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        revealElement(el);
      }, 100 + i * 60);
    });
  }

  // ─── Header gradient fade on scroll ────────────────────────────────
  function initHeader() {
    const header = document.querySelector('header.lp-gpu');
    if (!header) return;
    const bg = header.querySelector('[aria-hidden="true"]');
    window.addEventListener('scroll', () => {
      if (bg) bg.style.opacity = String(Math.min(window.scrollY / 300, 1));
    }, { passive: true });
  }

  // ─── Copy buttons (install command, code blocks) ────────────────────
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const cmd = btn.dataset.cmd || '';
        try {
          await navigator.clipboard.writeText(cmd);
          const original = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4 text-forest-bright"><path d="M20 6 9 17l-5-5"/></svg>';
          setTimeout(() => { btn.innerHTML = original; }, 2000);
        } catch (e) {}
      });
    });

    // Reference copy buttons: inside command blocks with aria-label="Copy"
    document.querySelectorAll('button[aria-label="Copy"], button[aria-label="Copy install command"]').forEach(btn => {
      if (btn.classList.contains('copy-btn')) return;
      btn.addEventListener('click', async () => {
        const wrapper = btn.closest('.flex, .inline-flex');
        const textEl = wrapper ? wrapper.querySelector('code, span.flex-1, .text-white\\/90') : null;
        const text = textEl ? textEl.textContent.trim() : '';
        if (!text) return;
        try {
          await navigator.clipboard.writeText(text);
          const original = btn.innerHTML;
          btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check h-4 w-4 text-forest-bright"><path d="M20 6 9 17l-5-5"/></svg>';
          setTimeout(() => { btn.innerHTML = original; }, 2000);
        } catch (e) {}
      });
    });
  }

  // ─── FAQ accordion (reference uses buttons followed by a content div) ───
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
          content.style.transition = 'max-height 0.3s ease, opacity 0.3s ease';
          content.style.maxHeight = (content.scrollHeight || 200) + 'px';
          content.style.opacity = '1';
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  // ─── Mountain parallax on hero ─────────────────────────────────────
  function initParallax() {
    const hero = document.querySelector('section.relative isolate') || document.querySelector('main');
    if (!hero) return;
    const hills = hero.querySelectorAll('img[src*="hills-bg"], img[src*="bushes-fg"], img[src*="sky-bg"]');
    if (!hills.length) return;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      hills.forEach(img => {
        const speed = img.src.includes('bushes') ? 0.08 : img.src.includes('hills') ? 0.05 : 0.02;
        img.style.transform = `translateY(${y * speed}px)`;
      });
    }, { passive: true });
  }

  // ─── Init ──────────────────────────────────────────────────────────
  whenReady(() => {
    initReveals();
    initHeader();
    initCopyButtons();
    initFAQs();
    initParallax();
  });
})();
