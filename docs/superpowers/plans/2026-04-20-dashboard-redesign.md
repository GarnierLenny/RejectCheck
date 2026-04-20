# Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the dashboard from 4 tabs (Overview · Analyses · Interviews · Applications) to 3 tabs (Home · Analyses · Applications), with interviews nested inside each analysis row, a new command-center Home tab, and a Kanban view on Applications.

**Architecture:** All changes are frontend-only except Task 2 (adds an `analysisId` query filter to the existing backend interview history endpoint). The `dashboard/page.tsx` file is restructured in-place; the `ApplicationsTab` component receives a new `KanbanView` sibling component.

**Tech Stack:** Next.js (App Router), React Query v5, TanStack Table v8, Recharts, @dnd-kit/core + @dnd-kit/sortable (to install), Tailwind CSS, TypeScript.

---

## File Map

| File | Action |
|------|--------|
| `web/dictionaries/en.json` | Update tab labels, add Home/Kanban/À traiter keys |
| `web/dictionaries/fr.json` | Same in French |
| `backend/src/interview/interview.controller.ts` | Add optional `analysisId` query param to `/history` |
| `backend/src/interview/interview.service.ts` | Add `analysisId` filter to `history()` method |
| `web/lib/queries.ts` | Add `useInterviewsByAnalysis(analysisId)` hook |
| `web/app/[lang]/dashboard/page.tsx` | Full redesign: tab config, Home section, Analyses section, remove Interviews section |
| `web/app/components/tabs/ApplicationsTab.tsx` | Add taux de réponse stat card + kanban toggle wiring |
| `web/app/components/KanbanView.tsx` | New: Kanban board with @dnd-kit drag & drop |

---

## Task 1: Update dictionaries (i18n)

**Files:**
- Modify: `web/dictionaries/en.json`
- Modify: `web/dictionaries/fr.json`

- [ ] **Step 1: Update `en.json` tab labels and add new keys**

In `web/dictionaries/en.json`, find the `account.tabs` object (line ~713) and replace:

```json
"tabs": {
  "home": "Home",
  "analyses": "Analyses",
  "applications": "Applications"
},
```

Then find `account.overview` (line ~720) and add these keys at the end:

```json
"home": {
  "avgScore": "Avg score",
  "activeApplications": "Active applications",
  "aiInterviews": "AI interviews",
  "activePlan": "Active plan",
  "renewsOn": "Renews",
  "managePlan": "Manage →",
  "skillProfile": "Skill profile",
  "recentAnalyses": "Recent analyses",
  "actionNeeded": "Action needed",
  "newAnalysis": "New analysis",
  "addApplication": "Add application",
  "staleApplication": "No reply in {days} days",
  "activeInterview": "Interview in progress",
  "newUnviewedAnalysis": "New analysis — {score}% risk",
  "noActionItems": "You're all caught up!"
},
"kanban": {
  "interested": "Interested",
  "applied": "Applied",
  "interviewing": "Interviewing",
  "offer": "Offer",
  "rejected": "Rejected",
  "responseRate": "Response rate",
  "viewTable": "Table",
  "viewKanban": "Kanban"
},
"interviews": {
  "nestedLabel": "AI Interviews",
  "newInterview": "New interview",
  "newInterviewHint": "Continue practising on this role",
  "interviewN": "Interview #{n}",
  "noInterviews": "No interviews yet",
  "viewDetails": "View →"
},
```

- [ ] **Step 2: Update `fr.json` with same structure**

In `web/dictionaries/fr.json`, find `account.tabs` and replace:

```json
"tabs": {
  "home": "Accueil",
  "analyses": "Analyses",
  "applications": "Candidatures"
},
```

Add in French under `account`:

```json
"home": {
  "avgScore": "Score moyen",
  "activeApplications": "Candidatures actives",
  "aiInterviews": "Interviews IA",
  "activePlan": "Plan actif",
  "renewsOn": "Renouvellement",
  "managePlan": "Gérer →",
  "skillProfile": "Profil compétences",
  "recentAnalyses": "Dernières analyses",
  "actionNeeded": "À traiter",
  "newAnalysis": "Nouvelle analyse",
  "addApplication": "Ajouter candidature",
  "staleApplication": "Aucune réponse depuis {days} jours",
  "activeInterview": "Entretien en cours",
  "newUnviewedAnalysis": "Nouvelle analyse — {score}% risque",
  "noActionItems": "Tout est à jour !"
},
"kanban": {
  "interested": "Intéressé",
  "applied": "Candidaté",
  "interviewing": "Entretiens",
  "offer": "Offre",
  "rejected": "Refusé",
  "responseRate": "Taux de réponse",
  "viewTable": "Tableau",
  "viewKanban": "Kanban"
},
"interviews": {
  "nestedLabel": "Interviews IA",
  "newInterview": "Nouvel interview",
  "newInterviewHint": "Continuer l'entraînement sur ce poste",
  "interviewN": "Interview #{n}",
  "noInterviews": "Aucun interview",
  "viewDetails": "Voir →"
},
```

