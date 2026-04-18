# Claude Degraded Banner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface Claude API failures (billing or other errors) to the user via a typed error field in the SSE `done` payload and an amber banner on the results page.

**Architecture:** `getTechnicalAnalysisWithClaude` catches Anthropic errors internally and returns a typed `{ claudeError }` object instead of throwing. `analyzeApplication` reads this, stores the error type, and returns it alongside the result. The controller passes it in the `done` SSE write. The frontend reads it, stores it in state, and renders a `ClaudeDegradedBanner` component above the tab nav.

**Tech Stack:** NestJS (backend), React/Next.js (frontend), TypeScript, Anthropic SDK

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `backend/src/analyze/analyze.utils.ts` | Export `ClaudeErrorType` |
| Modify | `backend/src/analyze/analyze.service.ts` | Catch Claude errors, classify, propagate `claude_error` |
| Modify | `backend/src/analyze/analyze.controller.ts` | Include `claude_error` in `done` SSE write |
| Modify | `web/dictionaries/en.json` | Add `claudeDegradedBanner` translation keys |
| Modify | `web/dictionaries/fr.json` | Add `claudeDegradedBanner` translation keys |
| Create | `web/app/components/ClaudeDegradedBanner.tsx` | Amber banner component |
| Modify | `web/app/[lang]/analyze/page.tsx` | Add `claudeError` state, wire banner |

---

## Task 1: Export ClaudeErrorType from analyze.utils.ts

**Files:**
- Modify: `backend/src/analyze/analyze.utils.ts`
- Test: `backend/src/analyze/analyze.utils.spec.ts`

- [ ] **Step 1: Write failing test**

Add to `backend/src/analyze/analyze.utils.spec.ts`, at the end of the existing describe block:

```typescript
describe('ClaudeErrorType values', () => {
  it('insufficient_credits is a valid ClaudeErrorType', () => {
    const val: import('./analyze.utils').ClaudeErrorType = 'insufficient_credits';
    expect(val).toBe('insufficient_credits');
  });

  it('unavailable is a valid ClaudeErrorType', () => {
    const val: import('./analyze.utils').ClaudeErrorType = 'unavailable';
    expect(val).toBe('unavailable');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd ~/.config/superpowers/worktrees/RejectCheck/feat-claude-degraded-banner/backend
npm test -- --testPathPattern analyze.utils.spec.ts 2>&1 | tail -10
```

Expected: 2 new tests fail — `ClaudeErrorType` not exported.

- [ ] **Step 3: Add the type export**

In `backend/src/analyze/analyze.utils.ts`, add at the top (before `INJECTION_PATTERNS`):

```typescript
export type ClaudeErrorType = 'insufficient_credits' | 'unavailable';
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd ~/.config/superpowers/worktrees/RejectCheck/feat-claude-degraded-banner/backend
npm test -- --testPathPattern analyze.utils.spec.ts 2>&1 | tail -10
```

Expected: all tests pass (7 existing + 2 new = 9 total).

- [ ] **Step 5: Commit**

```bash
git add backend/src/analyze/analyze.utils.ts backend/src/analyze/analyze.utils.spec.ts
git commit -m "feat: export ClaudeErrorType from analyze.utils"
```

---

## Task 2: Modify service to catch and classify Claude errors

**Files:**
- Modify: `backend/src/analyze/analyze.service.ts`

This task makes two changes to `analyze.service.ts`:
1. `getTechnicalAnalysisWithClaude`: existing catch block returns typed error instead of throwing
2. `analyzeApplication`: reads the error type and propagates it through the return value

- [ ] **Step 1: Add ClaudeErrorType import at the top of analyze.service.ts**

Find the existing imports at the top of `backend/src/analyze/analyze.service.ts`. Add:

```typescript
import { ClaudeErrorType } from './analyze.utils';
```

- [ ] **Step 2: Change the return type of getTechnicalAnalysisWithClaude**

Find the method signature (around line 76):

```typescript
private async getTechnicalAnalysisWithClaude(data: {
  jobText: string;
  cvText: string;
  githubInfo: string;
  linkedinText: string;
  motivationLetterText: string;
  locale?: string;
}): Promise<{
  technical_analysis: AnalyzeResponse['technical_analysis'];
  project_recommendation: AnalyzeResponse['project_recommendation'];
  scores: { tech_stack_fit: number; github_signal: number | null; linkedin_signal: number | null };
  overall: { score: number; verdict: 'Low' | 'Medium' | 'High'; confidence: { score: number; reason: string } };
  audit_github: AnalyzeResponse['audit']['github'];
  audit_linkedin: AnalyzeResponse['audit']['linkedin'];
}>
```

Add `| { claudeError: ClaudeErrorType }` to the Promise return type:

```typescript
}): Promise<{
  technical_analysis: AnalyzeResponse['technical_analysis'];
  project_recommendation: AnalyzeResponse['project_recommendation'];
  scores: { tech_stack_fit: number; github_signal: number | null; linkedin_signal: number | null };
  overall: { score: number; verdict: 'Low' | 'Medium' | 'High'; confidence: { score: number; reason: string } };
  audit_github: AnalyzeResponse['audit']['github'];
  audit_linkedin: AnalyzeResponse['audit']['linkedin'];
} | { claudeError: ClaudeErrorType }>
```

