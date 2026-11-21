#!/usr/bin/env node
// Spec 002 T051 (plan › Performance Goals): first-load JavaScript of «يومك» stays within budget.
// Reads the production build (`npm run build`) and sums the gzipped size of every chunk the page
// needs before it is interactive: the root main files plus the chunks of the page's client
// modules (layouts included). Lazily loaded chunks (the Ionic island) are reported, not counted.
// Usage: node scripts/check-bundle-budget.mjs [route=/(member)/page] [budgetKB=200]
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const route = process.argv[2] ?? "/(member)/page";
const budgetKB = Number(process.argv[3] ?? 200);
const next = path.resolve(".next");
const manifestFile = path.join(next, "server/app", `${route}_client-reference-manifest.js`);
if (!existsSync(manifestFile)) {
  console.error(`No build output for ${route}. Run \`npm run build\` first.`);
  process.exit(2);
}

globalThis.__RSC_MANIFEST = {};
new Function(readFileSync(manifestFile, "utf8"))();
const manifest = globalThis.__RSC_MANIFEST[route];
const { rootMainFiles } = JSON.parse(readFileSync(path.join(next, "build-manifest.json"), "utf8"));

const files = new Set(rootMainFiles);
for (const mod of Object.values(manifest.clientModules)) {
  for (const chunk of mod.chunks ?? []) if (typeof chunk === "string" && chunk.endsWith(".js")) files.add(chunk.replace(/^\/_next\//, ""));
}

const gz = (file) => gzipSync(readFileSync(path.join(next, file))).length;
let total = 0;
for (const file of files) total += gz(file);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

console.log(`${route}: ${files.size} chunks, first-load JS ${kb(total)} gzipped (budget ${budgetKB} KB)`);
if (total > budgetKB * 1024) {
  console.error(`Over budget by ${kb(total - budgetKB * 1024)}.`);
  process.exit(1);
}
