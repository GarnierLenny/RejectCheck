# Dashboard Redesign — Design Spec

**Date:** 2026-04-20

## Context

The current dashboard has 4 tabs (Overview, Analyses, Interviews, Applications). The primary user profile is a returning job seeker (B/C) who comes back daily to track progression and manage multiple applications in parallel. The existing structure has redundancy (Overview vs Analyses), an orphaned Interviews tab, and misses a "command center" landing experience. This redesign consolidates to 3 focused tabs, integrates interviews contextually, and adds a Kanban view to Applications.

---

## New Structure: 3 Tabs

**Before:** Overview · Analyses · Interviews · Applications  
**After:** Home · Analyses · Applications

The Interviews tab is removed. Interviews are now nested inside each analysis row (contextual access). Settings tab is not added — it lives at `/account`.

---

## Tab 1 — Home (command center)

Replaces Overview. Designed to answer "what changed and what do I do now?" on every return visit.

### Layout

**Stats row (4 cards):**
- Score moyen (with delta vs last month, color-coded ↑/↓)
- Candidatures actives (count + "X en entretien")
- Interviews IA (count + score moyen)
- Plan actif (dot indicator + plan name + renewal date + "Gérer →" link to `/account`)

**Bottom 3-column grid:**
1. **Profil compétences** — existing RadarChart (aggregated across analyses) + horizontal legend bars per skill
2. **Dernières analyses** — 4 most recent analyses: score badge + job title + company + date + arrow link
3. **⚡ À traiter + Quick actions** — urgent items (candidatures sans réponse 14j+, entretien demain, nouvelle analyse non consultée) with inline CTAs, then a divider and 2 quick action buttons (Nouvelle analyse, Ajouter candidature)

### "À traiter" logic
- **Candidature urgente:** applied > 14 days ago, status still "applied" → "Relance sans réponse depuis Xj"
- **Entretien imminent:** application status = "interviewing" → surface unconditionally (any active interview is worth surfacing)
- **Nouvelle analyse non consultée:** analysis created < 24h, never viewed → show with risk score

### Removed from Overview
- Subscription management block (moved into Plan stat card)
- GitHub/LinkedIn signal bars (still in individual analysis detail, not needed on Home)
- "Recent analyses" bottom list (replaced by the dedicated Dernières analyses column)

---

## Tab 2 — Analyses

Keeps the existing structure, adds interviews nested inline.

### Layout

**Top:** Score evolution LineChart (existing) with period selector (7j / 30j / Tout)

**List (paginated 10/page, searchable):**  
Each analysis row:
- Score badge (color-coded %)
- Job title + company
- Interview chip:
  - If interviews exist → purple `🎤 N interviews` chip (clickable to expand)
  - If no interviews → red `+ Interview` CTA chip
- Date
- Expand toggle (▼/▲)
- Actions menu (Export, Delete)

**Expanded state (inline panel below row):**
- Header: "Interviews IA"
- List of interviews: score badge (0-10) + "Interview #N" + date + "Voir →" link
- Footer: `🎤 Nouvel interview` button + hint text "Continuer l'entraînement sur ce poste"

### Key behavior
- Expanding a row does NOT navigate away — interviews are shown inline
- "Voir →" on an interview links to the existing interview detail page (analyze page)
- "Nouvel interview" launches the interview flow pre-seeded with the analysis context

---

## Tab 3 — Applications

Kept intact (TanStack table, drawer, modals, status badges, search). Two additions:

### Addition 1 — Taux de réponse stat
Stats row becomes 5 cards: Total · Actives · Entretiens · Offres · **Taux de réponse** (% of applications with any response)

### Addition 2 — Kanban view toggle
Toolbar gains a `☰ Table | ⬛ Kanban` toggle (Table is default).

**Kanban layout:**
- 5 columns: Interested · Applied · Interviewing · Offer · Rejected
- Each card shows: job title, company, score badge (if linked analysis exists)
- Drag & drop card between columns → updates application status
- Column headers show count badge
- Clicking a card opens the existing side drawer

**Implementation note:** Drag & drop via `@dnd-kit/core` (already a common choice with TanStack). State update on drop calls the existing `PATCH /applications/:id` mutation.

---

## Files to Modify

| File | Change |
|------|--------|
| `web/app/[lang]/dashboard/page.tsx` | Remove Interviews tab, rename Overview→Home, update tab config |
| `web/app/[lang]/dashboard/page.tsx` (Home section) | Full redesign: 4-stat row + 3-col bottom grid |
| `web/app/[lang]/dashboard/page.tsx` (Analyses section) | Add expandable interview rows, keep chart |
| `web/app/[lang]/dashboard/page.tsx` (Applications section) | Add taux de réponse stat, add Kanban toggle + view |
| Translation files (`messages/fr.json`, `messages/en.json`) | Update tab labels, add new keys for "À traiter", kanban columns, etc. |

---

## Reuse / Existing Components

- `web/app/components/TechnicalRadarChart.tsx` — reuse as-is in Home bottom-left
- `web/app/[lang]/dashboard/page.tsx` → `EvolutionTooltip`, `LineChart` — keep in Analyses tab
- Existing `useApplications()`, `useAnalysisHistory()`, `useInterviewHistory()` hooks — reuse all
- Existing application drawer + modals — unchanged
- `PATCH /applications/:id` mutation — reuse for drag & drop status update

---

## Verification

1. **Home tab:** Open dashboard → verify 4 stat cards render correct data → verify "À traiter" surfaces a stale candidature (set one to applied >14 days ago) → verify radar chart renders → verify "Dernières analyses" shows 4 most recent → verify quick action buttons navigate correctly
2. **Analyses tab:** Expand an analysis with interviews → verify inline panel shows correct scores and "Voir →" links → verify "Nouvel interview" button launches interview flow with analysis context → verify "+ Interview" chip shows for analyses with 0 interviews
3. **Applications tab:** Verify 5th stat card (taux de réponse) computes correctly → switch to Kanban view → verify all applications appear in correct column → drag a card to new column → verify status updates in DB and table view reflects the change
