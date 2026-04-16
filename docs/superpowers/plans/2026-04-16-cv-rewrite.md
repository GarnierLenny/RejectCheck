# CV Rewrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fixer le markdown brut dans le PDF exporté et ajouter un aperçu Avant/Après côte à côte dans l'ImproveTab.

**Architecture:** (1) Le parser de `CvRewritePdf` est étendu pour gérer tous les tokens markdown. (2) Les styles PDF passent en monochrome élégant (sans rouge). (3) Le backend expose `cvText` dans l'event SSE `done`. (4) Le frontend stocke le texte original et l'affiche côte à côte avec un rendu HTML du CV amélioré via `react-markdown`.

**Tech Stack:** Next.js 15, `@react-pdf/renderer`, `react-markdown` v10, NestJS, TypeScript

---

## File Map

| Action | Fichier |
|---|---|
| Modify | `web/app/components/CvRewritePdf.tsx` |
| Create | `web/app/components/CvMarkdownRenderer.tsx` |
| Modify | `web/app/components/tabs/ImproveTab.tsx` |
| Modify | `web/app/analyze/page.tsx` |
| Modify | `backend/src/analyze/analyze.controller.ts` |

---

## Task 1 — Fix le parser markdown dans CvRewritePdf

**Files:**
- Modify: `web/app/components/CvRewritePdf.tsx`

Le parser actuel rate 3 cas :
- `# TEXT` (single hash) → name/titre principal — non géré, tombe dans `body` → affiche `# John Doe`
- `---` (divider) → non géré → affiche `---` en texte
- `*italic*` (astérisques simples) → `parseInline` ne les gère pas → affiche `*text*`

- [ ] **Step 1 : Ouvrir `web/app/components/CvRewritePdf.tsx`**

Repérer la fonction `parseInline` (ligne 33) et la fonction `parse` (ligne 66).

- [ ] **Step 2 : Mettre à jour `parseInline` pour stripper les `*italic*`**

Remplacer la fonction `parseInline` existante par :

```typescript
function parseInline(text: string): Segment[] {
  // Strip single asterisks used for italic (no italic font available)
  const cleaned = text.replace(/\*([^*]+)\*/g, '$1');
  const segments: Segment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > last) segments.push({ bold: false, text: cleaned.slice(last, match.index) });
    segments.push({ bold: true, text: match[1] });
    last = regex.lastIndex;
  }
  if (last < cleaned.length) segments.push({ bold: false, text: cleaned.slice(last) });
  return segments;
}
```

- [ ] **Step 3 : Ajouter le type `h1` dans `Block`**

Remplacer le type `Block` existant :

```typescript
type Block =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "bullet"; segments: Segment[] }
  | { type: "body"; segments: Segment[] }
  | { type: "spacer" };
```

- [ ] **Step 4 : Mettre à jour la fonction `parse` pour gérer `# ` et `---`**

Remplacer la fonction `parse` existante par :

```typescript
function parse(cv: string): Block[] {
  const hasMarkdown = cv.includes("## ");
  const blocks: Block[] = [];

  for (const raw of cv.split("\n")) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      if (blocks.at(-1)?.type !== "spacer") blocks.push({ type: "spacer" });
      continue;
    }

    // Dividers — skip entirely
    if (/^-{3,}$/.test(trimmed)) continue;

    // Markdown headers
    if (line.startsWith("# ") && !line.startsWith("## ")) {
      blocks.push({ type: "h1", text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith("## ")) { blocks.push({ type: "h2", text: line.slice(3).trim() }); continue; }
    if (line.startsWith("### ")) { blocks.push({ type: "h3", text: line.slice(4).trim() }); continue; }

    // Bullets (markdown or unicode)
    if (/^[-*•]\s+/.test(line)) {
      blocks.push({ type: "bullet", segments: parseInline(trimmed.replace(/^[-*•]\s+/, "")) });
      continue;
    }

    // Fallback for plain-text CVs: ALL-CAPS short lines = section headers
    if (!hasMarkdown && trimmed === trimmed.toUpperCase() && trimmed.length < 55 && /[A-Z]{2,}/.test(trimmed) && !/\d{4}/.test(trimmed)) {
      blocks.push({ type: "h2", text: trimmed });
      continue;
    }

    blocks.push({ type: "body", segments: parseInline(trimmed) });
  }

  return blocks;
}
```

