# Actions manuelles SEO — 2026-04-27

> Companion au plan code [`2026-04-27-seo-indexation-fixes.md`](./2026-04-27-seo-indexation-fixes.md). Ce fichier liste les actions qui ne peuvent pas être automatisées : investigations GSC, demandes d'indexation, et acquisition de backlinks.

## Pré-requis

- [ ] Phase 1 (commits sur `feature/seo-indexation-fixes`) **mergée dans `main` et déployée en prod sur Vercel**. Sans ça, GSC ne verra pas les améliorations.
- [ ] Attendre **24-48h après déploiement** avant les actions GSC, pour laisser Google recrawler les pages améliorées.

---

## Task 7 — Investigation de l'erreur de redirection (1 page)

### Étapes

- [ ] **Identifier l'URL en erreur**
  - Aller sur https://search.google.com/search-console
  - Sélectionner la propriété `rejectcheck.com`
  - Indexation → Pages → cliquer sur **"Erreur liée à des redirections (1)"**
  - Noter l'URL exacte ci-dessous :
    - URL : `_______________________________________________`

- [ ] **Reproduire avec curl**
  ```bash
  curl -I -L --max-redirs 10 https://rejectcheck.com/<URL_EXACTE>
  ```
  - Compter le nombre de redirections : `___`
  - Statut final : `___`
  - Cause suspectée : `_______________________________________________`

- [ ] **Tester en outil Inspection URL de GSC**
  - Inspection URL → coller l'URL → "Tester l'URL en direct"
  - Lire le rapport diagnostic
  - Si "boucle de redirection" : ouvrir un mini-fix dans le code

- [ ] **Documenter la cause** (remplir le bloc ci-dessous)

```
URL en cause :
Cause racine :
Action requise (code ou config) :
Date de correction :
```

### Causes courantes à vérifier

| Symptôme | Cause probable | Fix |
|----------|----------------|-----|
| Plus de 3 redirections en chaîne | `proxy.ts` puis `next.config.ts rewrites` qui se réenchaînent | Investiguer l'ordre middleware/rewrites |
| Boucle infinie | Cookie `NEXT_LOCALE` désynchronisé du path | Vérifier `proxy.ts` lignes 56-70 |
| Redirection vers une URL inexistante | Lien externe pointant vers une vieille structure | Ajouter une règle `redirects` dans `next.config.ts` |
| Mixed content (http/https) | Lien legacy HTTP | Vérifier que HSTS est actif (déjà OK dans `next.config.ts:11-15`) |

---

## Task 8 — Demande d'indexation manuelle (11 pages)

### Pré-requis

- [ ] Phase 1 déployée depuis ≥ 24h
- [ ] Sitemap mis à jour : https://rejectcheck.com/sitemap.xml retourne bien 18 URLs

### Étapes

- [ ] **Lister les 11 URLs**
  - GSC → Indexation → Pages → "Détectée, actuellement non indexée (11)" → Voir les URLs
  - Copier-coller la liste ci-dessous :

```
1. https://_______________________________
2. https://_______________________________
3. https://_______________________________
4. https://_______________________________
5. https://_______________________________
6. https://_______________________________
7. https://_______________________________
8. https://_______________________________
9. https://_______________________________
10. https://______________________________
11. https://______________________________
```

- [ ] **Pour chaque URL, demander l'indexation** (à étaler si quota dépassé)
  - GSC → Inspection URL → coller l'URL
  - Statut attendu : "URL inconnue de Google" ou "URL non indexée"
  - Cliquer **"Demander l'indexation"**
  - Attendre 30s à 2min
  - Confirmer "Indexation demandée"

  ⚠️ **Quota GSC** : ~10-12 demandes par jour. Si > 12, étaler sur 2 jours.

- [ ] **Renvoyer le sitemap**
  - GSC → Sitemaps → entrer `sitemap.xml` → "Envoyer"
  - Même s'il a déjà été envoyé, ça déclenche une nouvelle découverte

### Suivi (à remplir au fil de l'eau)

| Date | URLs indexées | Notes |
|------|---------------|-------|
| 2026-04-__ (J0 demandes) | __/11 | (au moment de la demande) |
| 2026-05-__ (J+7) | __/11 | |
| 2026-05-__ (J+14) | __/11 | |
| 2026-05-__ (J+30) | __/11 | |

---

## Task 9 — Acquisition de backlinks

> **Pourquoi c'est critique :** "Détectée, actuellement non indexée" persiste presque toujours à cause d'une autorité de domaine trop faible. 1-3 backlinks de qualité suffisent souvent à débloquer l'indexation entière du site.

### Haute priorité (1-2 semaines)

#### Product Hunt launch

- [ ] **Préparer l'asset kit**
  - Tagline (60 chars max) : "Find out why your CV got rejected — Dual AI diagnosis"
  - 3 screenshots (homepage, analyse en cours, résultat)
  - Demo video 30-60s (Loom ou screen recording)
  - First comment détaillé (story de fondateur, 200-300 mots)
  - Logo PNG carré 240×240