- [ ] **Step 3: Replace the catch block in getTechnicalAnalysisWithClaude**

Find the existing catch block (around line 334):

```typescript
} catch (apiErr: any) {
  console.error("[Claude] Anthropic API call failed:", apiErr?.message || apiErr);
  throw new InternalServerErrorException("Technical Analysis failed");
}
```

Replace it with:

```typescript
} catch (apiErr: any) {
  console.error("[Claude] Anthropic API call failed:", apiErr?.message || apiErr);
  const isCreditsError =
    (apiErr?.status === 400 || apiErr?.status === 402) &&
    typeof apiErr?.message === 'string' &&
    apiErr.message.toLowerCase().includes('credit');
  const claudeError: ClaudeErrorType = isCreditsError ? 'insufficient_credits' : 'unavailable';
  return { claudeError };
}
```

- [ ] **Step 4: Update analyzeApplication to read claudeError and propagate it**

In `analyzeApplication`, find the `Promise.allSettled` result handling block. It currently looks like:

```typescript
// Merge Claude's results if successful
if (claudeResult.status === 'fulfilled') {
  const cv = claudeResult.value;
  // ... (many lines of merging)
} else {
  console.error("Claude analysis failed, using GPT fallback for overall risk and signals");
  // ... (placeholder fallback)
}

const result = AnalyzeResponseSchema.parse(fullResponse);
return { result, cvText, motivationLetterText };
```

Make these changes:

**Before** the `if (claudeResult.status === 'fulfilled')` line, declare:

```typescript
let claudeError: ClaudeErrorType | null = null;
```

**Change** the `if` condition from:

```typescript
if (claudeResult.status === 'fulfilled') {
  const cv = claudeResult.value;
```

To:

```typescript
if (claudeResult.status === 'fulfilled' && !('claudeError' in claudeResult.value)) {
  const cv = claudeResult.value as Exclude<typeof claudeResult.value, { claudeError: ClaudeErrorType }>;
```

**Change** the `else` block opening from:

```typescript
} else {
  console.error("Claude analysis failed, using GPT fallback for overall risk and signals");
```

To:

```typescript
} else {
  if (claudeResult.status === 'rejected') {
    claudeError = 'unavailable';
  } else {
    claudeError = (claudeResult.value as { claudeError: ClaudeErrorType }).claudeError;
  }
  console.error("Claude analysis failed, using GPT fallback:", claudeError);
```

**Change** the return statement from:

```typescript
return { result, cvText, motivationLetterText };
```

To:

```typescript
return { result, cvText, motivationLetterText, claude_error: claudeError };
```

- [ ] **Step 5: Verify the backend builds with no TypeScript errors**

