#!/usr/bin/env python3
"""Generate VitePress docs from the Wingport documentation source file."""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DOCS_ROOT = REPO_ROOT / "docs"

# Accept source path as an argument, or look for the session attachment.
if len(sys.argv) > 1:
    SOURCE = Path(sys.argv[1])
else:
    default_attachment = Path(
        "/home/ubuntu/attachments/f3aa8202-2571-4afd-b953-454a6cc66d1c/pasted-1784386173913.md"
    )
    SOURCE = default_attachment

BANNER = "> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.\n\n"

PAGE_ANCHORS = {
    "#page-roadmap": "/reference/roadmap",
    "#page-error-handling": "/dart-sdk/error-handling",
    "#page-installation": "/installation",
}

PAGE_PATHS = {
    "Introduction": "index.md",
    "Comparison": "comparison.md",
    "Installation": "installation.md",
    "Basic Usage": "basic-usage.md",
    "Architecture": "concepts/architecture.md",
    "Gateway Configuration": "concepts/gateway-configuration.md",
    "Authentication": "concepts/authentication.md",
    "Usage & Quotas": "concepts/usage-quotas.md",
    "Providers & Fallback": "concepts/providers-fallback.md",
    "Streaming & Resilience": "concepts/streaming-resilience.md",
    "Security Model": "concepts/security-model.md",
    "Database": "concepts/database.md",
    "Dart SDK — Client": "dart-sdk/client.md",
    "Dart SDK — Generating Text": "dart-sdk/generating-text.md",
    "Dart SDK — Streaming": "dart-sdk/streaming.md",
    "Dart SDK — Error Handling": "dart-sdk/error-handling.md",
    "Dart SDK — Cancellation & Lifecycle": "dart-sdk/cancellation-lifecycle.md",
    "Providers — Anthropic / OpenAI / Google": "providers/index.md",
    "Plugins — Overview": "plugins/index.md",
    "Deployment": "deployment/index.md",
    "Reference — Gateway HTTP API": "reference/gateway-http-api.md",
    "Reference — CLI": "reference/cli.md",
    "Reference — Roadmap": "reference/roadmap.md",
}


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def clean_inline_md(text: str) -> str:
    """Convert **bold** in inline text to <strong>."""
    text = re.sub(r"\*\*(.*?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"__(.*?)__", r"<strong>\1</strong>", text)
    return text


def replace_roadmap_outside_code(content: str) -> str:
    """Replace [ROADMAP] markers with a VitePress Badge, skipping triple-backtick code blocks."""
    parts = re.split(r"(```[\s\S]*?```)", content)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r"`?\[ROADMAP\]`?", '<Badge type="info" text="Planned" />', parts[i])
    return "".join(parts)


def convert_callouts(content: str) -> str:
    """Convert blockquote callouts into VitePress custom containers."""
    lines = content.splitlines(keepends=True)
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(
            r"^>\s*\*\*(Note|Warning|Design principle):\*\*\s*(.*)\n?$",
            line,
            re.IGNORECASE,
        )
        if m:
            label = m.group(1).strip()
            kind = "warning" if label.lower() == "warning" else "tip"
            rest_text = m.group(2).strip()
            out.append(f"\n:::{kind} {label}\n")
            if rest_text:
                out.append(f"{rest_text}\n")
            i += 1
            while i < len(lines) and lines[i].strip().startswith(">"):
                stripped = re.sub(r"^>\s?", "", lines[i].rstrip())
                out.append(f"{stripped}\n")
                i += 1
            out.append(":::\n\n")
            continue
        out.append(line)
        i += 1
    return "".join(out)


def parse_markdown_table(table_text: str) -> list[tuple[str, str]]:
    """Parse a two-column markdown table into rows."""
    rows = []
    for line in table_text.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.split("|")[1:-1]]
        if len(cells) == 2 and cells[0] and cells[1]:
            if set(cells[0]) <= {"-", " ", "|"} or set(cells[1]) <= {"-", " ", "|"}:
                continue
            rows.append((cells[0], cells[1]))
    return rows


def features_grid_html(table_text: str) -> str:
    rows = parse_markdown_table(table_text)
    cards = "\n".join(
        f'<div class="feature-card"><h3>{clean_inline_md(title)}</h3><p>{clean_inline_md(desc)}</p></div>'
        for title, desc in rows
    )
    return f'<div class="features-grid">\n{cards}\n</div>\n'


