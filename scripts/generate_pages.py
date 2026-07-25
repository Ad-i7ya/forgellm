#!/usr/bin/env python3
"""Generate placeholder pages for missing routes using the shared header/footer from index.html."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
INDEX = SRC / "index.html"

assert INDEX.exists(), f"{INDEX} not found"

index_html = INDEX.read_text(encoding="utf-8")

# Find the header and footer wrappers.
# We treat everything from <body> up to and including </header> as the header,
# and everything from the footer section (the "We just killed paid coding agents" section)
# to the closing tags as the footer.
header_match = re.search(r"(<body[^>]*>.*?)(</header>)", index_html, re.DOTALL)
footer_match = re.search(r"(<section[^>]*class=\"relative overflow-hidden bg-black\">.*?)(</body>)", index_html, re.DOTALL)

if not header_match:
    raise RuntimeError("Could not find header in index.html")
if not footer_match:
    raise RuntimeError("Could not find footer in index.html")

header = header_match.group(0)
footer = footer_match.group(1)

PAGES = {
    "desktop.html": {
        "title": "ForgeLLM Desktop — free desktop coding agent (beta)",
        "heading": "ForgeLLM Desktop",
        "subheading": "A free desktop coding agent, right on your machine.",
        "desc": "Local-first, privacy-focused, and 100% free. Coming soon.",
    },
    "cloud.html": {
        "title": "ForgeLLM Cloud — free cloud coding agent (beta)",
        "heading": "ForgeLLM Cloud",
        "subheading": "A free cloud sandbox + coding agent for any GitHub repo.",
        "desc": "Build, preview, and deploy in the cloud without a credit card. Coming soon.",
    },
    "blog.html": {
        "title": "ForgeLLM Blog — free AI coding agent news, guides and comparisons",
        "heading": "ForgeLLM Blog",
        "subheading": "Guides, comparisons, and updates from the ForgeLLM team.",
        "desc": "New posts coming soon.",
    },
    "live.html": {
        "title": "ForgeLLM Live — developers building with ForgeLLM right now",
        "heading": "ForgeLLM Live",
        "subheading": "See what the community is building with ForgeLLM right now.",
        "desc": "Live feed coming soon.",
    },
    "privacy.html": {
        "title": "Privacy Policy — ForgeLLM",
        "heading": "Privacy Policy",
        "subheading": "How ForgeLLM handles your data.",
        "desc": "ForgeLLM is supported by text ads. We use prompts, messages, code, files, and repository data to provide the service. Where required by law, we provide advertising choices and honor recognized opt-out signals. See our full Privacy Policy for retention and details.",
    },
    "terms.html": {
        "title": "Terms of Service — ForgeLLM",
        "heading": "Terms of Service",
        "subheading": "Terms for using ForgeLLM.",
        "desc": "By using ForgeLLM, you agree to our Terms of Service. These terms govern your use of the ForgeLLM CLI, web interface, and related services. Full terms coming soon.",
    },
}


def make_main(meta):
    return f"""<main class="relative z-10 min-h-screen px-6 pt-32 pb-24 md:pt-40">
  <div class="mx-auto max-w-4xl text-center">
    <h1 class="lp-hero-heading text-balance text-[34px] font-normal leading-[1.1] text-white md:text-[52px] lg:text-[58px]">{meta["heading"]}</h1>
    <p class="mt-4 max-w-2xl mx-auto text-lg text-white/55 md:text-xl">{meta["subheading"]}</p>
    <p class="mt-8 max-w-2xl mx-auto text-base leading-relaxed text-white/45">{meta["desc"]}</p>
    <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
      <a href="/" class="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-normal text-black transition-all hover:bg-white/90">Back home</a>
      <a href="/cli" class="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-normal text-white transition-all hover:bg-white/[0.06]">Try the CLI</a>
    </div>
  </div>
</main>"""


def update_title(html, title):
    return re.sub(r"<title>[^<]+</title>", f"<title>{title}</title>", html)


def remove_hero_only_markup(html):
    # Remove the first <main> section from index.html (the hero) so we can insert our own main.
    # We do this by keeping the header and footer, and replacing the content between </header> and the footer section.
    pattern = r"(</header>)(.*?)(<section[^>]*class=\"relative overflow-hidden bg-black\">)"
    return re.sub(pattern, r"\1{placeholder}\3", html, flags=re.DOTALL)


def main():
    for filename, meta in PAGES.items():
        html = update_title(index_html, meta["title"])
        main_content = make_main(meta)
        # Replace content between </header> and the footer section
        page_html = re.sub(
            r"(</header>)(.*?)(<section[^>]*class=\"relative overflow-hidden bg-black\">)",
            lambda m: f"{m.group(1)}{main_content}{m.group(3)}",
            html,
            flags=re.DOTALL,
        )
        (SRC / filename).write_text(page_html, encoding="utf-8")
        print(f"Generated {SRC / filename}")


if __name__ == "__main__":
    main()
