# Quickstart run: «أثرك ← أنا» Stats (T008)

**Date**: 2026-11-22 · cloud container (local PostgreSQL + pgTAP; signed-in e2e runs in CI).

| Check | Result |
|-------|--------|
| Lint, typecheck | pass |
| Unit | 86/86 (19 files; new `buckets`) |
| Database (both modes) | 363/363; `impact_stats.test.sql` 14 assertions (grace forgives one miss a week, breaks on more, flag; consecutive days; day/week/month buckets; plan vs others; all domains; member-only) |
| Build / «يومك» JS | pass / 168.4 KB gzipped |
| e2e | not run here; new `us-impact-stats.spec.ts`; screenshots extended |

Rendered checks (dev preview `/dev/stats-preview`, three versions): tiles with ring, focused bar with its
value, plan vs others, life areas — axe: no violations in any version. RTL fills start at the right.

Chart colour: `--chart-mark` #2F8A57, checked with the dataviz validator (lightness band, chroma floor,
contrast vs surface: pass). #1F3329 (the previous bar colour) failed the chroma floor (read as grey).

Deviation from the design: «أين تعيش حياتك» is drawn as labelled bars, not a coloured wheel, because the
domains' colour families repeat; identity must not rely on colour (recorded in spec.md).
