#!/usr/bin/env python3
"""Polish pass: remove Freebuff/Codebuff/Discord references and add Telegram/GitHub footer."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

NEW_FOOTER = '''<section class="relative overflow-hidden bg-black"><div class="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,#000000_0%,#04070c_42%,#080d16_72%,#0b1422_100%)]"></div><div class="relative z-20 mx-auto max-w-6xl px-6 pt-24 md:pt-32"><div style="transform:none" class="will-change-transform"><p class="text-center lp-serif text-xl text-white/90 md:text-3xl lp-reveal">We just killed paid coding agents</p></div></div><div class="relative mt-10 h-[46vh] min-h-[360px] select-none md:mt-12 md:h-[56vh]"><div style="transform:none" class="will-change-transform absolute inset-x-0 bottom-[clamp(64px,calc(10vw-30px),240px)] z-0"><h2 aria-label="forgellm" class="lp-hero-heading lp-giant-text bg-gradient-to-b from-white via-white/80 to-white/20 bg-clip-text text-center font-medium leading-none tracking-tight text-transparent" style="font-size:clamp(3.25rem, 13vw, 11rem)">forgellm</h2></div><img src="/landing/hills-bg.webp" alt="" aria-hidden="true" decoding="async" draggable="false" class="pointer-events-none absolute inset-x-0 bottom-[8%] z-[1] h-[clamp(150px,26vw,380px)] w-full select-none object-cover object-bottom opacity-30 brightness-[0.5] saturate-[0.7]"/><img src="/landing/bushes-fg.webp" alt="" aria-hidden="true" decoding="async" draggable="false" class="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[clamp(130px,22vw,440px)] w-full origin-bottom select-none object-cover object-bottom brightness-[0.5] saturate-[0.8]"/></div><div class="relative z-20 border-t border-white/10 bg-black"><div class="mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-7 md:flex-row md:items-center md:justify-between"><nav class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-white/45"><a href="/cli" class="transition-colors hover:text-white">CLI</a><a href="/desktop" class="transition-colors hover:text-white">Desktop<span class="ml-1 align-super text-[8px] font-medium uppercase tracking-wide text-forest-bright/70">beta</span></a><a href="/web" class="transition-colors hover:text-white">Web</a><a href="/cloud" class="transition-colors hover:text-white">Cloud<span class="ml-1 align-super text-[8px] font-medium uppercase tracking-wide text-forest-bright/70">beta</span></a><a href="/chat" class="transition-colors hover:text-white">Chat</a><a href="/blog" class="transition-colors hover:text-white">Blog</a><a href="/live" class="transition-colors hover:text-white">Live</a><a href="/privacy-policy" class="transition-colors hover:text-white">Privacy Policy</a><a href="/terms-of-service" class="transition-colors hover:text-white">Terms of Service</a></nav><div class="flex items-center gap-4"><span class="text-xs text-white/30">© 2026 ForgeLLM. All rights reserved.</span><span class="h-4 w-px bg-white/10"></span><div class="flex items-center gap-3"><a aria-label="Blog" href="/blog" class="flex items-center rounded-md p-1.5 text-white/50 transition-colors hover:text-white" data-state="closed"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z"></path><path d="M16 8 2 22"></path><path d="M17.5 15H9"></path></svg></a><a href="https://t.me/te4m1ord" target="_blank" rel="noopener noreferrer" aria-label="Telegram @te4m1ord" class="flex items-center rounded-md p-1.5 text-white/50 transition-colors hover:text-white" data-state="closed"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.08-.18-.09-.05-.21-.02-.3.01-.12.04-1.92 1.25-5.44 3.63-.51.35-.97.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.5.17.11.12.14.28.14.42-.01.07-.02.18-.03.25z"/></svg></a><a href="https://t.me/kzr0x" target="_blank" rel="noopener noreferrer" aria-label="Telegram @kzr0x" class="flex items-center rounded-md p-1.5 text-white/50 transition-colors hover:text-white" data-state="closed"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.08-.18-.09-.05-.21-.02-.3.01-.12.04-1.92 1.25-5.44 3.63-.51.35-.97.53-1.39.52-.46-.01-1.33-.26-1.98-.48-.8-.27-1.43-.42-1.37-.89.03-.25.38-.51 1.03-.78 4.04-1.76 6.74-2.92 8.09-3.48 3.85-1.6 4.64-1.88 5.17-1.89.11 0 .37.03.5.17.11.12.14.28.14.42-.01.07-.02.18-.03.25z"/></svg></a><a href="https://github.com/YOUR_USERNAME/forgellm" target="_blank" rel="noopener noreferrer" aria-label="GitHub" class="flex items-center rounded-md p-1.5 text-white/50 transition-colors hover:text-white" data-state="closed"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"/></svg></a><a href="https://github.com/YOUR_USERNAME/forgellm" target="_blank" rel="noopener noreferrer" aria-label="Star ForgeLLM on GitHub" class="items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white inline-flex" data-state="closed"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-[16px] w-[16px] shrink-0"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.523 2 12 2Z"/></svg><span class="text-xs font-medium tabular-nums">…</span><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star h-3 w-3 shrink-0 fill-current opacity-80"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg></a></div></div></div></div></section>'''

def clean_html(text: str) -> str:
    # Brand names
    text = text.replace('Codebuff', 'ForgeLLM')
    text = text.replace('codebuff', 'forgellm')
    text = text.replace('Freebuff', 'ForgeLLM')
    text = text.replace('freebuff', 'forgellm')
    # Remove Discord anchors
    text = re.sub(r'<a\s+[^>]*href="https://discord\.gg/[^"]*"[^>]*>.*?</a>', '', text, flags=re.DOTALL)
    return text

def main():
    for path in SRC.rglob('*'):
        if not path.is_file():
            continue
        if path.suffix.lower() not in ('.html', '.css', '.js'):
            continue
        try:
            content = path.read_text(encoding='utf-8', errors='ignore')
        except Exception as e:
            print(f'skip {path}: {e}')
            continue
        original = content
        if path.suffix.lower() == '.css':
            content = content.replace('Freebuff.com replica', 'original freebuff.com landing replica')
            content = content.replace('Freebuff-style', 'premium landing page')
        content = content.replace('Codebuff', 'ForgeLLM')
        content = content.replace('codebuff', 'forgellm')
        content = content.replace('Freebuff', 'ForgeLLM')
        content = content.replace('freebuff', 'forgellm')
        if path.suffix.lower() == '.html':
            content = re.sub(r'<a\s+[^>]*href="https://discord\.gg/[^"]*"[^>]*>.*?</a>', '', content, flags=re.DOTALL)
            # Replace footer section (only one per file)
            content = re.sub(r'(?s)<section class="relative overflow-hidden bg-black">.*?</section>', NEW_FOOTER, content)
        if content != original:
            path.write_text(content, encoding='utf-8')
            print(f'updated {path}')
        else:
            print(f'no change {path}')

if __name__ == '__main__':
    main()
