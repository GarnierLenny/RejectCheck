# SEO Indexation Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Résoudre les 3 catégories de problèmes d'indexation Google Search Console rapportés le 24/04/2026 sur rejectcheck.com (3 pages avec redirection, 1 erreur de redirection, 11 pages détectées non indexées) et augmenter le taux d'indexation.

**Architecture:** Le travail se divise en 3 phases : (1) corrections code (proxy redirects, maillage interne, schema markup), (2) actions manuelles SEO dans Google Search Console (investigation + demandes d'indexation), (3) acquisition de backlinks pour débloquer l'indexation des pages détectées.

**Tech Stack:** Next.js 16 (App Router), TypeScript, middleware (proxy.ts), schema.org JSON-LD, Google Search Console.

---

## Contexte du diagnostic

**Données GSC du 24/04/2026 :**
- **Page avec redirection** : 3 pages (validation Échec) — informational, pas bloquant
- **Erreur liée à des redirections** : 1 page (non commencée) — à investiguer
- **Détectée, actuellement non indexée** : 11 pages (non commencé) — vrai problème

**Sitemap actuel** (`app/sitemap.ts`) : 9 routes × 2 langues = 18 URLs (`/en/...` + `/fr/...`)

**Stack des pages alternatives** : `/[lang]/alternatives/{jobscan,rezi,resume-worded}/` — déjà bilingues, ~600+ lignes de contenu chacune.

**Maillage interne actuel** : alternatives liées **uniquement depuis le footer** (homepage ligne 947, pricing ligne 294). Trop faible.

---

## File Structure

**Files to modify:**
- `web/proxy.ts` — passer le redirect `/analyse → /fr/analyze` en 301
- `web/app/[lang]/page.tsx` — ajouter section "Comparison" liant aux alternatives
- `web/app/[lang]/pricing/page.tsx` — ajouter lien proéminent vers /alternatives
- `web/app/[lang]/alternatives/page.tsx` — ajouter schema ItemList JSON-LD
- `web/app/[lang]/alternatives/jobscan/page.tsx` — ajouter schema Article JSON-LD
- `web/app/[lang]/alternatives/rezi/page.tsx` — ajouter schema Article JSON-LD
- `web/app/[lang]/alternatives/resume-worded/page.tsx` — ajouter schema Article JSON-LD

**Files to create:**
- `web/e2e/redirects.spec.ts` — vérifier que `/analyse` renvoie un 301 vers `/fr/analyze`
- `docs/superpowers/plans/2026-04-27-seo-indexation-manual-actions.md` — checklist des actions manuelles GSC + backlinks

---

## Phase 1 : Corrections code (Tasks 1-5)

### Task 1: Passer le redirect `/analyse → /fr/analyze` en 301

**Files:**
- Modify: `web/proxy.ts:46-54`
- Test: `web/e2e/redirects.spec.ts` (à créer)

**Pourquoi :** Le redirect `/analyse → /fr/analyze` est un alias permanent (pas une content negotiation). Un 301 transfère pleinement l'autorité SEO, contrairement au 307 actuel. Les autres redirects (locale detection ligne 68) restent en 307 car ils dépendent de Accept-Language.

- [ ] **Step 1: Créer le test e2e qui doit échouer**

Créer `web/e2e/redirects.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

test.describe('Redirects SEO', () => {
  test('/analyse redirige en 301 vers /fr/analyze', async ({ request }) => {
    const response = await request.get('/analyse', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toContain('/fr/analyze')
  })

  test('/analyse/sub-path préserve le path après redirect 301', async ({ request }) => {
    const response = await request.get('/analyse/sub-path', { maxRedirects: 0 })
    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toContain('/fr/analyze/sub-path')
  })
})
```

- [ ] **Step 2: Lancer le test pour confirmer qu'il échoue**

Run: `cd web && npx playwright test e2e/redirects.spec.ts`
Expected: FAIL — le statut actuel est 307, pas 301.

- [ ] **Step 3: Modifier proxy.ts pour passer en 301**

Dans `web/proxy.ts`, remplacer ligne 51 :

```ts
// Avant
const res = NextResponse.redirect(url)

// Après
const res = NextResponse.redirect(url, { status: 301 })
```

Le bloc complet (lignes 46-54) devient :

```ts
// Handle French URL alias /analyse → /fr/analyze
if (pathname === '/analyse' || pathname.startsWith('/analyse/')) {
  const rest = pathname.slice('/analyse'.length)
  const url = request.nextUrl.clone()
  url.pathname = `/fr/analyze${rest}`
  const res = NextResponse.redirect(url, { status: 301 })
  res.cookies.set(LOCALE_COOKIE, 'fr', { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return res
}
```

⚠️ **Ne PAS modifier la ligne 68** (locale detection redirect) — elle doit rester en 307 car la destination dépend de `Accept-Language` / cookie.

- [ ] **Step 4: Lancer le test pour confirmer qu'il passe**

Run: `cd web && npx playwright test e2e/redirects.spec.ts`
Expected: PASS — les deux tests passent en vert.

- [ ] **Step 5: Lancer le typecheck et le lint**

Run: `cd web && npm run typecheck && npm run lint`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add web/proxy.ts web/e2e/redirects.spec.ts
git commit -m "fix(seo): use 301 for /analyse alias redirect to transfer authority"
```

---

### Task 2: Ajouter une section "Compare alternatives" sur la homepage

**Files:**
- Modify: `web/app/[lang]/page.tsx` — ajouter une section avant le footer

**Pourquoi :** Actuellement, le seul lien vers `/alternatives` est dans le footer (ligne 947). Une section dédiée avec 3 liens internes (Jobscan / Rezi / Resume Worded) augmente l'autorité interne transmise à ces pages, ce qui aide Google à les juger dignes d'indexation.

- [ ] **Step 1: Lire la homepage pour identifier le bon emplacement**

Run: `cd web && grep -n "footer\|alternatives" app/\[lang\]/page.tsx | head -20`

Repérer la section juste avant le footer (probablement autour des lignes 920-940).

- [ ] **Step 2: Ajouter le bloc dictionnaire**

Dans `web/app/[lang]/dictionaries/en.json` (ou équivalent — vérifier la structure exacte), ajouter sous `landing` :

```json
"compareSection": {
  "badge": "Honest comparison",
  "title": "How RejectCheck compares to Jobscan, Rezi, and Resume Worded",
  "subtitle": "We don't hide our weaknesses. See the full breakdown vs. the most popular alternatives.",
  "jobscan": "vs. Jobscan",
  "rezi": "vs. Rezi",
  "resumeWorded": "vs. Resume Worded",
  "viewAll": "See all 7 alternatives →"
}
```

Et dans `fr.json` :

```json
"compareSection": {
  "badge": "Comparaison honnête",
  "title": "Comment RejectCheck se compare à Jobscan, Rezi, et Resume Worded",
  "subtitle": "On ne cache pas nos faiblesses. Vois le breakdown complet face aux alternatives populaires.",
  "jobscan": "vs. Jobscan",
  "rezi": "vs. Rezi",
  "resumeWorded": "vs. Resume Worded",
  "viewAll": "Voir les 7 alternatives →"
}
```

- [ ] **Step 3: Ajouter la section dans `page.tsx`**

Insérer juste avant la balise `<footer>` :

```tsx
<section className="border-t border-rc-border py-16 px-4">
  <div className="max-w-5xl mx-auto">
    <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-rc-muted">
      {t.landing.compareSection.badge}
    </span>
    <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-rc-text">
      {t.landing.compareSection.title}
    </h2>
    <p className="mt-2 text-rc-muted">{t.landing.compareSection.subtitle}</p>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
      <Link href={localePath('/alternatives/jobscan')} className="rounded-lg border border-rc-border px-4 py-3 hover:border-rc-red transition-colors">
        {t.landing.compareSection.jobscan}
      </Link>
      <Link href={localePath('/alternatives/rezi')} className="rounded-lg border border-rc-border px-4 py-3 hover:border-rc-red transition-colors">
        {t.landing.compareSection.rezi}
      </Link>
      <Link href={localePath('/alternatives/resume-worded')} className="rounded-lg border border-rc-border px-4 py-3 hover:border-rc-red transition-colors">
        {t.landing.compareSection.resumeWorded}
      </Link>
    </div>
    <Link href={localePath('/alternatives')} className="mt-6 inline-block font-mono text-[11px] tracking-[0.05em] text-rc-red hover:underline">
      {t.landing.compareSection.viewAll}
    </Link>
  </div>
</section>
```

- [ ] **Step 4: Vérifier visuellement**

Run: `cd web && npm run dev`
Ouvrir `http://localhost:3000/en` et `http://localhost:3000/fr`. Vérifier que la nouvelle section apparaît avant le footer, dans les deux langues, et que les 4 liens fonctionnent (3 cartes + "See all").

- [ ] **Step 5: Lancer le typecheck**

Run: `cd web && npm run typecheck`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add web/app/[lang]/page.tsx web/app/[lang]/dictionaries/en.json web/app/[lang]/dictionaries/fr.json
git commit -m "feat(seo): add compare-alternatives section on homepage for internal linking"
```

---

### Task 3: Renforcer le lien `/alternatives` sur la page pricing

**Files:**
- Modify: `web/app/[lang]/pricing/page.tsx`

**Pourquoi :** Sur la page pricing, le seul lien vers `/alternatives` est dans le footer (ligne 294). Ajouter un encart "Pas convaincu ? Compare avec les alternatives" avant la grille de prix transfère plus d'autorité.

- [ ] **Step 1: Lire la structure de pricing/page.tsx**

Run: `cd web && grep -n "section\|<h1\|<h2" app/\[lang\]/pricing/page.tsx | head -20`

Identifier l'emplacement après le hero / au-dessus du tableau de pricing.

- [ ] **Step 2: Ajouter les clés de traduction**

Dans `en.json`, sous `pricing` :

```json
"compareNote": {
  "text": "Want to compare us with Jobscan, Rezi, or other tools first?",
  "link": "See the full alternatives comparison →"
}
```

Dans `fr.json`, sous `pricing` :

```json
"compareNote": {
  "text": "Tu veux nous comparer à Jobscan, Rezi, ou d'autres outils d'abord ?",
  "link": "Voir la comparaison complète des alternatives →"
}
```

- [ ] **Step 3: Insérer l'encart dans pricing/page.tsx**

Après le titre / sous-titre principal de la page, ajouter :

```tsx
<div className="mt-4 inline-flex items-center gap-2 rounded-full border border-rc-border px-4 py-2 text-sm text-rc-muted">
  <span>{t.pricing.compareNote.text}</span>
  <Link href={localePath('/alternatives')} className="text-rc-red hover:underline font-medium">
    {t.pricing.compareNote.link}
  </Link>
</div>
```

- [ ] **Step 4: Vérifier visuellement**

Run: `cd web && npm run dev` (si pas déjà lancé)
Ouvrir `http://localhost:3000/en/pricing` et `http://localhost:3000/fr/pricing`. Vérifier que l'encart apparaît proéminemment.

- [ ] **Step 5: Commit**

```bash
git add web/app/[lang]/pricing/page.tsx web/app/[lang]/dictionaries/en.json web/app/[lang]/dictionaries/fr.json
git commit -m "feat(seo): add prominent alternatives link on pricing page for internal linking"
```

---

### Task 4: Ajouter schema.org `ItemList` sur la page hub `/alternatives`

**Files:**
- Modify: `web/app/[lang]/alternatives/page.tsx`

**Pourquoi :** La page hub liste plusieurs alternatives. Le schema `ItemList` aide Google à comprendre la structure et augmente les chances d'apparition en rich results, ce qui force l'indexation. Voir https://schema.org/ItemList.

- [ ] **Step 1: Lire la page actuelle pour comprendre le rendu**

Run: `cd web && head -80 app/\[lang\]/alternatives/page.tsx`

Identifier où est généré le `<head>` ou le `Metadata` et où se fait le rendu de la liste.

- [ ] **Step 2: Lire le composant JsonLd existant**

Run: `cd web && find app -name "JsonLd*" -type f`

Lire le fichier pour voir comment les schemas sont injectés ailleurs dans le projet.

- [ ] **Step 3: Ajouter le schema ItemList**

Dans `web/app/[lang]/alternatives/page.tsx`, dans le rendu (ou via un composant `<JsonLd>` selon le pattern existant) :

```tsx
const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: lang === 'fr'
    ? 'Alternatives à Jobscan, Rezi, Resume Worded'
    : 'Alternatives to Jobscan, Rezi, Resume Worded',
  description: lang === 'fr'
    ? 'Comparaison honnête des outils ATS et builders de CV.'
    : 'Honest comparison of ATS tools and CV builders.',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      url: `https://rejectcheck.com/${lang}/alternatives/jobscan`,
      name: 'Jobscan alternatives',
    },
    {
      '@type': 'ListItem',
      position: 2,
      url: `https://rejectcheck.com/${lang}/alternatives/rezi`,
      name: 'Rezi alternatives',
    },
    {
      '@type': 'ListItem',
      position: 3,
      url: `https://rejectcheck.com/${lang}/alternatives/resume-worded`,
      name: 'Resume Worded alternatives',
    },
  ],
}
```

Et dans le JSX :

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
/>
```

