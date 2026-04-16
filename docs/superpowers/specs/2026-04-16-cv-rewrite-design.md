# CV Rewrite — Design Spec
**Date:** 2026-04-16  
**Branch:** enhance/cv-rewrite

---

## Context

The CV Rewrite feature (premium) rewrites the user's CV via GPT-4o and exports it as a PDF. Two problems:

1. **Markdown brut dans le PDF** — le parser de `CvRewritePdf.tsx` rate des cas (`# ` single hash, `*italic*`, `---` dividers) → les tokens markdown apparaissent en texte brut dans le PDF exporté.
2. **Pas d'aperçu** — l'utilisateur ne voit que "Download PDF" avec aucun retour visuel. Il télécharge sans savoir ce qu'il reçoit.

---

## Solution

### 1. Fix + Redesign du PDF (`CvRewritePdf.tsx`)

**Parser — cas manquants à ajouter :**
- `# TEXT` (single hash) → header de nom, rendu comme titre principal (18px, bold)
- `---` → skip (divider ignoré, pas affiché en texte)
- `*italic*` → strip les astérisques simples (pas de police italic dans InstrumentSans), afficher en texte normal

**Nouveau style — monochrome élégant (sans rouge) :**

| Élément | Style actuel | Nouveau style |
|---|---|---|
| Nom (# header) | non géré | 18px, bold, TEXT, marginBottom 4 |
| Section (## header) | 9px, uppercase, rouge | 8px, uppercase, letterSpacing 2, TEXT, thin rule |
| Sous-titre (### header) | 10.5px bold | inchangé |
| Body text | 10px, MUTED | inchangé |
| Bullet dot | rond rouge 3px | tiret simple `–` en MUTED |
| Couleur accent | RED (#C93A39) partout | supprimé du PDF |

---

### 2. Aperçu Avant/Après dans ImproveTab

Quand `reconstructedCv` est disponible, l'`ImproveTab` affiche une comparaison côte à côte :

```
┌─────────────────────┬─────────────────────┐
│  Original           │  ✨ Amélioré         │
│  (texte brut,       │  (rendu HTML propre  │
│   fond gris)        │   via react-markdown)│
│                     │                     │
│  responsible for    │  Led backend arch... │
│  worked on API...   │  Built REST API...   │
└─────────────────────┴─────────────────────┘
         [ Download PDF ]
```

- **Gauche** : texte brut scrollable, fond `bg-rc-surface/30`, police mono, gris
- **Droite** : `CvMarkdownRenderer` (nouveau composant) — rendu HTML propre
- **En dessous** : bouton "Download PDF" existant

---

### 3. Nouveau composant `CvMarkdownRenderer`

Fichier : `web/app/components/CvMarkdownRenderer.tsx`

Utilise `react-markdown` (déjà installé, déjà utilisé dans l'app). Styles Tailwind inline.

Mapping markdown → HTML :
- `## SECTION` → `<h2>` uppercase, letterSpacing, border-bottom fin
- `### Subtitle` → `<h3>` bold
- `**bold**` → `<strong>`
- `- bullet` → `<li>` avec tiret
- Body text → `<p>`

---

### 4. Exposer `cvText` au frontend

**Problème** : le texte original du CV n'est pas dans le state frontend actuellement.

**Changements :**

**Backend** — `analyze.controller.ts` ligne 88 :
```diff
- write({ step: 'done', result, analysisId });
+ write({ step: 'done', result, analysisId, cvText: parsedCv });
```

**Frontend** — `page.tsx` :
1. Ajouter `const [originalCv, setOriginalCv] = useState<string | null>(null)`
2. SSE done event : `if (payload.cvText) setOriginalCv(payload.cvText)`
3. Chargement par ID : `if (data.cvText) setOriginalCv(data.cvText)`
4. Dans `handleReset()` : `setOriginalCv(null)`
5. Passer `originalCv` à `<ImproveTab>`

**ImproveTab** — ajouter prop `originalCv: string | null`

---

## Fichiers à modifier

| Fichier | Changement |
|---|---|
| `backend/src/analyze/analyze.controller.ts` | +`cvText` dans l'event `done` (ligne 88) |
| `web/app/analyze/page.tsx` | +state `originalCv`, populate depuis SSE + get-by-ID, passer à ImproveTab |
| `web/app/components/tabs/ImproveTab.tsx` | +prop `originalCv`, layout côte à côte quand rewrite dispo |
| `web/app/components/CvRewritePdf.tsx` | Fix parser (`#`, `---`, `*italic*`) + redesign styles monochrome |
| `web/app/components/CvMarkdownRenderer.tsx` | **Nouveau** — react-markdown wrapper stylisé |

---

## Vérification

1. Lancer le backend et le frontend en dev
2. Soumettre un CV → vérifier que `cvText` arrive dans le state (console.log)
3. Déclencher le rewrite → vérifier la vue côte à côte avec texte original à gauche, HTML rendu à droite
4. Télécharger le PDF → vérifier :
   - Aucun token markdown brut (`##`, `**`, `#`, `---`, `*`) visible
   - Style monochrome (pas de rouge)
   - Nom bien affiché si GPT l'a mis en `# Name`
5. Charger une analyse existante par ID → vérifier que `originalCv` se repopule correctement
