# Contracts (spec 005)

| Action | Input | Result | Errors |
|--------|-------|--------|--------|
| `saveIdentity` | identity ≤ 2,000 | `ok(null)` | `invalid_input`, `forbidden` |
| `saveDomainArea` | focusAreaId, description ≤ 500, sign ≤ 300, reviewOn? | `ok(null)` | `invalid_input`, `not_found` |
| `refreshChallenge` | — | `ok(null)` | `limit_reached`, `conflict` (done or journey day) |
| `completePlanReview` | nextReviewOn (tomorrow … +365) | redirect `/plan` | `invalid_input` |
| `upsertLibraryChallenge` (admin) | id?, domainId, style, title, prompt?, habitName?, sortOrder, active | `ok(null)` | `forbidden`, `invalid_input` |

| Route | Change |
|-------|--------|
| `/plan` | «هويّتي», domain cards, «حان موعد مراجعتك» |
| `/plan/review` | new 3-step review |
| `/` | library challenge with ↻; review-due card |
| `/habits/new?from=journey` | library challenge → linked habit name + domain |
| `/admin/content?tab=challengeLibrary` | new tab |