- [ ] **Step 4: Vérifier le rendu HTML**

Run: `cd web && npm run dev`
Ouvrir `http://localhost:3000/en/alternatives`, faire "View Source", chercher `application/ld+json`. Confirmer que le schema apparaît bien dans le HTML rendu (pas juste injecté côté client).

- [ ] **Step 5: Valider avec Schema Validator**

Copier le JSON-LD généré, coller dans https://validator.schema.org/. Confirmer "0 erreurs".

- [ ] **Step 6: Commit**

```bash
git add web/app/[lang]/alternatives/page.tsx
git commit -m "feat(seo): add ItemList JSON-LD schema on alternatives hub page"
```

---

### Task 5: Ajouter schema.org `Article` sur chaque page alternative

**Files:**
- Modify: `web/app/[lang]/alternatives/jobscan/page.tsx`
- Modify: `web/app/[lang]/alternatives/rezi/page.tsx`
- Modify: `web/app/[lang]/alternatives/resume-worded/page.tsx`

**Pourquoi :** Le contenu de ces pages est éditorial (comparaison, FAQ, decision guide). Le schema `Article` (ou `ComparisonPage` via Article) signale à Google qu'il s'agit de contenu original éditorial, augmentant la priorité d'indexation. Le schema `FAQPage` sur le bloc FAQ génère des rich results.