- [ ] **Choisir la date** : mardi ou mercredi à **00:01 PST** (visibilité 24h optimale)
- [ ] **Créer le draft sur producthunt.com/posts/new**
- [ ] **Maker comment** dès la mise en ligne : raconter pourquoi tu as construit RejectCheck (post-rejet, frustration, pas d'outil bilingue)
- [ ] **Promotion** : Twitter/X, LinkedIn (post personnel), Reddit r/SideProject (jamais avant le launch)
- [ ] **Engagement** : répondre à TOUS les commentaires dans les 24 premières heures
- [ ] **Goal** : top 5 du jour → 1 backlink dofollow + 200-500 visiteurs qualifiés

#### IndieHackers post

- [ ] Compte créé et 5+ commentaires utiles laissés ailleurs avant de poster (sinon = spam flag)
- [ ] **Titre suggéré** : "I built RejectCheck after my own CV got rejected 30+ times"
- [ ] **Section "Show IH"**
- [ ] Inclure 1 lien vers `/alternatives` dans le corps (transmet du jus aux pages cibles)
- [ ] Engager dans les commentaires pendant 48h
- [ ] **Bonus** : si bien reçu, demander à être interviewé sur le podcast IndieHackers

#### Reddit (post éducatif, pas spam)

- [ ] Subreddit cible (par ordre) :
  - [ ] r/jobs (1.7M, peu modéré)
  - [ ] r/cscareerquestions (1.1M, strict mais audience tech)
  - [ ] r/resumes (200k, niche pertinente)
  - [ ] r/EngineeringResumes
  - [ ] r/Recruitement (FR)
- [ ] **Titre éducatif** : "I analyzed 50 rejected CVs - here's the 3 patterns I found" (ou variante)
- [ ] **Format** : 80% valeur, 20% mention RejectCheck (en bas, non-pushy)
- [ ] **Lurker reputation** : poster des commentaires utiles dans le sub avant le post promo
- [ ] **Lien** : vers l'article ou directement vers `/alternatives` (selon les rules du sub)

### Moyenne priorité (3-6 semaines)

#### Comparison directories

- [ ] **alternativeto.net**
  - Créer une page RejectCheck listée comme alternative à Jobscan
  - Ajouter pricing, features, screenshots
  - Demander aux early users d'upvoter
- [ ] **saashub.com** — soumission gratuite
- [ ] **g2.com** — gratuit pour listing basique
- [ ] **capterra.com** — gratuit pour listing basique
- [ ] **stackshare.io** — listing tools utilisés (RejectCheck stack: Next.js, Supabase, OpenAI, Anthropic)

#### Guest posts (1-2 par mois)

- [ ] **dev.to** — article "How AI evaluates your CV - what we learned building RejectCheck"
- [ ] **Hashnode** — article technique (architecture dual-AI, prompts engineering)
- [ ] **Medium publication "The Startup"** ou **"Better Programming"** — pitch éditorial
- [ ] **Pitch direction** : 3-5 contacts par publication ; relance après 7 jours sans réponse

#### Outreach blogueurs RH/Carrière FR

- [ ] **Liste de cibles** :
  - [ ] welcometothejungle.com (blog)
  - [ ] cadremploi.fr
  - [ ] hellowork.com (blog)
  - [ ] Coachs LinkedIn FR (≥ 5k followers, posts CV/recrutement)
- [ ] **Pitch type** : "Je propose un test gratuit + droit d'éditorialiser. En échange, 1 mention dans un article récent."

### Long terme (3-6 mois)

- [ ] **Programmatic SEO**
  - 50-100 pages `/jobs/<role>/cv-template` basées sur une vraie data API (Welcome to the Jungle, Adzuna, Indeed)
  - Voir skill `programmatic-seo` (déjà installé)
- [ ] **Outil gratuit viral**
  - "ATS score checker" public, sans signup, scoring rapide
  - Optimisé pour ranking sur "ats checker free"
  - CTA implicite vers RejectCheck premium
- [ ] **Newsletter / blog éditorial**
  - 1 article/semaine sur les patterns CV qui marchent en 2026
  - Distribuer via email + LinkedIn + dev.to (cross-posting)
  - Cible : 500 abonnés en 90 jours

---

## KPIs (mesurer dans GSC)

À reporter dans un tableau toutes les 2 semaines :

| Date | Pages indexées | Impressions / 28j | Clics / 28j | Position moyenne |
|------|----------------|-------------------|-------------|------------------|
| 2026-04-27 (baseline) | 7/18 | __ | __ | __ |
| 2026-05-11 (J+14) | __/18 | __ | __ | __ |
| 2026-05-25 (J+28) | __/18 | __ | __ | __ |
| 2026-06-22 (J+56) | __/18 | __ | __ | __ |
| 2026-07-27 (J+90) | __/18 | __ | __ | __ |

### Cibles

- **30 jours :** 18/18 indexées (100%), impressions × 2
- **60 jours :** clics × 3, position moyenne sur "/alternatives/*" passe top 30 → top 20
- **90 jours :** position top 10 sur au moins 1 keyword "<vendor> alternative"

---

## Re-vérification post-fix

Une fois Phase 1 déployée + 7 jours :

- [ ] Re-tester toutes les redirections en local et en prod :
  ```bash
  curl -I https://rejectcheck.com/analyse  # doit renvoyer 301 → /fr/analyze
  curl -I https://rejectcheck.com/pricing  # doit renvoyer 307 → /en/pricing ou /fr/pricing
  curl -I https://rejectcheck.com/alternatives/jobscan  # doit renvoyer 200 directement
  ```
- [ ] GSC → Indexation → Pages → cliquer sur "Page avec redirection" et **"Valider la correction"**
- [ ] Confirmer que le nombre de pages "Détectée non indexée" baisse