- [ ] **Step 5 : Vérifier que TypeScript compile**

```bash
cd /home/lenny/RejectCheck/web && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur sur `CvRewritePdf.tsx` (les erreurs h1 seront corrigées dans la prochaine tâche).

- [ ] **Step 6 : Commit**

```bash
git add web/app/components/CvRewritePdf.tsx
git commit -m "fix(pdf): handle # headers, --- dividers and *italic* in markdown parser"
```

---

## Task 2 — Redesign monochrome du PDF

**Files:**
- Modify: `web/app/components/CvRewritePdf.tsx`

Passer le PDF en monochrome élégant : supprimer le rouge, remplacer les points bullet rouges par un tiret simple, ajouter le style `h1` pour le nom.

- [ ] **Step 1 : Remplacer les constantes de couleur et les styles**

En haut du fichier, remplacer les constantes et `styles` existants :

```typescript
const TEXT = "#1a1917";
const MUTED = "#5a5856";
const RULE = "#d1d0ce";
```

(Supprimer `const RED = "#C93A39";`)

Remplacer `const styles = StyleSheet.create({...})` par :

```typescript
const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, backgroundColor: "#ffffff", fontFamily: "InstrumentSans", color: TEXT },
  h1: { fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 2 },
  h2: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: TEXT, marginTop: 18, marginBottom: 3 },
  h2Rule: { height: 0.75, backgroundColor: RULE, marginBottom: 7 },
  h3: { fontSize: 10.5, fontWeight: 700, color: TEXT, marginTop: 7, marginBottom: 1 },
  body: { fontSize: 10, lineHeight: 1.55, color: MUTED, marginBottom: 1 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1, marginLeft: 4 },
  bulletDash: { fontSize: 10, color: MUTED, marginRight: 6, lineHeight: 1.55 },
  bulletText: { fontSize: 10, lineHeight: 1.55, color: MUTED, flex: 1 },
  spacer: { height: 4 },
});
```

- [ ] **Step 2 : Mettre à jour le rendu pour utiliser `h1` et le nouveau bullet**

Remplacer la fonction `CvRewritePdf` existante par :

```typescript
export function CvRewritePdf({ cvText }: { cvText: string }) {
  const blocks = parse(cvText);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block, i) => {
          if (block.type === "spacer") return <View key={i} style={styles.spacer} />;
          if (block.type === "h1") return <Text key={i} style={styles.h1}>{block.text}</Text>;
          if (block.type === "h2") return (
            <View key={i}>
              <Text style={styles.h2}>{block.text}</Text>
              <View style={styles.h2Rule} />
            </View>
          );
          if (block.type === "h3") return <Text key={i} style={styles.h3}>{block.text}</Text>;
          if (block.type === "bullet") return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDash}>–</Text>
              <RichText segments={block.segments} style={styles.bulletText} />
            </View>
          );
          return <RichText key={i} segments={block.segments} style={styles.body} />;
        })}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3 : Vérifier que TypeScript compile sans erreur**