- [ ] **Step 1: Définir un composant `AlternativesSchema` réutilisable**

Créer `web/app/[lang]/alternatives/_components/AlternativesSchema.tsx` :

```tsx
type Props = {
  lang: 'en' | 'fr'
  slug: string // ex: 'jobscan'
  title: string
  description: string
  faqItems: Array<{ question: string; answer: string }>
  lastUpdated: string // ISO date string
}

export function AlternativesSchema({ lang, slug, title, description, faqItems, lastUpdated }: Props) {
  const url = `https://rejectcheck.com/${lang}/alternatives/${slug}`
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished: lastUpdated,
    dateModified: lastUpdated,
    inLanguage: lang === 'fr' ? 'fr-FR' : 'en-US',
    author: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: 'https://rejectcheck.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: 'https://rejectcheck.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://rejectcheck.com/RejectCheck.png',
      },
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
```

- [ ] **Step 2: Intégrer dans `jobscan/page.tsx`**

Lire `web/app/[lang]/alternatives/jobscan/page.tsx` pour voir où s'effectue le rendu. Importer le composant et l'utiliser dans le JSX :

```tsx
import { AlternativesSchema } from '../_components/AlternativesSchema'
import { getContent } from './content'

// dans le composant page :
const content = getContent(lang)
return (
  <>
    <AlternativesSchema
      lang={lang}
      slug="jobscan"
      title={content.title}
      description={content.description}
      faqItems={content.faqItems}
      lastUpdated="2026-04-24"
    />
    {/* reste du rendu... */}
  </>
)
```

- [ ] **Step 3: Répéter pour rezi/page.tsx et resume-worded/page.tsx**

Même pattern, en changeant juste le `slug` (`'rezi'` puis `'resume-worded'`).

- [ ] **Step 4: Vérifier le rendu HTML**

Run: `cd web && npm run dev`
Pour chaque URL ci-dessous, View Source et confirmer la présence des deux scripts `application/ld+json` (Article + FAQPage) :
- `http://localhost:3000/en/alternatives/jobscan`
- `http://localhost:3000/fr/alternatives/jobscan`
- `http://localhost:3000/en/alternatives/rezi`
- `http://localhost:3000/fr/alternatives/rezi`
- `http://localhost:3000/en/alternatives/resume-worded`
- `http://localhost:3000/fr/alternatives/resume-worded`

