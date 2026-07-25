#!/usr/bin/env python3
"""Generate placeholder pages for footer links."""
import os

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')

PAGES = {
    'comparisons': ('Comparisons', 'See how ForgeLLM stacks up against paid coding agents.'),
    'guides': ('Guides', 'Step-by-step guides for local LLMs, Ollama, and ForgeLLM.'),
    'community': ('Community', 'Join the ForgeLLM community on Telegram and GitHub.'),
    'research': ('Research', 'Read about the open-source models powering ForgeLLM.'),
    'engineering': ('Engineering', 'How ForgeLLM is built for speed, privacy, and local AI.'),
    'launches': ('Launches', 'New releases, betas, and what is coming next.'),
}

TEMPLATE = '''<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#0a0a0b"/>
<title>{title} — ForgeLLM</title>
<meta name="description" content="{description}"/>
<link rel="icon" type="image/png" href="/logo-icon.png"/>
<link rel="apple-touch-icon" href="/logo-icon.png"/>
<link rel="stylesheet" href="/styles.css"/>
<style>
body {{ background:#000; color:#fff; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height:100vh; display:flex; flex-direction:column; }}
header {{ border-bottom:1px solid rgba(255,255,255,0.06); background:#0a0a0b; }}
main {{ flex:1; display:flex; align-items:center; justify-content:center; padding:2rem; text-align:center; }}
.card {{ max-width:520px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.03); border-radius:20px; padding:2rem; }}
h1 {{ font-size:1.75rem; font-weight:500; margin-bottom:0.75rem; }}
p {{ color:rgba(255,255,255,0.55); line-height:1.6; }}
.btn {{ display:inline-flex; align-items:center; gap:0.5rem; margin-top:1.5rem; padding:0.6rem 1.2rem; border-radius:9999px; background:#fff; color:#000; font-weight:500; text-decoration:none; transition:opacity 0.2s; }}
.btn:hover {{ opacity:0.85; }}
footer {{ border-top:1px solid rgba(255,255,255,0.06); padding:1.25rem 1.5rem; text-align:center; font-size:0.8rem; color:rgba(255,255,255,0.35); }}
</style>
</head>
<body>
<header class="px-6 py-4">
  <a href="/" class="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
    <img src="/logo-icon.png" alt="ForgeLLM" class="h-7 w-7 rounded-[5px]"/>
    <span class="font-medium">forgellm</span>
  </a>
</header>
<main>
  <div class="card">
    <h1>{title}</h1>
    <p>{description}</p>
    <a href="/" class="btn">Back to home</a>
  </div>
</main>
<footer>© 2026 ForgeLLM. All rights reserved.</footer>
</body>
</html>'''

for slug, (title, description) in PAGES.items():
    path = os.path.join(SRC, f'{slug}.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write(TEMPLATE.format(title=title, description=description))
    print('Generated', path)