- [ ] **Step 3: Commit**

```bash
git add web/dictionaries/en.json web/dictionaries/fr.json
git commit -m "feat(i18n): add dashboard redesign translation keys"
```

---

## Task 2: Backend — add analysisId filter to interview history

**Files:**
- Modify: `backend/src/interview/interview.service.ts`
- Modify: `backend/src/interview/interview.controller.ts`

- [ ] **Step 1: Add `analysisId` optional param to the controller**

In `backend/src/interview/interview.controller.ts`, find the `history` handler and update:

```typescript
@Get('history')
@ApiOperation({ summary: 'Get past interview attempts for the authenticated user' })
async history(
  @Req() req: Request,
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Query('analysisId') analysisId?: string,
) {
  const email = (req as any).userEmail as string;
  return this.interviewService.history(
    email,
    +page,
    +limit,
    analysisId ? +analysisId : undefined,
  );
}
```

- [ ] **Step 2: Add `analysisId` filter to the service**

In `backend/src/interview/interview.service.ts`, find `async history(email, page, limit)` and update the signature and `where` clause:

```typescript
async history(email: string, page: number, limit: number, analysisId?: number) {
  const skip = (page - 1) * limit;
  const where: any = { email };
  if (analysisId !== undefined) {
    where.analysisId = analysisId;
  }
  const [attempts, total] = await Promise.all([
    (this.prisma as any).interviewAttempt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, analysisId: true, analysis: true, createdAt: true },
      skip,
      take: limit,
    }),
    (this.prisma as any).interviewAttempt.count({ where }),
  ]);
  // ... rest of mapping unchanged
```

- [ ] **Step 3: Verify the endpoint manually**

Start the backend (`cd backend && npm run start:dev`) and test:

```bash
curl "http://localhost:3000/api/interview/history?analysisId=1" \
  -H "Authorization: Bearer <token>"
# Expected: { data: [...interviews for analysis 1...], total: N }
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/interview/interview.controller.ts \
        backend/src/interview/interview.service.ts
git commit -m "feat(api): add analysisId filter to interview history endpoint"
```

---

## Task 3: Frontend query hook for interviews by analysis

**Files:**
- Modify: `web/lib/queries.ts`

- [ ] **Step 1: Add `useInterviewsByAnalysis` hook**

In `web/lib/queries.ts`, add after `useInterviewHistory`:

```typescript
export function useInterviewsByAnalysis(analysisId: number | null) {
  const { session } = useAuth();
  const token = session?.access_token;
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['interview-history-by-analysis', userId, analysisId],
    queryFn: () =>
      apiFetch<PaginatedResponse<InterviewAttempt>>(
        `/api/interview/history?analysisId=${analysisId}&limit=50`,
        { headers: authHeaders(token!) },
      ),
    enabled: !!token && !!userId && analysisId !== null,
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add web/lib/queries.ts
git commit -m "feat(queries): add useInterviewsByAnalysis hook"
```

---

## Task 4: Dashboard tab config — remove Interviews, rename Overview → Home

**Files:**
- Modify: `web/app/[lang]/dashboard/page.tsx`

- [ ] **Step 1: Update `DashboardTab` type and constants**

Find and replace the type and config at the top of `DashboardContent()`:

```typescript
type DashboardTab = "home" | "analyses" | "applications";

const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "home",         label: "Home" },
  { id: "analyses",     label: "Analyses" },
  { id: "applications", label: "Applications" },
];

const VALID_DASHBOARD_TABS: DashboardTab[] = ["home", "analyses", "applications"];
```

- [ ] **Step 2: Update initial tab state with backward compat for `?tab=overview` and `?tab=interviews`**

Find the `useState` for `activeTab` and replace:

```typescript
const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
  const tab = searchParams.get("tab");
  // Backward compat: old URLs with overview/interviews redirect to home/analyses
  if (tab === "overview") return "home";
  if (tab === "interviews") return "analyses";
  return VALID_DASHBOARD_TABS.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : "home";
});
```

- [ ] **Step 3: Remove `interviewPage`, `interviewSearch`, `interviewData` state and queries**

Delete these lines (no longer needed at top level — interviews now fetched per-analysis):