- [ ] **Step 5: Valider avec Google Rich Results Test**

Pour `https://rejectcheck.com/en/alternatives/jobscan` (après déploiement) :
https://search.google.com/test/rich-results

Confirmer que :
- L'Article schema est détecté
- Le FAQPage schema est détecté
- Aucune erreur, aucun warning critique

- [ ] **Step 6: Commit**

```bash
git add web/app/[lang]/alternatives/_components/AlternativesSchema.tsx \
        web/app/[lang]/alternatives/jobscan/page.tsx \
        web/app/[lang]/alternatives/rezi/page.tsx \
        web/app/[lang]/alternatives/resume-worded/page.tsx
git commit -m "feat(seo): add Article + FAQPage JSON-LD schemas on alternatives pages"
```

---

## Phase 2 : Vérification & Build (Task 6)

### Task 6: Build, lint, et déploiement

**Files:**
- Aucun changement, tests d'intégration uniquement.

- [ ] **Step 1: Lancer le typecheck complet**

Run: `cd web && npm run typecheck`
Expected: aucune erreur.

- [ ] **Step 2: Lancer le lint**

Run: `cd web && npm run lint`
Expected: aucune erreur.

- [ ] **Step 3: Lancer la build de production**

Run: `cd web && npm run build`
Expected: build success, aucun warning critique.

