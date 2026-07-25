#!/usr/bin/env python3
"""Inject a shared mobile products dropdown into every HTML page."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"

MENU = '''<div id="mobile-products-menu" class="hidden absolute top-full left-0 right-0 z-40 border-b border-white/10 bg-black/95 px-6 py-4 backdrop-blur-md xl:hidden">
  <div class="mx-auto flex max-w-6xl flex-col gap-2">
    <a href="/cli" class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white">
      <span>CLI</span><span class="text-[10px] uppercase tracking-wide text-forest-bright/90">free</span>
    </a>
    <a href="/desktop" class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white">
      <span>Desktop</span><span class="text-[10px] uppercase tracking-wide text-forest-bright/90">beta</span>
    </a>
    <a href="/web" class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white">
      <span>Web</span><span class="text-[10px] uppercase tracking-wide text-forest-bright/90">free</span>
    </a>
    <a href="/cloud" class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white">
      <span>Cloud</span><span class="text-[10px] uppercase tracking-wide text-forest-bright/90">beta</span>
    </a>
    <a href="/chat" class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/[0.05] hover:text-white">
      <span>Chat</span><span class="text-[10px] uppercase tracking-wide text-forest-bright/90">free</span>
    </a>
  </div>
</div>'''


def add_menu_to_file(path):
    html = path.read_text(encoding="utf-8")
    marker = "</nav>"
    if "mobile-products-menu" in html:
        return False
    # Insert after the first </nav> which closes the products nav in the header
    idx = html.find(marker)
    if idx == -1:
        print(f"Skip {path}: no </nav>")
        return False
    html = html[: idx + len(marker)] + MENU + html[idx + len(marker) :]
    path.write_text(html, encoding="utf-8")
    return True


def main():
    for path in SRC.glob("*.html"):
        if add_menu_to_file(path):
            print(f"Updated {path}")
        else:
            print(f"Skipped {path}")


if __name__ == "__main__":
    main()
