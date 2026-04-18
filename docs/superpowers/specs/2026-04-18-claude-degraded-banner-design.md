# Claude Degraded Banner — Design Spec

**Date:** 2026-04-18  
**Status:** Approved  
**Scope:** Surface Claude API failures to the user via a global banner on the results page, with two distinct messages depending on error type

---

## Context

RejectCheck uses two AI models in parallel:
- **GPT-4o** — primary analysis (ATS, flags, CV audit, overall structure)
- **Claude Sonnet** — technical analysis (skills radar, project recommendation, overall score/verdict, GitHub/LinkedIn audits)

When Claude fails, the backend currently silently fills in placeholder strings ("Technical Analysis Unavailable") and returns a degraded result. The frontend has no way to know Claude failed — the user sees a partially broken result with no explanation.

---

## Decision

- **Error classification:** `'insufficient_credits'` (Anthropic billing) vs `'unavailable'` (any other failure)
- **Signal:** A `claude_error` field in the SSE `done` payload — atomic with the result, no risk of partial state
- **UX:** A single global banner on the results page, non-dismissable, amber color, two message variants
- **No tab-level blurring** — one banner at the top of results is simpler and less disruptive

---

## Section 1 — Backend: Error Classification

### New type

```typescript
export type ClaudeErrorType = 'insufficient_credits' | 'unavailable';
```

Defined in `backend/src/analyze/analyze.utils.ts` (alongside `validateJobDescription`).

### Classification rule

In `getTechnicalAnalysisWithClaude`, the catch block currently lets errors propagate to `Promise.allSettled`. Change it to catch and return a typed error object instead of throwing:

```typescript
catch (err) {
  const errorType: ClaudeErrorType =
    err instanceof Anthropic.BadRequestError && err.message.toLowerCase().includes('credit')
      ? 'insufficient_credits'
      : 'unavailable';
  return { claudeError: errorType };
}
```

Return type becomes: `ClaudeAnalysisResult | { claudeError: ClaudeErrorType }`

### Propagation in analyzeApplication

Since `getTechnicalAnalysisWithClaude` no longer throws, `claudeResult.status` will always be `'fulfilled'`. The discriminant is now whether the fulfilled value has a `claudeError` property. Check with:

```typescript
const claudeError: ClaudeErrorType | null =
  'claudeError' in claudeResult.value ? claudeResult.value.claudeError : null;
```

Apply the existing placeholder fallback when `claudeError !== null`. Pass `claude_error` through to the return value of `analyzeApplication`.

```typescript
// In the return value:
return { result, cvText, motivationLetterText, claude_error: claudeError ?? null };
```

### Controller

In the `done` write in `analyze.controller.ts`:

```typescript
write({ step: 'done', result, analysisId, claude_error: claude_error ?? null });
```

---

## Section 2 — Frontend: Banner

### State

In `web/app/[lang]/analyze/page.tsx`:

```typescript
const [claudeError, setClaudeError] = useState<'insufficient_credits' | 'unavailable' | null>(null);
```

In the `done` SSE handler:

```typescript
if (payload.step === "done") {
  setResult(payload.result);
  if (payload.analysisId) setAnalysisId(payload.analysisId);
  setClaudeError(payload.claude_error ?? null);
  setLoading(false);
}
```

### Component

`web/app/components/ClaudeDegradedBanner.tsx` — receives `claudeError: 'insufficient_credits' | 'unavailable'` prop. Amber banner, non-dismissable, rendered above the tabs when `result` is non-null and `claudeError` is non-null.

### Translation keys

Add to `web/dictionaries/en.json` and `web/dictionaries/fr.json` under a new `"claudeDegradedBanner"` top-level key:

```json
"claudeDegradedBanner": {
  "insufficient_credits": "Technical analysis is temporarily unavailable — our AI engine has reached its service limit. The rest of your analysis is complete.",
  "unavailable": "Technical analysis is partially unavailable due to an error with our AI engine. The rest of your analysis is complete."
}
```

French:
```json
"claudeDegradedBanner": {
  "insufficient_credits": "L'analyse technique est temporairement indisponible — notre moteur IA a atteint sa limite de service. Le reste de votre analyse est complet.",
  "unavailable": "L'analyse technique est partiellement indisponible en raison d'une erreur de notre moteur IA. Le reste de votre analyse est complet."
}
```

---

## Files Affected

| File | Change |
|---|---|
| `backend/src/analyze/analyze.utils.ts` | Add `ClaudeErrorType` type export |
| `backend/src/analyze/analyze.service.ts` | Catch Claude errors, classify, propagate `claude_error` through `analyzeApplication` return |
| `backend/src/analyze/analyze.controller.ts` | Include `claude_error` in `done` SSE write |
| `web/app/[lang]/analyze/page.tsx` | Add `claudeError` state, read from `done` payload, pass to banner |
| `web/app/components/ClaudeDegradedBanner.tsx` | New component |
| `web/dictionaries/en.json` | Add `claudeDegradedBanner` keys |
| `web/dictionaries/fr.json` | Add `claudeDegradedBanner` keys |