- [ ] **Step 4: Lancer les tests e2e existants + le nouveau redirect.spec**

Run: `cd web && npm run test:e2e`
Expected: tous les tests passent.

- [ ] **Step 5: Vérifier le sitemap déployé en local**

Run: `cd web && npm run start` (après build) ou `npm run dev`
Ouvrir `http://localhost:3000/sitemap.xml`. Confirmer que les 18 URLs sont listées avec hreflang.

- [ ] **Step 6: Vérifier robots.txt**

Ouvrir `http://localhost:3000/robots.txt`. Confirmer la présence de :
- `User-agent: *` avec `Allow: /` et `Disallow: /api/`
- `Sitemap: https://rejectcheck.com/sitemap.xml`

- [ ] **Step 7: Push & deploy**

```bash
git push origin main
```

Confirmer que le déploiement Vercel passe (vérifier dans le dashboard Vercel ou via `vercel ls`).

---

## Phase 3 : Actions manuelles SEO (Task 7-9)

### Task 7: Investigation de l'erreur de redirection (1 page)

**Pré-requis :** Accès à Google Search Console, propriété `rejectcheck.com` configurée.

- [ ] **Step 1: Identifier l'URL en erreur**

Aller sur https://search.google.com/search-console → Indexation → Pages → cliquer sur "Erreur liée à des redirections (1)".