def transform_features_table(content: str) -> str:
    """Replace the Features markdown table with an HTML grid."""
    pattern = re.compile(r"(## Features\n\n)(.*?)(?=\n## |\Z)", re.DOTALL)

    def repl(m):
        heading = m.group(1)
        table_text = m.group(2)
        return heading + features_grid_html(table_text) + "\n"

    return pattern.sub(repl, content)


def fix_page_anchors(content: str) -> str:
    for anchor, link in PAGE_ANCHORS.items():
        content = content.replace(anchor, link)
    return content


def transform_content(content: str, title: str) -> str:
    content = replace_roadmap_outside_code(content)
    content = convert_callouts(content)
    content = fix_page_anchors(content)
    if title == "Introduction":
        content = transform_features_table(content)
    return content


def parse_pages(source: str) -> dict[str, str]:
    pages = {}
    current_title = None
    current_lines = []
    for line in source.splitlines(keepends=True):
        if line.startswith("## PAGE:"):
            if current_title is not None:
                pages[current_title] = "".join(current_lines).strip()
            current_title = line.replace("## PAGE:", "").strip()
            current_lines = []
        else:
            if current_title is not None:
                current_lines.append(line)
    if current_title is not None:
        pages[current_title] = "".join(current_lines).strip()
    return pages


def write_page(title: str, raw_content: str, rel_path: str):
    path = DOCS_ROOT / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)

    display_title = title.split(" — ")[-1].strip()
    frontmatter = f"---\ntitle: {display_title}\n---\n\n"

    body = raw_content.rstrip()
    while body.endswith("---"):
        body = body[:-3].rstrip()

    body = transform_content(body, title)
    content = frontmatter + BANNER + body + "\n"
    path.write_text(content, encoding="utf-8")


def write_config():
    config = DOCS_ROOT / ".vitepress" / "config.ts"
    config.parent.mkdir(parents=True, exist_ok=True)
    config.write_text(
        """import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Wingport',
  description: 'Open-source AI layer for Flutter apps.',
  base: '/',
  cleanUrls: true,
  appearance: { initialValue: 'dark' },
  head: [
    ['meta', { name: 'theme-color', content: '#18181b' }],
  ],
  themeConfig: {
    siteTitle: 'Wingport',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/' },
      { text: 'GitHub', link: 'https://github.com/hayattofik-01/wingport' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Comparison', link: '/comparison' },
          { text: 'Installation', link: '/installation' },
          { text: 'Basic Usage', link: '/basic-usage' },
        ],
      },
      {
        text: 'Concepts',
        collapsed: false,
        items: [
          { text: 'Architecture', link: '/concepts/architecture' },
          { text: 'Gateway Configuration', link: '/concepts/gateway-configuration' },
          { text: 'Authentication', link: '/concepts/authentication' },
          { text: 'Usage & Quotas', link: '/concepts/usage-quotas' },
          { text: 'Providers & Fallback', link: '/concepts/providers-fallback' },
          { text: 'Streaming & Resilience', link: '/concepts/streaming-resilience' },
          { text: 'Security Model', link: '/concepts/security-model' },
          { text: 'Database', link: '/concepts/database' },
        ],
      },
      {
        text: 'Dart SDK',
        collapsed: false,
        items: [
          { text: 'Client', link: '/dart-sdk/client' },
          { text: 'Generating Text', link: '/dart-sdk/generating-text' },
          { text: 'Streaming', link: '/dart-sdk/streaming' },
          { text: 'Error Handling', link: '/dart-sdk/error-handling' },
          { text: 'Cancellation & Lifecycle', link: '/dart-sdk/cancellation-lifecycle' },
        ],
      },
      {
        text: 'Providers',
        collapsed: false,
        items: [
          { text: 'Anthropic', link: '/providers/#anthropic' },
          { text: 'OpenAI', link: '/providers/#openai' },
          { text: 'Google', link: '/providers/#google' },
        ],
      },
      {
        text: 'Plugins',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/plugins/' },
          { text: 'Spend Caps', link: '/plugins/#spend-caps' },
          { text: 'Response Caching', link: '/plugins/#response-caching' },
          { text: 'Moderation', link: '/plugins/#moderation' },
          { text: 'Analytics', link: '/plugins/#analytics' },
        ],
      },
      {
        text: 'Deployment',
        collapsed: false,
        items: [
          { text: 'Supabase', link: '/deployment/' },
          { text: 'Firebase', link: '/deployment/#firebase' },
          { text: 'Self-hosted (Dart/Shelf)', link: '/deployment/#self-hosted-dart-shelf' },
          { text: 'Wingport Cloud', link: '/deployment/#wingport-cloud' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Gateway HTTP API', link: '/reference/gateway-http-api' },
          { text: 'CLI', link: '/reference/cli' },
          { text: 'Configuration Options', link: '/reference/configuration-options' },
          { text: 'Roadmap', link: '/reference/roadmap' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hayattofik-01/wingport' },
    ],
    search: {
      provider: 'local',
    },
    outline: {
      level: [2, 3],
    },
  },
})
""",
        encoding="utf-8",
    )


