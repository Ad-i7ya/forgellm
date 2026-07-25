import re
from pathlib import Path

REPLACEMENTS = {
    'Freebuff Web': 'ForgeLLM Web',
    'Freebuff CLI': 'ForgeLLM CLI',
    'Freebuff Chat': 'ForgeLLM Chat',
    'Freebuff Desktop': 'ForgeLLM Desktop',
    'Freebuff Cloud': 'ForgeLLM Cloud',
    'Freebuff': 'ForgeLLM',
    'freebuff': 'forgellm',
    'CodebuffAI/codebuff': 'YOUR_USERNAME/forgellm',
    'https://codebuff.com': 'https://forgellm.workers.dev',
    'https://freebuff.com': 'https://forgellm.workers.dev',
    'npm i -g freebuff': 'npm install -g forgellm',
    'npm install -g freebuff': 'npm install -g forgellm',
    'freebuff --': 'forgellm --',
    'freebuff': 'forgellm',
    'FreeBlog': 'ForgeBlog',
}

def clean_body(body: str) -> str:
    # Remove all script tags
    body = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', body, flags=re.DOTALL | re.IGNORECASE)
    # Remove Next.js comment markers
    body = re.sub(r'<!--\$-->', '', body)
    body = re.sub(r'<!--\/\$-->', '', body)
    # Replace branding
    for old, new in REPLACEMENTS.items():
        body = body.replace(old, new)
    return body

def process(name: str, out_name: str, title_replace=None):
    path = Path(f'ref/{name}.html')
    s = path.read_text(errors='ignore')
    # Extract body inner
    m = re.search(r'<body[^>]*>(.*)</body>', s, flags=re.DOTALL | re.IGNORECASE)
    if not m:
        raise ValueError(f'No body in {name}')
    body = m.group(1).strip()
    body = clean_body(body)
    # Generate page
    canonical = '' if name == 'home' else name
    head = f'''<!DOCTYPE html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"/>
<meta name="theme-color" content="#0a0a0b"/>
<title>{title_replace or 'ForgeLLM — the free coding agent'}</title>
<meta name="description" content="ForgeLLM is the free coding agent: a free CLI, Web builder, and Chat powered by your own Ollama models. No subscription, no API keys."/>
<meta name="robots" content="index, follow"/>
<link rel="canonical" href="https://forgellm.workers.dev/{canonical}"/>
<link rel="shortcut icon" href="/favicon/favicon-16x16.ico"/>
<link rel="icon" href="/favicon/favicon-32x32.ico"/>
<link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png"/>
<link rel="stylesheet" href="/_next/static/chunks/1oerozbp7voja.css"/>
<link rel="stylesheet" href="/_next/static/chunks/0nfyc9rd0wcna.css"/>
<link rel="stylesheet" href="/_next/static/chunks/2eagstknhj0-o.css"/>
<link rel="stylesheet" href="/_next/static/chunks/2qzuf3imwzuy6.css"/>
<link rel="stylesheet" href="/_next/static/chunks/3h30vwv59wnje.css"/>
<link rel="stylesheet" href="/styles.css"/>
</head>
<body class="flex flex-col min-h-screen font-sans bg-black text-white">
'''
    tail = '''\n<script src="/app.js"></script>\n</body>\n</html>'''
    Path(f'src/{out_name}').write_text(head + body + tail, encoding='utf-8')
    print(f'Wrote src/{out_name} ({len(head)+len(body)+len(tail)} bytes)')

process('home', 'index.html', 'ForgeLLM — the free coding agent')
process('cli', 'cli.html', 'ForgeLLM CLI — the free coding agent for your terminal')
process('web', 'web.html', 'ForgeLLM Web — The 100% free AI app builder')
