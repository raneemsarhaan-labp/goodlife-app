# Quickstart run: Walking Together (T011)

**Date**: 2026-11-22 · cloud container (local PostgreSQL + pgTAP; signed-in e2e runs in CI).

| Check | Result |
|-------|--------|
| Lint, typecheck | pass |
| Unit | 89/89 (20 files; new `private-habits`) |
| Database (both modes) | 387/387; `walking_together.test.sql` 24 assertions: peers see only shared habits of members of their own group; unshared and other groups' habits never; no table access to peers' habits; facilitator gets nothing; sharing toggle; private+shared refused; challenge create (admin only), join, locked habit, «يومك» flag, group counts without names, own participation rows only, withdraw archives; community list beyond 7 days with presenter and «جديد»; closed group's codes rejected |
| Capacity script | pass |
| Build / «يومك» JS | pass / 168.4 KB gzipped |
| e2e | not run here; new `us-walking-together.spec.ts`; a11y sweep and screenshots extended |

Rendered checks: the add flow's step 3 with the share and private switches — axe clean in the three
versions (`/dev/add-habit`). «مجموعتي», «التحدّي» and «المجتمع» read live data through signed-in RPCs and
are covered by the e2e and axe sweep in CI, not rendered here.

Privacy notes
- Peer data comes only from `group_together()` (definer, member-to-member within the caller's active
  group); there is no RLS path from one member to another's habits.
- Private habit names and descriptions never reach the server; the export contains the placeholder.
- No ranking anywhere (FR-083 unchanged): challenge views show the member's own days and group counts.
