# Loading Screen V1 — Terminal × Report (with real data)

**Status :** plan validé le 2026-05-11, **dépriorisé au profit du portfolio analysis**. À reprendre ensuite.

## Context

Le LoadingScreen actuel couvre les ~50s du hot pass après le split hot/deep. Il affiche un pipeline 5-node + un prettyfied JSON brut en bas. Fonctionnel mais générique.

Le mockup V1 (designé via Claude design, fichiers `Loading Screens.html` + 7 JSX dans `~/Downloads/`) propose un layout split à 2 panneaux :

- **Gauche** : terminal sombre avec logs colorés (sys/tool/note/warn/ok) qui défilent
- **Droite** : panel rapport qui se peuple module par module au fur et à mesure du stream JSON

L'objectif : transformer la perception d'un loading "attendre" en une lecture progressive du rapport. Le user voit ses propres findings apparaître pendant qu'ils sont calculés, plutôt qu'un placeholder animé.

3 autres variants ont été explorés (V2 Dial, V3 Dossier, V4 Signal) — voir l'analyse comparative dans la conversation `2026-05-11`. V1 a été retenu pour son alignement avec le positionnement transparency-forward et son ROI authenticité/effort.

## Trade-offs validés par l'utilisateur

Le mockup contient de la fiction théâtrale qu'on **n'aura pas** dans la version réelle. Décisions confirmées :

1. **Pas de "thinking quotes"** (italic-serif observations de Claude). Le mode `tool_use` ne stream pas de raisonnement libre, juste du JSON. On abandonne — le terminal devient plus sys/ops, moins voice. Pas de canned phrases ni d'appel modèle supplémentaire.
2. **Score = `—` puis snap à la valeur finale**. Pas de fake band qui se resserre. La preuve d'authenticité est dans le terminal qui défile, pas dans le score qui hunte.
3. **Densité moindre que mockup** : ~20-30 lignes réelles vs 50+ scriptées. Quality > quantity.
4. **4-6 events `telemetry` backend** pour le terminal (parse_pdf, fetch_jd, gh_api, scrape_linkedin, claude.create, stream tokens). Petit chantier d'instrumentation.

## Architecture cible

### Backend — events `telemetry`

Nouveau type d'event SSE intercalé dans le stream existant, émis depuis le use case + le provider :

```ts
{ step: 'telemetry', kind: 'sys' | 'tool' | 'note' | 'warn' | 'ok', source: 'cv' | 'jd' | 'github' | 'linkedin' | 'claude' | 'audit', message: string, t?: number }
```

