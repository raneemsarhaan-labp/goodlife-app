# Design gap inventory and roadmap (2026-11-22)

Compares the product owner's designs (Glass Edition, My Day Journey, Full Glass; 2026-11-21) with what
specs 001–003 built. The Glass Edition file is the only design with screens beyond «يومك».

## Product-owner decisions (2026-11-22)

| Topic | Decision |
|-------|----------|
| Group challenge «لوحة الترتيب» | **No ranking.** Show the group's shared progress and the member's own days kept. FR-083 (no leaderboards) and constitution VI unchanged. |
| «أظهر هذه العادة لمجموعتي» | **Peers only**, off by default. Facilitators keep seeing activity signals only (constitution IV unchanged). |
| «عادة خاصّة» | **Build as designed**: the name stays on the device; the server keeps completions only; a placeholder elsewhere; the app explains the limits (other devices, export, clearing browser data). |
| Streak grace | **One forgiven missed scheduled day per calendar week (Saturday–Friday)**; the second miss breaks the streak; shown as «استُعمل الغفران». Applies wherever streaks show. |
| «هويّتي» (default, not asked) | A new private text in «خطتي»; «واقعي الآن» stays. |
| Daily challenge (default, not asked) | The admin's journey challenge for the day keeps priority. Without one, the member gets a library challenge from their plan domains, with a refresh. The own challenge stays. |

## Roadmap

| Spec | Scope | Priority | Status |
|------|-------|----------|--------|
| 004 | **Life domains, habit shape, add-habit flow**: seven admin-managed life domains; plan domains (up to three) map to focus areas; habits gain domain, amount (free text, not tracked), time of day, repeat days. Every "possible days" figure respects the schedule. 3-step add flow with the admin «مكتبة العادات». «يومك» groups habits by time of day. The habit detail gains weekday circles and «سجّل اليوم». | P1 | Built (2026-11-22) |
| 005 | **«خطتي» by domain and review rhythm, challenge by domain**: «هويّتي»; per domain «من أريد أن أكون», «العلامة» and a review date; the review flow «من أنت وما تريد» with a member-chosen next review; the «حان موعد مراجعتك» card; admin «مكتبة التحدّيات»; «تحدّي اليوم» by domain with refresh. | P2 | Built (2026-11-22) |
| 006 | **«أثرك ← أنا» stats**: consecutive days, active habits, «خطتي مقابل ما سواها», week/month/year bars, streaks with grace, life wheel («التوزيع» / «الالتزام»). Member-only. | P2 | Built (2026-11-22) |
| 007 | **Walking together**: habit sharing (peers only) and «عادة خاصّة»; «مجموعتي» (peers on the same habit, «ما تظهره أنت»); group challenge without ranking; «المجتمع» as the full activity list («جديد»، «مسجَّل»، presenter, inline «سجّلني»); admin group status, «معروضة», tool toggles. | P3 | Built (2026-11-22) |

## Excluded as design decoration

Sample data, background art, handler-less buttons (the habit/progress card menus, the attachment icons
«إضافة صوت»/«إضافة صورة»/«مكتبة الجمل»), the «أتوقّف» chip, and wording variants («يومي»/«أثرك»/«خطتك»).