```bash
cd /home/lenny/RejectCheck/web && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur sur `CvRewritePdf.tsx`.

- [ ] **Step 4 : Commit**

```bash
git add web/app/components/CvRewritePdf.tsx
git commit -m "enhance(pdf): monochrome elegant style, dash bullets, h1 name header"
```

---

## Task 3 — Exposer `cvText` dans l'event SSE du backend

**Files:**
- Modify: `backend/src/analyze/analyze.controller.ts` (ligne 88)

Actuellement l'event `done` envoie `{ step: 'done', result, analysisId }`. On ajoute `cvText` pour que le frontend puisse afficher l'original.

- [ ] **Step 1 : Localiser la ligne `write({ step: 'done', result, analysisId })`**

Dans `backend/src/analyze/analyze.controller.ts`, trouver la ligne ~88 dans la méthode `@Post()`.

- [ ] **Step 2 : Ajouter `cvText` à l'event done**

Remplacer :
```typescript
write({ step: 'done', result, analysisId });
```

Par :
```typescript
write({ step: 'done', result, analysisId, cvText: parsedCv });
```

- [ ] **Step 3 : Vérifier que le backend compile**

```bash
cd /home/lenny/RejectCheck/backend && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add backend/src/analyze/analyze.controller.ts
git commit -m "feat(api): include cvText in SSE done event for comparison view"
```

---

## Task 4 — Stocker `originalCv` dans `page.tsx`

**Files:**
- Modify: `web/app/analyze/page.tsx`

Ajouter l'état `originalCv` et le peupler depuis :
1. L'event SSE `done` (nouvelle analyse)
2. Le fetch get-by-ID (chargement d'une analyse existante)

- [ ] **Step 1 : Ajouter le state `originalCv`**

Après la ligne `const [isRewriting, setIsRewriting] = useState(false);` (~ligne 59), ajouter :

```typescript
const [originalCv, setOriginalCv] = useState<string | null>(null);
```

- [ ] **Step 2 : Peupler depuis le fetch get-by-ID**

Dans le bloc `then(data => {` (~ligne 107), après `setAnalysisId(parseInt(id));`, ajouter :

```typescript
if (data.cvText) setOriginalCv(data.cvText);
```

- [ ] **Step 3 : Peupler depuis l'event SSE done (nouvelle analyse)**

Dans le handler SSE à `if (payload.step === "done")` (~ligne 166), après `if (payload.analysisId) setAnalysisId(payload.analysisId);`, ajouter :

```typescript
if (payload.cvText) setOriginalCv(payload.cvText);
```

- [ ] **Step 4 : Reset dans `handleReset`**

Dans la fonction `handleReset` (~ligne 184), après `setReconstructedCv(null);`, ajouter :

```typescript
setOriginalCv(null);
```

- [ ] **Step 5 : Passer `originalCv` à `<ImproveTab>`**

Trouver le bloc `<ImproveTab` (~ligne 381) et ajouter la prop :

```tsx
<ImproveTab
  reconstructedCv={reconstructedCv}
  originalCv={originalCv}
  isLoading={isRewriting}
  isPremium={!!activeSubscription}
  hasAnalysisId={!!analysisId}
  onRewrite={handleRewrite}
/>
```

- [ ] **Step 6 : Vérifier TypeScript**

```bash
cd /home/lenny/RejectCheck/web && npx tsc --noEmit 2>&1 | head -30
```

Attendu : erreur sur `ImproveTab` car la prop `originalCv` n'existe pas encore — c'est normal, sera corrigée en Task 5.

- [ ] **Step 7 : Commit**

```bash
git add web/app/analyze/page.tsx
git commit -m "feat(frontend): store and propagate originalCv for comparison view"
```

---

## Task 5 — Créer `CvMarkdownRenderer`

**Files:**
- Create: `web/app/components/CvMarkdownRenderer.tsx`

Composant React qui prend un string markdown et l'affiche en HTML stylisé, via `react-markdown` (déjà installé).

- [ ] **Step 1 : Créer le fichier**

```typescript
// web/app/components/CvMarkdownRenderer.tsx
"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-rc-text mb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <div className="mt-5 mb-2">
      <h2 className="text-[9px] font-bold uppercase tracking-[2px] text-rc-text">{children}</h2>
      <div className="h-px bg-rc-border mt-1" />
    </div>
  ),
  h3: ({ children }) => (
    <h3 className="text-[11px] font-bold text-rc-text mt-2 mb-0.5">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-[11px] text-rc-muted leading-relaxed mb-1">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-0.5 mb-1">{children}</ul>
  ),
  li: ({ children }) => (
    <li className="flex gap-2 text-[11px] text-rc-muted leading-relaxed">
      <span className="shrink-0 mt-0.5">–</span>
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-rc-text">{children}</strong>
  ),
  hr: () => null,
};