Points d'émission :
- `[tool cv] parse_pdf(cv.pdf) → ${pages} pages, ${chars} chars` après `pdf.parse(cmd.cvBuffer)` dans `analyze-cv.use-case.ts` ligne ~133
- `[tool github] gh_api → ${snapshot.public_repos} repos` après `github.fetchProfile()` (si présent)
- `[tool linkedin] linkedin_parsed → ${chars} chars` (si présent)
- `[tool jd] jd_parsed → ${jobText.length} chars` (sync, peu d'intérêt mais aligne avec le mockup)
- `[sys claude] claude.messages.create · model=${MODEL} · max_tokens=${HOT_MAX_TOKENS}` au début de `analyzeApplicationHot` dans le provider
- `[tool claude] hot_stream → ${output_tokens} tokens` à la fin du hot stream (avant la return)

### Frontend — parser de JSON partiel

Le `streamText` actuel accumule des chunks bruts de tool_use JSON. Il faut un parser qui :

1. Consomme les chunks au fur et à mesure
2. Détecte quand une valeur scalaire ou un sous-objet est COMPLET (closing quote, closing brace, comma)
3. Émet des events typés :
   - `log` (ligne pour le terminal)
   - `report` (bullet pour un module du panel droit)
   - `score` (overall.score, overall.verdict, overall.confidence pour le module score)

Implémentation suggérée : étendre `prettifyPartialJSON` (web/app/components/LoadingScreen.tsx ligne 46) en un FSM qui pousse des events au lieu d'imprimer de la prose.

Mapping JSON keys → terminal log lines :
- `overall.score: N` → `[note claude] preliminary_score → ${N}/100`
- `overall.verdict: "X"` → `[note claude] verdict → ${X}`
- `audit_cv.score: N` → `[note audit] cv_score → ${N}/100`
- `audit_cv.issues[i].severity: "critical"` → `[warn audit] critical_issue_${i+1}`
- `audit_cv.issues[i].what: "X"` → `[note audit] ${X}` (truncated to ~80 chars)
- `audit_jd_match.required_skills[i].found: false` → `[warn match] keyword_missing → ${skill}`
- `ats_simulation.would_pass: false` → `[warn ats] ats_likely_reject`
- `ats_simulation.score: N` → `[note ats] ats_score_raw → ${N}/100`
- `cv_tone.detected: "passive"` → `[warn tone] passive_voice_dominant`
- `hidden_red_flags[i].flag: "X"` → `[warn flags] major_${i+1}: ${X}`
- `technical_analysis.skills[i]: { current: M, expected: E }` → `[note skills] ${name}: ${M}/${E}`

Mapping JSON keys → report modules :
- Module "Audit du CV" → `audit_cv.issues[].what` (top 3 by severity)
- Module "Match compétences" → `audit_jd_match.required_skills[].found` count, top found/missing
- Module "Simulation ATS" → `ats_simulation.score`, `ats_simulation.would_pass`, threshold delta
- Module "Signaux d'alerte" → `hidden_red_flags[].flag` (top 2-3)

### Frontend — layout V1

Porter le mockup `v1-terminal.jsx` dans le code de prod :
- Layout grid `560px 1fr` desktop, stack vertical mobile (terminal collapsé ou caché)
- Terminal sombre (`#15140f`) avec scroll virtualisé si > 30 lignes
- Score module en haut à droite (snap au final, pas de fake band)
- 4 cartes modules en grid 2x2
- Top bar : progress thin bar + heartbeat dot + timer

## Files to modify

### Backend (`/Users/lenny.garnier/Self/RejectCheck/backend`)

- `src/analyze/application/analyze-cv.use-case.ts` — ajouter `AnalyzeEvent` variant `telemetry` avec `kind/source/message`. Émettre 4-6 events aux points listés ci-dessus.
- `src/analyze/infrastructure/anthropic-claude.provider.ts` — émettre 2 telemetry events au début/fin de `analyzeApplicationHot` via un nouveau callback `onTelemetry` dans `AnalyzeApplicationInput`.
- `src/analyze/analyze.controller.ts` — relayer `telemetry` events en SSE write (ligne ~153-167).

### Frontend (`/Users/lenny.garnier/Self/RejectCheck/web`)

- `app/components/LoadingScreen.tsx` — réécriture majeure pour le nouveau layout. Le composant existant sert de base pour la timing logic et la transition vers le result view.
- `app/components/loading/StreamParser.ts` (nouveau) — FSM qui consomme les chunks de tool_use JSON et émet des events typés. Inspiré de `prettifyPartialJSON` mais avec un modèle d'events au lieu de prose.
- `app/components/loading/TerminalPane.tsx` (nouveau) — composant gauche.
- `app/components/loading/ReportPane.tsx` (nouveau) — composant droite avec score + 4 modules.
- `app/[lang]/analyze/page.tsx` — étendre `AnalyzePayload` avec `telemetry` step, transférer au LoadingScreen via props.
- `app/[lang]/debug/loading/page.tsx` — étendre pour permettre de tester le nouveau LoadingScreen avec un mock streamText réaliste (séquence de chunks JSON timés).

## Existing patterns to reuse

- **Partial JSON parsing** : `web/app/components/LoadingScreen.tsx:46-100` (`prettifyPartialJSON`) — la logique FSM caractère par caractère est déjà là, à réutiliser pour le nouveau parser.
- **SSE event handling** : `web/app/[lang]/analyze/page.tsx:200-280` — le pattern d'extension de `AnalyzePayload` + branche dans le switch est éprouvé (deep_done, regenerate-deep).
- **Skeleton aesthetic** : `web/app/components/skeletons/*` — réutiliser le pattern animate-pulse + rc-surface-raised pour les modules avant qu'ils se peuplent.
- **Step events** : `web/app/components/LoadingScreen.tsx` connaît déjà la séquence des steps backend, on garde ce signal pour l'animation top bar.

## Risques & mitigations

- **Parser fragile** : si Claude renvoie une shape inattendue, le report panel reste vide. Mitigation : try/catch autour de chaque event emission, log à Sentry, fallback vers le prettifyPartialJSON existant en bas du terminal pour ne pas avoir un écran vide.
- **Mobile responsive** : le 560/1fr ne tient pas sur phone. Mitigation : breakpoint < 768px, stacker terminal au-dessus + report en-dessous, ou hide terminal et focus report. À designer avant d'écrire le CSS.
- **Densité textuelle** : 30 lignes en 50s peut sembler trop pour un public non-dev (pivot "any role" récent). Mitigation : faire le report panel dominant visuellement (60/40 layout, terminal en typo plus petite), garder le terminal comme "preuve d'activité" sans demander de le lire.
- **Pas de progress signal explicite** : le user n'a plus le "3/5 steps done" tangible. Mitigation : étape courante affichée en gros au-dessus du terminal (`Actuellement : analyse du CV`), pas juste un dot animé.
- **Race avec analysis_done** : la transition vers le result view se fait à `analysis_done`. Le LoadingScreen doit afficher 100% du rapport pendant ~0.5s avant l'unmount pour ne pas couper net. Mitigation : ajouter un delay artificiel post-`analysis_done` ou faire une transition fade.
- **Risque "fake" sur le score band** : on a explicitement décidé snap. Mais si on a envie de l'oscillation visuelle plus tard, utiliser `confidence.score` pour dériver un band réel (≠ fake narrowing).

## Verification

1. **Backend telemetry events fire** : log inspection pendant une analyse — voir 6 events telemetry au bon timing.
2. **Parser test** : feed du parser des chunks de tool_use JSON capturés depuis une vraie analyse, vérifier que les events `log`/`report`/`score` sortent dans l'ordre attendu.
3. **Layout V1 fidèle** : open `~/Downloads/Loading Screens.html`, comparer side-by-side avec le composant prod sur `/fr/debug/loading`.
4. **End-to-end** :
   - Submit une analyse via le frontend
   - À t=~2s : voir `[tool cv] parse_pdf → ...` dans le terminal
   - À t=~5s : voir `[tool jd] jd_parsed`, etc.
   - À t=~15s : voir les premiers logs `audit/match/ats` apparaître
   - À t=~25-35s : voir les modules du report panel se peupler avec les vraies bullets
   - À t=~50s : score snap à la valeur finale, transition vers result view
5. **Responsive** : tester sur 375px, 768px, 1280px+ — le layout doit rester lisible.
6. **Failure mode** : forcer une erreur de parsing (Claude qui retourne un truc déformé) — vérifier que l'UI dégrade proprement (fallback terminal en bas).

## Implementation order recommandé

1. Backend telemetry events (4-6 emit points) — 1 jour
2. Frontend `StreamParser.ts` (FSM avec events typés) — 2 jours
3. `TerminalPane.tsx` (visuel + scrolling logs) — 1 jour
4. `ReportPane.tsx` (score + 4 modules + skeleton fallback) — 1.5 jours
5. Layout intégration + responsive + transitions — 1 jour
6. Debug page étendue (mock streamText pour tester sans backend) — 0.5 jour
7. Tests end-to-end + tuning (densité, timing, copy) — 1 jour

**Estimation totale : 7-8 jours focus.**

## Non-goals (explicitement hors scope V1.0)

- **Thinking quotes** (citations italiques Claude). Si à terme on veut les avoir, ajouter un champ `narration: { thoughts: string[] }` au schéma HOT (~$0.01/analyse de plus, ~3-5s sur le hot). Décision reportée.
- **Score uncertainty band qui se resserre**. Le user a explicitement validé "snap au final, pas de fake band". Si on change d'avis, utiliser `confidence.score` pour dériver un band RÉEL.
- **Animations particles/sweeps** des autres variants. V1 est statique-text-heavy par design.
- **Réécriture du flow SSE** côté frontend. On étend `AnalyzePayload` avec `telemetry`, c'est tout. Le reste du pipeline (deep_done, negotiation_done, etc.) reste identique.

## Quand reprendre

À reprendre **après le portfolio analysis** (plan dans `2026-05-10-portfolio-and-profile-digest.md`). L'ordre de priorité actuel :

1. Portfolio analysis + ProfileDigest infra (en cours/à faire)
2. Cross-profile mismatch detection (ride sur le digest)
3. Loading screen V1 (ce plan)

Si après portfolio le LoadingScreen actuel "marche encore", on peut shipper portfolio puis revenir ici. Si le LoadingScreen montre des signes d'usure (feedback users), on remonte ce plan en priorité.
