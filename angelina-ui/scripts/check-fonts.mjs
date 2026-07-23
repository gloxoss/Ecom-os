// Font-load debugger: crawls a running app instance, finds every font the CSS
// declares, fetches each one, and reports whether it actually loads.
// Usage: node scripts/check-fonts.mjs [url]   (default http://localhost:3000)

const base = process.argv[2] ?? "http://localhost:3000";

const abs = (u) => new URL(u, base).href;

async function main() {
  console.log(`\nFont check against ${base}\n`);

  const html = await (await fetch(base)).text();

  // 1. Font preloads emitted by next/font
  const preloads = [...html.matchAll(/<link[^>]+rel="preload"[^>]+href="([^"]+\.(?:woff2?|ttf|otf))"/g)].map((m) => m[1]);

  // 2. Stylesheets -> @font-face src urls + family names
  const cssHrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  const fonts = new Map(); // url -> { family, from }
  for (const href of preloads) fonts.set(abs(href), { family: "(preload)", from: "html" });

  for (const href of cssHrefs) {
    const css = await (await fetch(abs(href))).text();
    for (const face of css.matchAll(/@font-face\s*\{[^}]*\}/g)) {
      const family = face[0].match(/font-family:\s*(["']?)([^;"']+)\1/)?.[2] ?? "?";
      for (const u of face[0].matchAll(/url\((["']?)([^)"']+)\1\)/g)) {
        const url = abs(u[2].startsWith("/") ? u[2] : new URL(u[2], abs(href)).pathname);
        fonts.set(url, { family, from: href.split("/").pop() });
      }
    }
  }

  if (fonts.size === 0) {
    console.log("✗ No fonts found in HTML preloads or CSS @font-face — nothing is being loaded.");
    process.exit(1);
  }

  let failed = 0;
  for (const [url, meta] of fonts) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const kb = (buf.byteLength / 1024).toFixed(1);
      const ok = res.ok && buf.byteLength > 1000;
      if (!ok) failed++;
      console.log(`${ok ? "✓" : "✗"} [${res.status}] ${kb.padStart(7)} KB  ${meta.family.padEnd(24)} ${url.replace(base, "")}`);
    } catch (e) {
      failed++;
      console.log(`✗ [ERR] ${meta.family.padEnd(24)} ${url} — ${e.message}`);
    }
  }

  console.log(failed === 0 ? `\n✓ All ${fonts.size} font file(s) load correctly.\n` : `\n✗ ${failed}/${fonts.size} font file(s) FAILED to load.\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`✗ Could not reach ${base} — is the app running? (${e.message})`);
  process.exit(1);
});