export function CvMarkdownRenderer({ markdown }: { markdown: string }) {
  return (
    <div className="font-sans">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 2 : Vérifier TypeScript**

```bash
cd /home/lenny/RejectCheck/web && npx tsc --noEmit 2>&1 | grep CvMarkdownRenderer
```

Attendu : aucune erreur sur ce fichier.

- [ ] **Step 3 : Commit**

```bash
git add web/app/components/CvMarkdownRenderer.tsx
git commit -m "feat(ui): CvMarkdownRenderer component for in-browser CV preview"
```

---

## Task 6 — Mettre à jour ImproveTab avec la vue côte à côte

**Files:**
- Modify: `web/app/components/tabs/ImproveTab.tsx`

Ajouter la prop `originalCv`, remplacer l'état "success" par le layout Avant/Après.

- [ ] **Step 1 : Ajouter l'import et mettre à jour le type des props**

En haut du fichier, ajouter l'import :

```typescript
import { CvMarkdownRenderer } from "../CvMarkdownRenderer";
```

Remplacer le type `ImproveTabProps` existant :

```typescript
type ImproveTabProps = {
  reconstructedCv: string | null;
  originalCv: string | null;
  isLoading: boolean;
  isPremium: boolean;
  hasAnalysisId: boolean;
  onRewrite: () => void;
};
```

Mettre à jour la signature de la fonction :

```typescript
export function ImproveTab({ reconstructedCv, originalCv, isLoading, isPremium, hasAnalysisId, onRewrite }: ImproveTabProps) {
```

- [ ] **Step 2 : Remplacer le bloc `if (reconstructedCv)` par le layout côte à côte**

Remplacer le bloc `if (reconstructedCv) { return (...) }` existant (lignes 68-101) par :

```tsx
if (reconstructedCv) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-rc-green shrink-0" />
          <p className="text-[15px] font-semibold text-rc-text">Your improved CV is ready.</p>
        </div>
        <button
          onClick={onRewrite}
          className="font-mono text-[10px] uppercase tracking-widest text-rc-hint hover:text-rc-muted transition-colors"
        >
          Regenerate
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left — Original */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-rc-hint font-bold">Original</p>
          <div className="h-[480px] overflow-y-auto rounded-xl border border-rc-border bg-rc-surface/30 p-4">
            <pre className="text-[11px] text-rc-muted leading-relaxed whitespace-pre-wrap font-mono">
              {originalCv ?? "Original CV not available."}
            </pre>
          </div>
        </div>

        {/* Right — Improved */}
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-rc-red font-bold">✦ Improved</p>
          <div className="h-[480px] overflow-y-auto rounded-xl border border-rc-red/20 bg-rc-surface/10 p-4">
            <CvMarkdownRenderer markdown={reconstructedCv} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleExport}
          disabled={isExportingPdf}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/20 font-bold disabled:opacity-50"
        >
          {isExportingPdf
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" />
          }
          Download PDF
        </button>
        <p className="font-mono text-[10px] text-rc-hint">
          Open in any PDF viewer or send directly to recruiters.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Vérifier TypeScript**

```bash
cd /home/lenny/RejectCheck/web && npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add web/app/components/tabs/ImproveTab.tsx
git commit -m "feat(ui): side-by-side before/after comparison in ImproveTab"
```

---

## Task 7 — Vérification end-to-end

- [ ] **Step 1 : Lancer le backend**

```bash
cd /home/lenny/RejectCheck/backend && npm run start:dev
```

- [ ] **Step 2 : Lancer le frontend**

```bash
cd /home/lenny/RejectCheck/web && npm run dev
```

- [ ] **Step 3 : Vérifier le PDF (fix markdown brut)**

1. Ouvrir `http://localhost:3000`
2. Soumettre un CV avec une offre d'emploi
3. Aller sur l'onglet "Improve" et cliquer "Rewrite my CV"
4. Cliquer "Download PDF"
5. Ouvrir le PDF et vérifier :
   - ✅ Aucun token brut : pas de `##`, `**`, `#`, `---`, `*text*`
   - ✅ Style monochrome : pas de rouge dans le corps du PDF
   - ✅ Bullets affichés avec `–` (tiret)
   - ✅ Si le nom est sur une ligne `# Name` → rendu en 20px bold

- [ ] **Step 4 : Vérifier la vue côte à côte**

1. Après le rewrite, vérifier que la page affiche deux colonnes
2. Colonne gauche : texte brut du CV original (monospace, fond gris)
3. Colonne droite : CV amélioré rendu en HTML propre (headers, bullets, bold)
4. Le bouton "Download PDF" est visible en dessous

- [ ] **Step 5 : Vérifier le chargement par ID**

1. Copier l'URL avec `?id=XXX`
2. Rafraîchir la page
3. Aller sur l'onglet "Improve"
4. Vérifier que `originalCv` est bien affiché à gauche (et pas "Original CV not available.")