def write_theme():
    style = DOCS_ROOT / ".vitepress" / "theme" / "style.css"
    style.parent.mkdir(parents=True, exist_ok=True)
    style.write_text(
        """:root {
  --vp-c-bg: #0b0b0c;
  --vp-c-bg-alt: #131316;
  --vp-c-bg-elv: #1c1c1f;
  --vp-c-divider: #27272a;
  --vp-c-text-1: #fafafa;
  --vp-c-text-2: #a1a1aa;
  --vp-c-brand-1: #60a5fa;
  --vp-c-brand-2: #3b82f6;
  --vp-c-brand-soft: rgba(59, 130, 246, 0.16);
  --vp-font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --vp-font-family-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace;
  --vp-code-block-bg: #09090b;
  --vp-code-copy-code-bg: #27272a;
  --vp-code-copy-code-hover-bg: #3f3f46;
  --vp-custom-block-tip-bg: rgba(59, 130, 246, 0.08);
  --vp-custom-block-tip-border: #3b82f6;
  --vp-custom-block-warning-bg: rgba(234, 179, 8, 0.08);
  --vp-custom-block-warning-border: #eab308;
}

html.dark .vp-doc blockquote,
.vp-doc blockquote {
  background: rgba(234, 179, 8, 0.08);
  border-left: 4px solid #eab308;
  border-radius: 0 6px 6px 0;
  padding: 0.75rem 1rem;
  color: var(--vp-c-text-1);
  font-style: normal;
}

.vp-doc blockquote > p {
  margin: 0;
  font-style: normal;
}

.vp-doc .features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.vp-doc .feature-card {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 1.25rem;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.vp-doc .feature-card:hover {
  transform: translateY(-2px);
  border-color: var(--vp-c-brand-1);
}

.vp-doc .feature-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--vp-c-brand-1);
}

.vp-doc .feature-card h3 strong {
  color: inherit;
}

.vp-doc .feature-card p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
  line-height: 1.5;
}

.VPBadge.info {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  border: 1px solid var(--vp-c-brand-1);
}
""",
        encoding="utf-8",
    )

    index = DOCS_ROOT / ".vitepress" / "theme" / "index.ts"
    index.write_text(
        """import DefaultTheme from 'vitepress/theme'
import './style.css'

export default DefaultTheme
""",
        encoding="utf-8",
    )


def write_configuration_options_placeholder():
    path = DOCS_ROOT / "reference" / "configuration-options.md"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        """---
title: Configuration Options
---

> 🚧 Wingport is in active development. The API described here is the v0.1 design. Star the repo to follow along, or join the early access list.

# Configuration Options

For a full breakdown of every available gateway configuration option, see the [Gateway Configuration](../concepts/gateway-configuration) guide.

The gateway config is a single typed object in `wingport.config.ts` covering auth, providers, limits, fallback, guards, and plugins.
""",
        encoding="utf-8",
    )


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Source file not found: {SOURCE}")

    source_text = SOURCE.read_text(encoding="utf-8")
    pages = parse_pages(source_text)

    for title, rel_path in PAGE_PATHS.items():
        if title not in pages:
            print(f"Warning: missing page {title}")
            continue
        write_page(title, pages[title], rel_path)

    write_configuration_options_placeholder()
    write_config()
    write_theme()
    print(f"Generated {len(PAGE_PATHS)} docs pages to {DOCS_ROOT}")


if __name__ == "__main__":
    main()