```bash
cd ~/.config/superpowers/worktrees/RejectCheck/feat-claude-degraded-banner/backend
npm run build 2>&1 | tail -10
```

Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
git add backend/src/analyze/analyze.service.ts
git commit -m "feat: classify Claude errors and propagate claude_error through analyzeApplication"
```

---

## Task 3: Update controller to include claude_error in done SSE write

**Files:**
- Modify: `backend/src/analyze/analyze.controller.ts`

- [ ] **Step 1: Destructure claude_error in the controller**

In `analyze.controller.ts`, find the destructuring of `analyzeApplication`'s return value:

```typescript
const { result, cvText: parsedCv, motivationLetterText: parsedMl } = await this.analyzeService.analyzeApplication(
```

Add `claude_error`:

```typescript
const { result, cvText: parsedCv, motivationLetterText: parsedMl, claude_error } = await this.analyzeService.analyzeApplication(
```

- [ ] **Step 2: Add claude_error to the done write**

Find the line:

```typescript
write({ step: 'done', result, analysisId });
```

Replace with:

```typescript
write({ step: 'done', result, analysisId, claude_error: claude_error ?? null });
```

- [ ] **Step 3: Verify the backend builds**

```bash
cd ~/.config/superpowers/worktrees/RejectCheck/feat-claude-degraded-banner/backend
npm run build 2>&1 | tail -10
```

Expected: exits 0, no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/analyze/analyze.controller.ts
git commit -m "feat: include claude_error in done SSE payload"
```

---

## Task 4: Add translation keys

**Files:**
- Modify: `web/dictionaries/en.json`
- Modify: `web/dictionaries/fr.json`

- [ ] **Step 1: Add keys to en.json**

In `web/dictionaries/en.json`, add a new top-level `"claudeDegradedBanner"` key. The file is a large JSON object — add it at the same level as other top-level keys like `"tabs"`, `"common"`, etc.:

```json
"claudeDegradedBanner": {
  "insufficient_credits": "Technical analysis is temporarily unavailable — our AI engine has reached its service limit. The rest of your analysis is complete.",
  "unavailable": "Technical analysis is partially unavailable due to an error with our AI engine. The rest of your analysis is complete."
}
```

- [ ] **Step 2: Add keys to fr.json**

In `web/dictionaries/fr.json`, add the same top-level key:

```json
"claudeDegradedBanner": {
  "insufficient_credits": "L'analyse technique est temporairement indisponible — notre moteur IA a atteint sa limite de service. Le reste de votre analyse est complet.",
  "unavailable": "L'analyse technique est partiellement indisponible en raison d'une erreur de notre moteur IA. Le reste de votre analyse est complet."
}
```

- [ ] **Step 3: Commit**

```bash
git add web/dictionaries/en.json web/dictionaries/fr.json
git commit -m "feat: add claudeDegradedBanner translation keys"
```

---

## Task 5: Create ClaudeDegradedBanner component

**Files:**
- Create: `web/app/components/ClaudeDegradedBanner.tsx`

- [ ] **Step 1: Create the component**

Create `web/app/components/ClaudeDegradedBanner.tsx`:

```typescript
"use client";

import { useLanguage } from "../../context/language";

type ClaudeErrorType = 'insufficient_credits' | 'unavailable';

export function ClaudeDegradedBanner({ claudeError }: { claudeError: ClaudeErrorType }) {
  const { t } = useLanguage();
  const message = (t.claudeDegradedBanner as Record<ClaudeErrorType, string>)[claudeError];

  return (
    <div className="mb-6 px-4 py-3 bg-rc-amber/8 border border-rc-amber/25 rounded flex items-start gap-3">
      <svg
        className="shrink-0 mt-0.5 text-rc-amber"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <p className="font-mono text-[11px] text-rc-amber leading-relaxed">{message}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd ~/.config/superpowers/worktrees/RejectCheck/feat-claude-degraded-banner/web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `ClaudeDegradedBanner`.

- [ ] **Step 3: Commit**

```bash
git add web/app/components/ClaudeDegradedBanner.tsx
git commit -m "feat: add ClaudeDegradedBanner component"
```

---

## Task 6: Wire claudeError state and banner into analyze page

**Files:**
- Modify: `web/app/[lang]/analyze/page.tsx`

- [ ] **Step 1: Add ClaudeDegradedBanner import**

At the top of `web/app/[lang]/analyze/page.tsx`, add alongside the other component imports:

```typescript
import { ClaudeDegradedBanner } from "../../components/ClaudeDegradedBanner";
```

- [ ] **Step 2: Add claudeError state**

In the state declarations section (around line 55, alongside `setResult`, `setError`, etc.), add:

```typescript
const [claudeError, setClaudeError] = useState<'insufficient_credits' | 'unavailable' | null>(null);
```

- [ ] **Step 3: Read claude_error in the done SSE handler**

Find the `done` step handler (around line 171):

```typescript
if (payload.step === "done") {
  setResult(payload.result);
  if (payload.analysisId) setAnalysisId(payload.analysisId);
  setLoading(false);
}
```

Add the `setClaudeError` call:

```typescript
if (payload.step === "done") {
  setResult(payload.result);
  if (payload.analysisId) setAnalysisId(payload.analysisId);
  setClaudeError(payload.claude_error ?? null);
  setLoading(false);
}
```

- [ ] **Step 4: Reset claudeError on handleReset**

Find `handleReset` or wherever `setResult(null)` is called in the reset handler. Add `setClaudeError(null)` alongside it so the banner clears when the user starts a new analysis.

Look for: `setResult(null)` in the `handleReset` function (or equivalent) and add:

```typescript
setClaudeError(null);
```

- [ ] **Step 5: Render the banner above the tab nav**

In the results JSX, find the `{/* Tab nav */}` comment (around line 398). The banner goes immediately before it, inside the result view section. Insert:

```typescript
{/* Claude degraded banner */}
{claudeError && <ClaudeDegradedBanner claudeError={claudeError} />}

{/* Tab nav */}
```

- [ ] **Step 6: Verify TypeScript**

```bash
cd ~/.config/superpowers/worktrees/RejectCheck/feat-claude-degraded-banner/web
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add web/app/[lang]/analyze/page.tsx
git commit -m "feat: show ClaudeDegradedBanner when Claude API fails"
```

---

## Self-Review

**Spec coverage:**
- `ClaudeErrorType` exported from utils → Task 1 ✓
- `getTechnicalAnalysisWithClaude` catches and classifies → Task 2 ✓
- `analyzeApplication` propagates `claude_error` → Task 2 ✓
- Controller includes `claude_error` in `done` → Task 3 ✓
- Translation keys (en + fr) → Task 4 ✓
- `ClaudeDegradedBanner` component → Task 5 ✓
- State + handler + reset + render → Task 6 ✓

**Type consistency:**
- `ClaudeErrorType` defined in Task 1, imported in Task 2 (service) and used inline in Tasks 5 and 6 ✓
- `claude_error` field added to `analyzeApplication` return in Task 2, destructured in Task 3 ✓
- `payload.claude_error` read in Task 6 matches what the controller writes in Task 3 ✓

**No placeholders:** All steps contain actual code. ✓
