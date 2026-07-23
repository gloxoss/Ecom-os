import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const artifactsDir = path.join(root, "artifacts");
const outDir = path.join(artifactsDir, "angelina-pdf-version");
const htmlDir = path.join(outDir, "_html");

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browser = chromeCandidates.find(existsSync);
if (!browser) {
  throw new Error("No local Chrome or Edge executable found for PDF export.");
}

mkdirSync(outDir, { recursive: true });
rmSync(htmlDir, { recursive: true, force: true });
mkdirSync(htmlDir, { recursive: true });

const files = readdirSync(artifactsDir)
  .filter((file) => /^ANGELINA_.*\.md$/i.test(file))
  .sort((a, b) => {
    const order = [
      "ANGELINA_ASSET_ARTIFACT_INDEX.md",
      "ANGELINA_REFERENCE_IMAGE_LINKS.md",
      "ANGELINA_VISUAL_STYLE_GUIDE.md",
      "ANGELINA_ASSET_REPLACEMENT_MAP.md",
      "ANGELINA_PROMPT_LIBRARY.md",
      "ANGELINA_IMAGE_PRODUCTION_RUNBOOK.md",
      "ANGELINA_ASSET_PROMPTS.md",
      "ANGELINA_V2_BEANO_ASSET_LOGIC_AUDIT.md",
      "ANGELINA_V2_OLD_LOGIC_PROMPTS.md",
    ];
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = escapeHtml(href);
    return `<a href="${safeHref}">${label}</a>`;
  });
  return html;
}

function flushList(list, html) {
  if (!list.length) return;
  html.push("<ul>");
  for (const item of list) html.push(`<li>${inlineMarkdown(item)}</li>`);
  html.push("</ul>");
  list.length = 0;
}

function isTableDivider(line) {
  return /^\|\s*:?[-]{3,}:?\s*(\|\s*:?[-]{3,}:?\s*)+\|?$/.test(line.trim());
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  const list = [];
  let paragraph = [];
  let code = [];
  let inCode = false;
  let tableRows = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    html.push("<table>");
    tableRows.forEach((row, index) => {
      const cells = row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => inlineMarkdown(cell.trim()));
      const tag = index === 0 ? "th" : "td";
      html.push("<tr>" + cells.map((cell) => `<${tag}>${cell}</${tag}>`).join("") + "</tr>");
    });
    html.push("</table>");
    tableRows = [];
  };

  const flushCode = () => {
    if (!code.length) return;
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
    code = [];
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        flushParagraph();
        flushList(list, html);
        flushTable();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList(list, html);
      flushTable();
      continue;
    }

    if (trimmed.startsWith("|") && lines[i + 1] && isTableDivider(lines[i + 1])) {
      flushParagraph();
      flushList(list, html);
      tableRows.push(trimmed);
      i += 1;
      continue;
    }

    if (tableRows.length && trimmed.startsWith("|")) {
      tableRows.push(trimmed);
      continue;
    }

    flushTable();

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushParagraph();
      flushList(list, html);
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const bullet = /^-\s+(.+)$/.exec(trimmed);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList(list, html);
  flushTable();
  flushCode();
  return html.join("\n");
}

function pageHtml(title, body) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #3f100a;
      background: #ffffff;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.55;
    }
    h1, h2, h3, h4 {
      color: #3f100a;
      font-family: Georgia, "Times New Roman", serif;
      font-weight: 400;
      line-height: 1.15;
      margin: 18px 0 8px;
      page-break-after: avoid;
    }
    h1 { font-size: 30px; border-bottom: 1px solid #ffcebf; padding-bottom: 10px; }
    h2 { font-size: 20px; margin-top: 24px; }
    h3 { font-size: 15px; color: #aa631a; }
    h4 { font-size: 13px; color: #aa631a; }
    p { margin: 7px 0; }
    ul { margin: 6px 0 12px 18px; padding: 0; }
    li { margin: 3px 0; }
    a { color: #aa631a; text-decoration: none; overflow-wrap: anywhere; }
    code {
      color: #2e1e16;
      background: #fff5f2;
      border-radius: 4px;
      padding: 1px 4px;
      font-family: "Consolas", "Courier New", monospace;
      font-size: 10px;
    }
    pre {
      white-space: pre-wrap;
      word-break: break-word;
      background: #fff5f2;
      border: 1px solid #ffcebf;
      border-radius: 10px;
      padding: 10px;
      margin: 8px 0 12px;
      page-break-inside: avoid;
    }
    pre code { background: transparent; padding: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px;
      table-layout: fixed;
      page-break-inside: auto;
    }
    th, td {
      border: 1px solid #f0d6cc;
      padding: 6px;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      color: #3f100a;
      background: #fff5f2;
      font-weight: 700;
    }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function exportPdf(markdownFile, pdfFile) {
  const source = path.join(artifactsDir, markdownFile);
  const title = markdownFile.replace(/\.md$/i, "").replaceAll("_", " ");
  const htmlPath = path.join(htmlDir, markdownFile.replace(/\.md$/i, ".html"));
  const html = pageHtml(title, markdownToHtml(readFileSync(source, "utf8")));
  writeFileSync(htmlPath, html);

  const result = spawnSync(browser, [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    `--print-to-pdf=${pdfFile}`,
    pathToFileURL(htmlPath).href,
  ], { stdio: "inherit" });

  if (result.status !== 0) {
    throw new Error(`PDF export failed for ${markdownFile}`);
  }
}

for (const file of files) {
  exportPdf(file, path.join(outDir, file.replace(/\.md$/i, ".pdf")));
}

const combinedMarkdown = files
  .map((file) => readFileSync(path.join(artifactsDir, file), "utf8"))
  .join("\n\n<div style=\"page-break-after: always\"></div>\n\n");

const combinedHtml = pageHtml("Angelina Asset Pack", markdownToHtml(combinedMarkdown));
const combinedHtmlPath = path.join(htmlDir, "ANGELINA_ASSET_PACK_COMBINED.html");
writeFileSync(combinedHtmlPath, combinedHtml);

const combined = spawnSync(browser, [
  "--headless",
  "--disable-gpu",
  "--no-sandbox",
  `--print-to-pdf=${path.join(outDir, "ANGELINA_ASSET_PACK_COMBINED.pdf")}`,
  pathToFileURL(combinedHtmlPath).href,
], { stdio: "inherit" });

if (combined.status !== 0) {
  throw new Error("Combined PDF export failed.");
}

rmSync(htmlDir, { recursive: true, force: true });
console.log(`Exported ${files.length + 1} PDFs to ${outDir}`);
