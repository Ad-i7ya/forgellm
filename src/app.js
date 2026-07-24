/* ═══════════════════════════════════════════════════════════════════════════
   ForgeLLM — App JavaScript
   Handles landing page animations, copy buttons, and FAQ accordion.
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ─── Scroll-triggered animations ────────────────────────────────────
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseFloat(el.dataset.delay) || 0;
          setTimeout(() => {
            el.style.opacity = '1';
            if (el.dataset.animate === 'slide-up') {
              el.style.transform = 'translateY(0)';
            }
          }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-animate]').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // ─── Header scroll effect ──────────────────────────────────────────
  function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    setTimeout(() => {
      header.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, 200);

    const headerBg = header.querySelector('[aria-hidden="true"]');
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (headerBg) {
        const opacity = Math.min(scrollY / 300, 1);
        headerBg.style.opacity = String(opacity);
      }
    }, { passive: true });
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
          setTimeout(() => { btn.innerHTML = original; }, 2000);
        } catch (e) {
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

  // ─── FAQ Accordion ───────────────────────────────────────────────
  function initFAQs() {
    const triggers = document.querySelectorAll('.faq-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.faq-item');
        if (!item) return;
        const content = item.querySelector('.faq-content');
        const chevron = trigger.querySelector('svg');
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

  // ─── Animate lp-gpu elements ──────────────────────────────────────
  function initGpuAnimations() {
    setTimeout(() => {
      document.querySelectorAll('.lp-gpu').forEach(el => {
        el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        el.style.opacity = '1';
        if (el.style.transform.includes('translateY')) {
          el.style.transform = 'translateY(0)';
        }
      });
    }, 300);
  }

  // ─── Init ──────────────────────────────────────────────────────────
  function init() {
    initHeaderScroll();
    initScrollAnimations();
    initCopyButtons();
    initFAQs();
    initGpuAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
