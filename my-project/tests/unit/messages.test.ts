import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import messages from "../../messages/ar.json";

/** Constitution I: every UI string lives in messages/ar.json and is Arabic. */

type Tree = { [k: string]: string | Tree };
const root = messages as unknown as Tree;

function leaves(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : leaves(v, `${prefix}${k}.`)));
}

function lookup(key: string): string | Tree | undefined {
  return key.split(".").reduce<string | Tree | undefined>((node, part) => (node && typeof node === "object" ? node[part] : undefined), root);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? sourceFiles(full) : /\.(tsx?|mts)$/.test(name) ? [full] : [];
  });
}

/** Finds `const t = useTranslations("ns")` / `getTranslations("ns")` and every `t("key")` call. */
function usedKeys(): { file: string; key: string; dynamicPrefix: boolean }[] {
  const out: { file: string; key: string; dynamicPrefix: boolean }[] = [];
  for (const file of sourceFiles(path.join(process.cwd(), "src"))) {
    const code = readFileSync(file, "utf8");
    const bindings = new Map<string, string>();
    for (const m of code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:use|get)Translations\(\s*"([^"]+)"\s*\)/g)) {
      bindings.set(m[1]!, m[2]!);
    }
    // Scoped bindings like getTranslations({ locale, namespace: "meta" }) are checked per function.
    for (const m of code.matchAll(/(?:const|let)\s+(\w+)\s*=\s*await\s+getTranslations\(\{[^}]*namespace:\s*"([^"]+)"[^}]*\}\)([\s\S]*?)\n\}/g)) {
      for (const k of m[3]!.matchAll(new RegExp(`\\b${m[1]}\\(\\s*"([^"]+)"`, "g"))) out.push({ file, key: `${m[2]}.${k[1]}`, dynamicPrefix: false });
    }
    const scoped = code.replace(/(?:const|let)\s+\w+\s*=\s*await\s+getTranslations\(\{[^}]*\}\)[\s\S]*?\n\}/g, "");
    for (const m of code.matchAll(/const\s*\[\s*([\w\s,]+)\]\s*=\s*await\s+Promise\.all\(\[([\s\S]*?)\]\)/g)) {
      const names = m[1]!.split(",").map((s) => s.trim());
      const calls = [...m[2]!.matchAll(/(?:get|use)Translations\("([^"]+)"\)|[\w.]+\([^)]*\)/g)];
      names.forEach((name, i) => {
        const ns = calls[i]?.[1];
        if (name && ns) bindings.set(name, ns);
      });
    }
    for (const [name, ns] of bindings) {
      for (const m of scoped.matchAll(new RegExp(`\\b${name}\\(\\s*("([^"]+)"|\`([^\`$]*)\\$\\{)`, "g"))) {
        if (m[2]) out.push({ file, key: `${ns}.${m[2]}`, dynamicPrefix: false });
        else if (m[3] !== undefined) out.push({ file, key: `${ns}.${m[3].replace(/\.$/, "")}`, dynamicPrefix: true });
      }
    }
  }
  return out;
}

describe("messages/ar.json", () => {
  it("has every key the code uses", () => {
    const missing = usedKeys()
      .filter(({ key, dynamicPrefix }) => (dynamicPrefix ? typeof lookup(key) !== "object" : typeof lookup(key) !== "string"))
      .map(({ file, key }) => `${key}  (${path.relative(process.cwd(), file)})`);
    expect(missing).toEqual([]);
  });

  it("finds a meaningful number of keys (scanner sanity check)", () => {
    expect(usedKeys().length).toBeGreaterThan(150);
  });

  it("contains Arabic in every value (no untranslated text)", () => {
    // A value may lack Arabic letters only when it is a pure template (placeholders and punctuation).
    const notArabic = leaves(root).filter(([, v]) => !/[؀-ۿ]/.test(v) && /\p{L}/u.test(v.replace(/\{[^}]+\}/g, "")));
    expect(notArabic).toEqual([]);
  });

  it("uses calm language: no exclamation marks or gamified words", () => {
    const loud = leaves(root).filter(([, v]) => /[!！]|نقاط|شارة|مستوى|لوحة الصدارة|مبروك/.test(v));
    expect(loud).toEqual([]);
  });
});