```typescript
// DELETE these:
const [interviewPage, setInterviewPage] = useState(1);
const [interviewSearch, setInterviewSearch] = useState("");
const { data: interviewData } = useInterviewHistory(interviewPage);
const interviewHistory = interviewData?.data ?? [];
const totalInterviews = interviewData?.total ?? 0;
const totalInterviewPages = Math.ceil(totalInterviews / 10);
// and the useEffect: useEffect(() => { setInterviewPage(1); }, [interviewSearch]);
```

Add a single query for total interview count (needed for Home stats):

```typescript
const { data: interviewSummary } = useInterviewHistory(1);
const totalInterviews = interviewSummary?.total ?? 0;
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
# Expected: errors only where "interviews" tab JSX is still referenced — fix in Task 6
```

- [ ] **Step 5: Commit when Tasks 4–6 are all done (defer commit to end of Task 6)**

---

## Task 5: Rewrite Home tab section

**Files:**
- Modify: `web/app/[lang]/dashboard/page.tsx`

This replaces the entire `activeTab === "overview"` block with `activeTab === "home"`.

- [ ] **Step 1: Compute derived values for Home tab**

Add these derived values inside `DashboardContent`, after the existing computed vars:

```typescript
// Home tab — stats
const activeApplications = applications.filter(
  (a) => a.status === "applied" || a.status === "interviewing"
);
const interviewingCount = applications.filter((a) => a.status === "interviewing").length;

// Compute avg interview score from page 1 of interview history
const interviewPage1 = interviewSummary?.data ?? [];
const avgInterviewScore = interviewPage1.length > 0
  ? Math.round(
      interviewPage1
        .filter((i) => i.globalScore !== null)
        .reduce((acc, i) => acc + (i.globalScore ?? 0), 0) /
        interviewPage1.filter((i) => i.globalScore !== null).length
    )
  : null;

// "À traiter" items
const now = Date.now();
const STALE_DAYS = 14;
const staleApplications = applications.filter((a) => {
  if (a.status !== "applied") return false;
  const appliedMs = new Date(a.appliedAt).getTime();
  return now - appliedMs > STALE_DAYS * 86400000;
});
const interviewingApps = applications.filter((a) => a.status === "interviewing");
const newUnviewedAnalyses = summaryPage1.filter((item) => {
  const createdMs = new Date(item.createdAt).getTime();
  return now - createdMs < 24 * 3600000;
});

// Recent analyses (up to 4 most recent from page 1)
const recentAnalyses = summaryPage1.slice(0, 4);
```

- [ ] **Step 2: Replace `activeTab === "overview"` JSX block**

Find `{activeTab === "overview" && (() => {` and replace the entire IIFE block with:

```tsx
{activeTab === "home" && (() => {
  // ── Radar data (reused from old overview) ──────────────────────────────
  const splitSkillName = (name: string): string[] =>
    name.split(/\s*[\/&+]\s*|\s+and\s+/i)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 1);

  const skillMap = new Map<string, { totalCurrent: number; count: number }>();
  for (const item of summaryPage1) {
    const skills: { name: string; current: number; expected: number }[] =
      item.result?.technical_analysis?.skills ?? [];
    for (const s of skills) {
      if (!s.name) continue;
      for (const key of splitSkillName(s.name)) {
        const existing = skillMap.get(key);
        if (existing) {
          existing.totalCurrent += s.current;
          existing.count += 1;
        } else {
          skillMap.set(key, { totalCurrent: s.current, count: 1 });
        }
      }
    }
  }
  const topSkills = Array.from(skillMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6)
    .map(([key, { totalCurrent, count }]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1),
      strength: Math.round((totalCurrent / count / 10) * 100),
    }));
  const radarPlotData = topSkills.length >= 3
    ? topSkills
    : (() => {
        const FALLBACK = [
          { key: "keyword_match",    label: "Keywords" },
          { key: "tech_stack_fit",   label: "Tech Stack" },
          { key: "experience_level", label: "Experience" },
        ] as const;
        return FALLBACK.map(({ key, label }) => {
          const vals = summaryPage1
            .map((i) => i.result?.breakdown?.[key])
            .filter((v): v is number => v !== null && v !== undefined);
          const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
          return { subject: label, strength: avg !== null ? Math.round(100 - avg) : 0 };
        });
      })();
  const radarAnalysisCount = summaryPage1.filter(
    (i) => i.result?.technical_analysis?.skills?.length > 0
  ).length;

  const planLabel = (subscription?.plan || "Rejected").toUpperCase();
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col gap-6">

      {/* ── 4 stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Score moyen */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
            {t.account.home.avgScore}
          </p>
          <p className={`text-3xl font-black leading-none ${overviewAvgRisk !== null ? getScoreColor(overviewAvgRisk).split(" ")[0] : "text-rc-hint"}`}>
            {overviewAvgRisk !== null ? `${overviewAvgRisk}%` : "—"}
          </p>
        </div>

        {/* Candidatures actives */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
            {t.account.home.activeApplications}
          </p>
          <p className="text-3xl font-black leading-none text-rc-text">
            {activeApplications.length}
          </p>
          {interviewingCount > 0 && (
            <p className="font-mono text-[10px] text-rc-amber">
              {interviewingCount} en entretien
            </p>
          )}
        </div>

        {/* Interviews IA */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
            {t.account.home.aiInterviews}
          </p>
          <p className="text-3xl font-black leading-none text-rc-text">{totalInterviews}</p>
          {avgInterviewScore !== null && (
            <p className="font-mono text-[10px] text-rc-green">↑ {avgInterviewScore}/10 avg</p>
          )}
        </div>

        {/* Plan actif */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-4 space-y-1">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
            {t.account.home.activePlan}
          </p>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-rc-green animate-pulse" : "bg-rc-hint"}`} />
            <p className="text-lg font-black leading-none text-rc-text">{planLabel}</p>
          </div>
          {periodEnd && (
            <p className="font-mono text-[10px] text-rc-hint">
              {t.account.home.renewsOn} {periodEnd} ·{" "}
              <Link href={localePath("/account")} className="text-rc-red no-underline hover:underline">
                {t.account.home.managePlan}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ── 3-col bottom grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Col 1: Radar */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-4">
            {t.account.home.skillProfile}
          </p>
          {radarAnalysisCount === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="font-mono text-[11px] text-rc-hint text-center">
                {t.account.overview.firstAnalysisCta}
              </p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarPlotData}>
                  <PolarGrid stroke="rgba(0,0,0,0.08)" strokeDasharray="3 3" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#6b6860", fontSize: 10, fontFamily: "monospace" }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    dataKey="strength"
                    stroke="#D94040"
                    strokeWidth={2}
                    fill="rgba(217,64,64,0.15)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Col 2: Dernières analyses */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-4">
            {t.account.home.recentAnalyses}
          </p>
          {recentAnalyses.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="font-mono text-[11px] text-rc-hint text-center">
                {t.account.overview.firstAnalysisCta}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[rgba(0,0,0,0.05)]">
              {recentAnalyses.map((item) => {
                const label = item.jobLabel || item.result?.job_details?.title || "Developer";
                const company = item.company ?? item.result?.job_details?.company ?? null;
                const score = item.result?.score ?? 0;
                return (
                  <Link
                    key={item.id}
                    href={localePath(`/analyze?id=${item.id}`)}
                    className="flex items-center gap-3 py-2.5 no-underline group"
                  >
                    <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-black text-[11px] ${getScoreColor(score)}`}>
                      {score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[12px] text-rc-text truncate group-hover:text-rc-red transition-colors">{label}</p>
                      {company && <p className="font-mono text-[9px] text-rc-hint truncate">{company}</p>}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-rc-hint/30 group-hover:text-rc-red shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Col 3: À traiter + Quick actions */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5 flex flex-col gap-4">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold">
            {t.account.home.actionNeeded}
          </p>

          <div className="flex flex-col gap-2 flex-1">
            {staleApplications.slice(0, 2).map((app) => {
              const days = Math.floor((now - new Date(app.appliedAt).getTime()) / 86400000);
              return (
                <button
                  key={app.id}
                  onClick={() => handleTabChange("applications")}
                  className="text-left border-l-2 border-rc-amber bg-rc-amber/5 rounded-r-lg px-3 py-2"
                >
                  <p className="font-semibold text-[12px] text-rc-text truncate">
                    {app.company} — {app.jobTitle}
                  </p>
                  <p className="font-mono text-[10px] text-rc-amber">
                    {t.account.home.staleApplication.replace("{days}", String(days))}
                  </p>
                </button>
              );
            })}

            {interviewingApps.slice(0, 2).map((app) => (
              <button
                key={app.id}
                onClick={() => handleTabChange("applications")}
                className="text-left border-l-2 border-rc-red bg-rc-red/5 rounded-r-lg px-3 py-2"
              >
                <p className="font-semibold text-[12px] text-rc-text truncate">
                  {app.company} — {app.jobTitle}
                </p>
                <p className="font-mono text-[10px] text-rc-red">{t.account.home.activeInterview}</p>
              </button>
            ))}

            {newUnviewedAnalyses.slice(0, 2).map((item) => {
              const score = item.result?.score ?? 0;
              const label = item.jobLabel || item.result?.job_details?.title || "Analysis";
              return (
                <Link
                  key={item.id}
                  href={localePath(`/analyze?id=${item.id}`)}
                  className="border-l-2 border-blue-400 bg-blue-50 rounded-r-lg px-3 py-2 no-underline"
                >
                  <p className="font-semibold text-[12px] text-rc-text truncate">{label}</p>
                  <p className="font-mono text-[10px] text-blue-500">
                    {t.account.home.newUnviewedAnalysis.replace("{score}", String(score))}
                  </p>
                </Link>
              );
            })}

            {staleApplications.length === 0 &&
              interviewingApps.length === 0 &&
              newUnviewedAnalyses.length === 0 && (
                <p className="font-mono text-[11px] text-rc-hint text-center py-4">
                  {t.account.home.noActionItems}
                </p>
              )}
          </div>

          <div className="border-t border-[rgba(0,0,0,0.06)] pt-3 flex flex-col gap-2">
            <Link
              href={localePath("/analyze")}
              className="flex items-center justify-center gap-2 py-2.5 bg-rc-red text-white rounded-xl font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
            >
              {t.account.home.newAnalysis} <ArrowRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => handleTabChange("applications")}
              className="flex items-center justify-center gap-2 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-xl font-mono text-[10px] tracking-widest uppercase text-rc-muted hover:text-rc-text transition-colors"
            >
              <Plus className="w-3 h-3" /> {t.account.home.addApplication}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
})()}
```

- [ ] **Step 3: Verify the Home tab renders correctly in browser**

Start the dev server (`cd web && npm run dev`), open `http://localhost:3000/en/dashboard`, confirm:
- 4 stat cards visible with real data
- Radar chart renders in bottom-left
- Recent analyses list shows up to 4 items
- "À traiter" section shows stale applications or "all caught up" message

---

## Task 6: Analyses tab — add expandable interview rows

**Files:**
- Modify: `web/app/[lang]/dashboard/page.tsx`

- [ ] **Step 1: Add `expandedAnalysisId` state**

Inside `DashboardContent`, add:

```typescript
const [expandedAnalysisId, setExpandedAnalysisId] = useState<number | null>(null);
```

- [ ] **Step 2: Create `AnalysisRowWithInterviews` component**

Add this component above `DashboardContent` (outside it, to avoid re-render issues):

```tsx
function AnalysisRowWithInterviews({
  item,
  isExpanded,
  onToggle,
  onDelete,
  onExport,
  isDeleting,
  getScoreColor,
  localePath,
  t,
}: {
  item: HistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onExport: (e: React.MouseEvent, item: HistoryItem) => void;
  isDeleting: number | null;
  getScoreColor: (score: number) => string;
  localePath: (p: string) => string;
  t: any;
}) {
  // Always fetch (not gated on isExpanded) so the count chip shows while collapsed.
  // 10 rows/page = 10 parallel requests — acceptable.
  const { data: interviewsData } = useInterviewsByAnalysis(item.id);
  const interviews = interviewsData?.data ?? [];

  const label = item.jobLabel || item.result?.job_details?.title || "Developer";
  const company = item.company ?? item.result?.job_details?.company ?? null;
  const score = item.result?.score ?? 0;
  const scoreClass = getScoreColor(score);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-colors ${isExpanded ? "border-rc-red/20" : "border-[rgba(0,0,0,0.08)]"}`}>
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#faf9f7] transition-colors"
        onClick={onToggle}
      >
        <div className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center font-black text-[11px] ${scoreClass}`}>
          {score}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[12px] text-rc-text truncate">{label}</p>
          {company && <p className="font-mono text-[9px] text-rc-hint truncate">{company}</p>}
        </div>

        {/* Interview chip */}
        {interviewsData !== undefined && interviewsData.total > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-50 border border-violet-200 font-mono text-[10px] text-violet-600 shrink-0">
            <Mic className="w-2.5 h-2.5" />
            {interviewsData.total}
          </span>
        ) : (
          <Link
            href={localePath(`/analyze?id=${item.id}&tab=interview`)}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rc-red/5 border border-rc-red/20 font-mono text-[10px] text-rc-red no-underline hover:bg-rc-red/10 transition-colors shrink-0"
          >
            <Plus className="w-2.5 h-2.5" /> Interview
          </Link>
        )}

        <p className="font-mono text-[9px] text-rc-hint shrink-0">
          {new Date(item.createdAt).toLocaleDateString()}
        </p>

        {/* Expand toggle */}
        <ChevronRight
          className={`w-3.5 h-3.5 text-rc-hint shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
        />

        {/* Actions menu */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => onExport(e, item)}
            className="p-1 rounded hover:bg-[#f0ede9] transition-colors"
          >
            <Download className="w-3 h-3 text-rc-hint" />
          </button>
          <button
            onClick={(e) => onDelete(e, item.id)}
            disabled={isDeleting === item.id}
            className="p-1 rounded hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3 h-3 text-rc-hint hover:text-rc-red" />
          </button>
        </div>
      </div>

      {/* Expanded interviews panel */}
      {isExpanded && (
        <div className="border-t border-[rgba(0,0,0,0.06)] bg-[#faf9f7] px-4 py-3">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-3">
            {t.account.interviews.nestedLabel}
          </p>

          {interviews.length === 0 ? (
            <p className="font-mono text-[11px] text-rc-hint py-2">{t.account.interviews.noInterviews}</p>
          ) : (
            <div className="flex flex-col gap-1 mb-3">
              {interviews.map((iv, idx) => {
                const scoreColor = iv.globalScore === null ? "text-rc-hint"
                  : iv.globalScore >= 7 ? "text-rc-green"
                  : iv.globalScore >= 4 ? "text-rc-amber"
                  : "text-rc-red";
                return (
                  <div key={iv.id} className="flex items-center gap-3 py-1.5 border-b border-[rgba(0,0,0,0.04)] last:border-0">
                    <span className={`font-black text-[13px] leading-none w-10 shrink-0 ${scoreColor}`}>
                      {iv.globalScore !== null ? `${iv.globalScore}/10` : "—"}
                    </span>
                    <span className="font-mono text-[11px] text-rc-muted flex-1">
                      {t.account.interviews.interviewN.replace("{n}", String(interviews.length - idx))}
                    </span>
                    <span className="font-mono text-[10px] text-rc-hint">
                      {new Date(iv.createdAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={localePath(`/analyze?id=${item.id}&interviewId=${iv.id}`)}
                      className="font-mono text-[10px] text-rc-red no-underline hover:underline"
                    >
                      {t.account.interviews.viewDetails}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link
              href={localePath(`/analyze?id=${item.id}&tab=interview`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rc-red text-white rounded-lg font-mono text-[10px] tracking-widest uppercase no-underline hover:opacity-90 transition-opacity"
            >
              <Mic className="w-3 h-3" /> {t.account.interviews.newInterview}
            </Link>
            <p className="font-mono text-[10px] text-rc-hint">{t.account.interviews.newInterviewHint}</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

Note: you'll need to import `useInterviewsByAnalysis` at the top of the file:
```typescript
import { useSubscription, useAnalysisHistory, useProfile, useInterviewHistory, useApplications, useInterviewsByAnalysis } from "../../../lib/queries";
```

- [ ] **Step 3: Update the Analyses tab JSX to use `AnalysisRowWithInterviews`**

Find the analysis history list inside `activeTab === "analyses"` — the `.map()` that renders each history item — and replace the row rendering with:

```tsx
<div className="flex flex-col gap-2">
  {filteredHistory.map((item) => (
    <AnalysisRowWithInterviews
      key={item.id}
      item={item}
      isExpanded={expandedAnalysisId === item.id}
      onToggle={() =>
        setExpandedAnalysisId(expandedAnalysisId === item.id ? null : item.id)
      }
      onDelete={handleDelete}
      onExport={handleOpenExport}
      isDeleting={isDeleting}
      getScoreColor={getScoreColor}
      localePath={localePath}
      t={t}
    />
  ))}
</div>
```

- [ ] **Step 4: Verify Analyses tab in browser**

Open `http://localhost:3000/en/dashboard?tab=analyses`:
- Each analysis row shows correct score badge
- Clicking a row with existing interviews expands the panel showing scores + "Voir →" links
- Analyses with no interviews show the "+ Interview" chip
- Clicking "+ Interview" navigates to the analyze page's interview tab

---

## Task 7: Remove Interviews tab section, clean up

**Files:**
- Modify: `web/app/[lang]/dashboard/page.tsx`

- [ ] **Step 1: Delete the `activeTab === "interviews"` JSX block**

Find and delete the entire block:
```tsx
{activeTab === "interviews" && (() => {
  // ... entire interviews tab JSX
})()}
```

- [ ] **Step 2: Remove unused imports**

Check if `Clock`, `LayoutGrid` (from lucide-react) are now unused and remove them if so. Also remove the `useInterviewHistory` import if no longer used (it was replaced by `useInterviewsByAnalysis`).

Actually keep `useInterviewHistory(1)` — it's used for `interviewSummary` in Task 4 Step 3.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd web && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 4: Commit Tasks 4–7 together**

```bash
git add web/app/[lang]/dashboard/page.tsx web/lib/queries.ts
git commit -m "feat(dashboard): restructure to 3 tabs — Home, Analyses (nested interviews), Applications"
```

---

## Task 8: Applications tab — add taux de réponse stat card

**Files:**
- Modify: `web/app/components/tabs/ApplicationsTab.tsx`

- [ ] **Step 1: Find the stats row in `ApplicationsTab`**

Look for the grid of stat cards near the top of the returned JSX in `ApplicationsTab`. It currently shows: Total, Interviewing, Offers, Rejected.

- [ ] **Step 2: Compute taux de réponse and add 5th stat card**

Add this computed value near where the other stats are derived:

```typescript
const responseCount = applications.filter(
  (a) => a.status !== "interested"
).length;
const responseRate = applications.length > 0
  ? Math.round((responseCount / applications.length) * 100)
  : 0;
```

Then add a 5th card in the stats grid:

```tsx
<div className="bg-[#faf9f7] border border-[rgba(0,0,0,0.06)] rounded-xl p-3 flex flex-col gap-1.5">
  <p className="font-mono text-[8px] tracking-widest uppercase text-rc-hint">
    {/* use a static label or add to t.account.kanban.responseRate */}
    Taux de réponse
  </p>
  <p className="text-2xl font-black leading-none text-rc-text">{responseRate}%</p>
  <p className="font-mono text-[8px] text-rc-hint">
    {responseCount} / {applications.length}
  </p>
</div>
```

Update the grid class from `grid-cols-4` to `grid-cols-5` (or `grid-cols-2 md:grid-cols-5`).

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000/en/dashboard?tab=applications`, confirm the 5th stat card appears with a correct percentage.

- [ ] **Step 4: Commit**

```bash
git add web/app/components/tabs/ApplicationsTab.tsx
git commit -m "feat(applications): add response rate stat card"
```

---

## Task 9: Create KanbanView component

**Files:**
- Create: `web/app/components/KanbanView.tsx`

- [ ] **Step 1: Install @dnd-kit**

```bash
cd web && npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Expected output: packages added to `package.json` and `package-lock.json`.

- [ ] **Step 2: Create `KanbanView.tsx`**

Create `web/app/components/KanbanView.tsx`:

```tsx
"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import type { Application } from "../../lib/queries";

const COLUMNS: { id: string; label: string }[] = [
  { id: "interested",   label: "Intéressé" },
  { id: "applied",      label: "Candidaté" },
  { id: "interviewing", label: "Entretiens" },
  { id: "offer",        label: "Offre" },
  { id: "rejected",     label: "Refusé" },
];

const STATUS_COLORS: Record<string, string> = {
  interested:   "border-l-[#6b6860]",
  applied:      "border-l-[#3b82f6]",
  interviewing: "border-l-[#7c3aed]",
  offer:        "border-l-[#22c55e]",
  rejected:     "border-l-[#ef4444]",
};

function getScoreClass(score: number) {
  if (score < 40) return "text-rc-green border-rc-green/30 bg-rc-green/5";
  if (score < 70) return "text-rc-amber border-rc-amber/40 bg-rc-amber/5";
  return "text-rc-red border-rc-red/30 bg-rc-red/5";
}

// ─── Draggable card ────────────────────────────────────────────────────────

function KanbanCard({
  app,
  onClick,
}: {
  app: Application;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(app.id),
  });

  const score = app.analysis?.result?.score ?? null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined}
      className={`bg-white border border-[rgba(0,0,0,0.08)] border-l-4 ${STATUS_COLORS[app.status] ?? "border-l-transparent"} rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${isDragging ? "opacity-50" : ""}`}
    >
      <p className="font-semibold text-[12px] text-rc-text truncate">{app.jobTitle}</p>
      <p className="font-mono text-[10px] text-rc-hint truncate">{app.company}</p>
      {score !== null && (
        <div className="mt-2">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border font-black text-[11px] ${getScoreClass(score)}`}>
            {score}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Droppable column ─────────────────────────────────────────────────────

function KanbanColumn({
  column,
  apps,
  onCardClick,
}: {
  column: { id: string; label: string };
  apps: Application[];
  onCardClick: (app: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex flex-col gap-2 min-w-[200px] flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-hint font-bold">
          {column.label}
        </p>
        <span className="w-5 h-5 rounded-full bg-[#f0ede9] flex items-center justify-center font-mono text-[10px] text-rc-hint">
          {apps.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-xl p-2 transition-colors ${isOver ? "bg-rc-red/5 border border-dashed border-rc-red/30" : "bg-[#faf9f7]"}`}
      >
        {apps.map((app) => (
          <KanbanCard key={app.id} app={app} onClick={() => onCardClick(app)} />
        ))}
      </div>
    </div>
  );
}

// ─── Main KanbanView ──────────────────────────────────────────────────────

export function KanbanView({
  applications,
  onStatusChange,
  onCardClick,
}: {
  applications: Application[];
  onStatusChange: (appId: number, newStatus: string) => void;
  onCardClick: (app: Application) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeApp = activeId
    ? applications.find((a) => String(a.id) === activeId) ?? null
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const appId = Number(active.id);
    const newStatus = String(over.id);
    const app = applications.find((a) => a.id === appId);
    if (app && app.status !== newStatus && COLUMNS.some((c) => c.id === newStatus)) {
      onStatusChange(appId, newStatus);
    }
  }

  const byStatus = (status: string) =>
    applications.filter((a) => a.status === status);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            apps={byStatus(col.id)}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp && (
          <div className={`bg-white border border-[rgba(0,0,0,0.08)] border-l-4 ${STATUS_COLORS[activeApp.status] ?? ""} rounded-lg p-3 shadow-xl opacity-90 w-[200px]`}>
            <p className="font-semibold text-[12px] text-rc-text truncate">{activeApp.jobTitle}</p>
            <p className="font-mono text-[10px] text-rc-hint truncate">{activeApp.company}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
# Expected: 0 errors
```

- [ ] **Step 4: Commit**

```bash
git add web/app/components/KanbanView.tsx web/package.json web/package-lock.json
git commit -m "feat(kanban): add KanbanView component with drag and drop"
```

---

## Task 10: Wire KanbanView toggle into ApplicationsTab

**Files:**
- Modify: `web/app/components/tabs/ApplicationsTab.tsx`

- [ ] **Step 1: Import `KanbanView`**

Add at the top of `ApplicationsTab.tsx`:

```typescript
import { KanbanView } from "../KanbanView";
```

- [ ] **Step 2: Add `viewMode` state**

Inside the `ApplicationsTab` function, add:

```typescript
const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
```

- [ ] **Step 3: Add the toggle to the toolbar**

Find the toolbar section (where the search input and "Add application" button are) and add a toggle before the Add button:

```tsx
{/* View toggle */}
<div className="flex rounded-lg border border-[rgba(0,0,0,0.1)] overflow-hidden shrink-0">
  <button
    onClick={() => setViewMode("table")}
    className={`px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors ${
      viewMode === "table"
        ? "bg-rc-red text-white"
        : "bg-white text-rc-hint hover:text-rc-text"
    }`}
  >
    ☰ Table
  </button>
  <button
    onClick={() => setViewMode("kanban")}
    className={`px-3 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors border-l border-[rgba(0,0,0,0.1)] ${
      viewMode === "kanban"
        ? "bg-rc-red text-white"
        : "bg-white text-rc-hint hover:text-rc-text"
    }`}
  >
    ⬛ Kanban
  </button>
</div>
```

- [ ] **Step 4: Conditionally render Kanban or Table**

Find where the TanStack table is rendered. Wrap it:

```tsx
{viewMode === "kanban" ? (
  <KanbanView
    applications={applications}
    onStatusChange={(appId, newStatus) =>
      onUpdateApplication({ id: appId, status: newStatus })
    }
    onCardClick={(app) => {
      // Reuse the existing drawer open mechanism
      setSelectedApp(app);
      setDrawerOpen(true);
    }}
  />
) : (
  /* existing TanStack table JSX — unchanged */
  <div className="...">
    {/* table */}
  </div>
)}
```

Note: check the exact state variables used to open the drawer in `ApplicationsTab` (look for `setSelectedApp`, `setDrawerOpen` or similar) and reuse them.

- [ ] **Step 5: Verify Kanban in browser**

Open `http://localhost:3000/en/dashboard?tab=applications`:
1. Click "⬛ Kanban" toggle — board appears with 5 columns
2. Drag a card to a different column → card moves → application status updates (verify in Table view)
3. Click a card → existing side drawer opens
4. Click "☰ Table" → back to table view

- [ ] **Step 6: Final commit**

```bash
git add web/app/components/tabs/ApplicationsTab.tsx
git commit -m "feat(applications): add kanban view toggle with drag & drop status update"
```

---

## End-to-End Verification

1. **Home tab:** `?tab=home` — 4 stat cards, radar, 4 recent analyses, "À traiter" items
2. **Old URLs:** `?tab=overview` and `?tab=interviews` redirect to `home` and `analyses` respectively
3. **Analyses tab:** Expand a row → interviews panel shows; "+ Interview" chip on rows with 0 interviews
4. **Applications tab:** 5 stat cards; toggle shows Kanban; drag updates status; drawer opens on card click
5. **Backend:** `GET /api/interview/history?analysisId=X` returns only interviews for that analysis
