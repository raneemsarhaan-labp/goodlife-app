# Contract: Routes and Screens

All routes render Arabic RTL. Unauthenticated requests to any route except `/join`, `/sign-in`
redirect to `/sign-in`. A role guard runs on the server for every route; failing it returns the
Arabic "not available" page (HTTP 404, so existence is not revealed).

| Route | Screen | Roles | Spec |
|-------|--------|-------|------|
| `/join` | Enter invitation code | public | FR-001 |
| `/join/profile` | Personal data | holder of a valid code in session | FR-002 |
| `/welcome` | Welcome screen | member (first visit) | FR-002 |
| `/sign-in` | Email → one-time code | public | FR-003 |
| `/` | «يومك» (member) / group overview (facilitator) / admin home (admin), by `active_role` | any | FR-010 |
| `/day/start` | «ابدأ يومي» intention sheet | member | FR-012 |
| `/day/close` | «ختام اليوم» | member | FR-014 |
| `/plan` | «خطتي»: current state, focus areas, linked habits | member | FR-020, FR-024 |
| `/habits/new`, `/habits/[id]` | Create/edit habit | member (owner) | FR-021 |
| `/reviews` | Past monthly reviews | member | FR-032 |
| `/reviews/[yyyy-mm]` | Monthly review (fill or read) | member (owner) | FR-030–032 |
| `/stats` | «الإحصاءات» | member | FR-035 |
| `/community` | «المجتمع»: group, cohort, members, received encouragements | member | FR-040 |
| `/groups` | «مجموعاتي» | member, facilitator | FR-042 |
| `/groups/[id]` | Group: members + signals, group stats, activities | facilitator of group, admin | FR-037, FR-043, FR-044 |
| `/resources` | «الموارد» hub | any | FR-050 |
| `/resources/map` | Journey map | any | FR-007 |
| `/resources/guidelines` | «أعراف الرحلة» | any | FR-050 |
| `/resources/[type]` | Recordings / files / references | any (audience-filtered) | FR-051 |
| `/more` | «المزيد» menu | any | FR-082 |
| `/account` | «حسابي»: profile, cohort/group, role switch, sign out, export, delete | any | FR-070, FR-071 |
| `/account/archived-habits` | Archived habits | member | FR-022 |
| `/admin` | «لوحة الإدارة» home | admin | FR-060 |
| `/admin/cohorts`, `/admin/cohorts/[id]` | Cohorts and their groups, memberships | admin | FR-060 |
| `/admin/invitations` | Invitation codes | admin | FR-061 |
| `/admin/activities` | Activities | admin | FR-062 |
| `/admin/resources` | Resource library | admin | FR-063 |
| `/admin/content` | Stages, guidelines, journey challenges, review questions, closing messages, encouragement phrases | admin | FR-063 |

## Navigation

- Member bottom navigation (RTL order, right to left): يومك `/` · خطتي `/plan` · الإحصاءات
  `/stats` · المجتمع `/community` · المزيد `/more`.
- `/more` lists: الموارد، مجموعاتي، مراجعاتي، حسابي، and لوحة الإدارة when the user holds `admin`.
- Facilitator and admin views reuse the same shell; the role switcher lives in `/account` and in
  the header when the user holds more than one role.

## PWA

- `manifest.webmanifest`: `name` «الحياة الطيبة», `short_name` «الحياة الطيبة», `lang` `ar`,
  `dir` `rtl`, `display` `standalone`, `start_url` `/`, theme/background colors, 192/512/maskable
  icons.
- Service worker precaches the app shell and runtime-caches `/` for offline open (research §4).
