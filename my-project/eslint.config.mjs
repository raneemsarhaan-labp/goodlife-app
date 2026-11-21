import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Constitution I: RTL by construction. Physical-direction Tailwind utilities are forbidden;
// use logical ones (ms-/me-/ps-/pe-/start-/end-/text-start/text-end/rounded-s/rounded-e).
const PHYSICAL =
  "(^|\\s|:)-?(ml|mr|pl|pr|left|right|scroll-ml|scroll-mr|scroll-pl|scroll-pr|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br)(-|\\s|$)|(^|\\s|:)(text-left|text-right|float-left|float-right|clear-left|clear-right)(\\s|$)";
const message =
  "Use logical Tailwind utilities (ms-, me-, ps-, pe-, start-, end-, text-start, text-end, rounded-s/e) — RTL by construction (constitution I).";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `JSXAttribute[name.name='className'] Literal[value=/${PHYSICAL}/]`, message },
        { selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=/${PHYSICAL}/]`, message },
        { selector: `CallExpression[callee.name='cx'] Literal[value=/${PHYSICAL}/]`, message },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    "public/swe-worker-*.js",
    ".specify/**",
    "specs/**",
    "src/lib/supabase/database.types.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