Noter l'URL exacte.

- [ ] **Step 2: Tester la redirection avec curl**

Run depuis ton terminal :

```bash
curl -I -L --max-redirs 10 https://rejectcheck.com/<URL_EXACTE>
```

Compter le nombre de redirections. Si > 3 ou si présence d'une boucle, c'est la cause.

- [ ] **Step 3: Reproduire en outil Inspection URL de GSC**

Dans GSC : Inspection URL → coller l'URL → "Tester l'URL en direct".

Lire le rapport. Si "boucle de redirection" : il faut casser la chaîne dans `proxy.ts` ou `next.config.ts`.

- [ ] **Step 4: Documenter la cause**

Ajouter une section dans `docs/superpowers/plans/2026-04-27-seo-indexation-manual-actions.md` (créé à la Task 9 ci-dessous) avec : URL en cause, nombre de redirects, cause racine.

- [ ] **Step 5: Si correction code nécessaire, créer un mini-plan**

Si la cause est un bug dans le code (ex: ancien path dans le sitemap qui n'existe plus, double redirect), ouvrir un mini-task list :
- Identifier le fichier responsable
- Corriger
- Test e2e qui couvre le scenario
- Commit + push

---

### Task 8: Demande d'indexation manuelle pour les 11 pages détectées

**Pré-requis :** Phase 1 + 2 déployées en production.

- [ ] **Step 1: Lister les 11 URLs concernées**

Dans GSC → Indexation → Pages → "Détectée, actuellement non indexée (11)" → cliquer pour voir les URLs.

Copier-coller la liste dans un fichier temporaire local.

- [ ] **Step 2: Pour chaque URL, demander l'indexation**

Pour chacune des 11 URLs :
1. GSC → Inspection URL → coller l'URL
2. Si statut "URL inconnue de Google" ou "URL connue mais non indexée" : cliquer **"Demander l'indexation"**
3. Attendre la fin du test (30s à 2min)
4. Confirmer "Indexation demandée"

⚠️ **Quota GSC** : ~10-12 demandes manuelles par jour. Si tu as 11 pages, tu pourras tout faire en une session. Si plus, étaler sur 2 jours.

- [ ] **Step 3: Renvoyer le sitemap**

GSC → Sitemaps → entrer `sitemap.xml` → "Envoyer". Même s'il a déjà été envoyé, le re-soumettre déclenche une nouvelle découverte.

- [ ] **Step 4: Vérifier l'état après 7 jours**

Réouvrir GSC → Indexation → Pages dans 7 jours. Compter combien des 11 URLs sont passées à "Indexées". Documenter dans le fichier d'actions manuelles (Task 9).

---

### Task 9: Plan d'acquisition de backlinks

**Files:**
- Create: `docs/superpowers/plans/2026-04-27-seo-indexation-manual-actions.md`

**Pourquoi :** Les pages "Détectée non indexée" persistent souvent à cause d'un signal d'autorité trop faible. 1-3 backlinks de qualité débloquent en général l'indexation entière du site.

- [ ] **Step 1: Créer le fichier de tracking**

Créer `docs/superpowers/plans/2026-04-27-seo-indexation-manual-actions.md` avec le contenu suivant :

```markdown
# Actions manuelles SEO - 2026-04-27

## Backlinks ciblés

### Haute priorité (quick wins, 1-2 semaines)

- [ ] **Product Hunt launch** — soumettre RejectCheck sur producthunt.com
  - Tagline : "Find out why your CV got rejected — Dual AI (GPT-4o + Claude) diagnosis"
  - Préparer 3 screenshots, demo video 30s, premier commentaire détaillé
  - Lancer un mardi/mercredi 00:01 PST pour visibilité 24h

- [ ] **IndieHackers post** — partager sur indiehackers.com section "Show IH"
  - Titre : "I built RejectCheck after my own CV got rejected 30+ times"
  - Inclure lien vers /alternatives pour transmettre du jus
  - Engager dans les commentaires pendant 48h

- [ ] **Reddit r/jobs / r/cscareerquestions** — post éducatif (pas spam)
  - Titre : "I analyzed 50 rejected CVs - here's the 3 patterns I found"
  - Linker vers /alternatives ou /pricing comme appel à l'action soft
  - Respecter la rule du subreddit (lurker reputation, etc.)

### Moyenne priorité (3-6 semaines)

- [ ] **Sites comparison directories**
  - alternativeto.net (créer une page RejectCheck listée comme alternative à Jobscan)
  - saashub.com
  - g2.com / capterra.com (gratuit pour listing basique)

- [ ] **Guest posts** — pitcher 2-3 blogs RH/tech
  - dev.to (publier un article "How AI evaluates your CV - what we learned building RejectCheck")
  - Hashnode
  - Medium publication "The Startup" ou "Better Programming"

- [ ] **Outreach blogueurs RH FR**
  - Linker la version FR de /alternatives
  - Cible : blogueurs carrière, coachs en candidature, profils LinkedIn FR

### Long terme (3-6 mois)

- [ ] **Programmatic SEO** : créer 50-100 pages "/jobs/<role>/cv-template" basées sur une vraie data API
- [ ] **Outils gratuits viral** : "ATS score checker" public sans signup → traffic organique → backlinks naturels
- [ ] **Newsletter / blog éditorial** : 1 article/semaine sur les patterns CV qui marchent en 2026

## Suivi GSC (Task 7 + 8)

### Erreur de redirection
- URL en cause : *(à remplir Task 7)*
- Cause racine : *(à remplir)*
- Statut correction : *(à remplir)*

### Pages détectées non indexées (11)
- [ ] Liste des 11 URLs : *(à remplir Task 8)*
- [ ] Indexation demandée le : *(date)*
- [ ] Suivi à J+7 : X/11 indexées
- [ ] Suivi à J+14 : X/11 indexées
- [ ] Suivi à J+30 : X/11 indexées

## KPIs

À mesurer dans GSC, comparaison avant/après :
- Pages indexées (cible : 18/18 dans 30 jours)
- Impressions totales (cible : ×2 dans 60 jours)
- Clics organiques (cible : ×3 dans 90 jours)
- Position moyenne des pages /alternatives/* (cible : top 30 → top 10)
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-04-27-seo-indexation-manual-actions.md
git commit -m "docs(seo): add manual SEO actions tracking for indexation fixes"
```

---

## Self-Review

**Couverture du diagnostic :**
- ✅ "Page avec redirection" (3) → Task 1 corrige le 307→301 sur l'alias `/analyse`. Les autres redirects locale-detection restent en 307 (par design, dépendent de Accept-Language)
- ✅ "Erreur liée à des redirections" (1) → Task 7 (investigation manuelle GSC)
- ✅ "Détectée, actuellement non indexée" (11) :
  - Maillage interne renforcé (Tasks 2-3)
  - Schema markup Article + FAQPage + ItemList (Tasks 4-5) → augmente priorité d'indexation
  - Demande manuelle d'indexation (Task 8)
  - Plan backlinks (Task 9) pour résoudre la cause racine (autorité)

**Aucun placeholder :** chaque step contient code/commande exacte, pas de "TBD" ou "implement later".

**Cohérence types :** le composant `AlternativesSchema` est défini Task 5 Step 1 et utilisé Steps 2-3 avec les mêmes props.

---

## Ordre d'exécution recommandé

1. **Tasks 1-6 d'abord** (code) — fait en 1 session, ~3-4h, déployé immédiatement
2. **Task 7** (investigation GSC) — 30 min, dépend du déploiement
3. **Task 8** (demandes indexation) — 1h, après que les changements code soient en prod depuis 24-48h (pour que Google voit les améliorations)
4. **Task 9** (backlinks) — étalé sur 4-12 semaines

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-27-seo-indexation-fixes.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
