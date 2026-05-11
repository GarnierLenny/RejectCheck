# Portfolio Analysis & Profile Digest — Strategic Plan

**Goal:** Ajouter l'analyse du portfolio comme nouvelle source d'input à l'analyse, et introduire un `ProfileDigest` réutilisable qui réduit coût + latence des analyses existantes et rend possible une feature de détection de mismatchs cross-profil.

**Statut :** Plan stratégique validé le 2026-05-10. À découper en plans d'implémentation concrets étape par étape.

---

## Pourquoi maintenant

Trois problèmes/opportunités convergent :

1. **Pivot positionnement** : RejectCheck cible désormais tous les rôles, pas seulement les devs. Pour designers/PMs/marketers, le portfolio est l'équivalent de GitHub — un signal de travail réel qu'aucune autre source ne capture.
2. **Latence trop longue** : 3-4 minutes par analyse, problème UX.
3. **Coût qui scale mal** : chaque analyse re-paie le traitement complet de sources stables (CV, LinkedIn, GitHub) qui ne changent pas entre deux jobs.

Le ProfileDigest répond aux 3 à la fois.

---

## Architecture cible

### `ProfileDigest`

Un objet structuré généré **une fois par utilisateur**, invalidé quand une source change. Stocké en base, lié au profil.

**Sources fusionnées** : CV (hashé pour invalidation), LinkedIn, GitHub, portfolio.

**Contenu** :
- Work history complète + dates (verbatim, pas résumée)
- Tech stack exhaustif (verbatim)
- Projets fusionnés (CV + portfolio + GitHub) avec rôle revendiqué, dates, outcomes, liens
- Signaux qualitatifs (positionnement, ton, niveau de polish)
- Pré-calculé : `cross_profile_inconsistencies[]` (titres divergents, dates qui ne matchent pas, ownership claims solo vs équipe, tech stack revendu vs visible)

**Format** : JSON structuré, ~2–3k tokens. Sections verbatim pour les faits, sections synthétisées pour les signaux qualitatifs.

**Génération** : appel Haiku 4.5 vision-capable (~$0.03–0.08 par génération).

**Invalidation** :
- Hash du PDF CV change → regénération
- Portfolio TTL 30 jours
- LinkedIn re-uploadé → regénération
- Bouton "Refresh my profile" manuel pour GitHub et resync explicite

### Flow d'analyse réécrit

Au lieu de `JD + raw CV + raw LinkedIn + raw GitHub + portfolio scout output → main analyzer`, on a :

`JD + ProfileDigest + motivation letter → main analyzer`

Le digest remplace 3 sources brutes par 1 synthèse structurée. Prompt principal passe de ~15k à ~6k tokens en input.

---

## Feature : Cross-profile consistency check

**Différenciateur principal du produit.** Aucun concurrent ne le fait, et il devient gratuit une fois le digest en place.

Output user-facing dédié : un bloc "Consistency check" dans le résultat d'analyse listant les divergences entre CV / LinkedIn / GitHub / portfolio. C'est ce qu'un recruteur voit en 30s, l'utilisateur veut le savoir avant.

À traiter comme une feature à part entière (UX dédiée, pas un sous-produit technique).

---

## Économie attendue

Pour un user Shortlisted faisant ~10 analyses/mois avec portfolio :

| Configuration | Coût mensuel par user |
|---|---|
| Aujourd'hui (sans portfolio) | ~$0.50 |
| Aujourd'hui + portfolio per-analysis | ~$0.95 |
| **Avec ProfileDigest + portfolio** | **~$0.38** |

Économie : **~60% vs ajout naïf**, et même moins cher qu'aujourd'hui sans portfolio.

À 1000 utilisateurs actifs : ~$600/mois économisés. À 10k : ~$6k/mois.

---

## Latence attendue

Aujourd'hui : 180–240s. Bottleneck identifié : génération Sonnet avec `max_tokens: 16000` (output verbeux).

| Configuration | Temps total | Temps perçu (1ʳᵉ section visible) |
|---|---|---|
| Aujourd'hui | 180–240s | 180–240s |
| + max_tokens=8000 + prompt resserré | 100–150s | <30s si streaming bien fait |
| + ProfileDigest | 80–110s | <20s |
| + sous-appels parallèles (si nécessaire) | 45–70s | <15s |

---

## Gating produit

| Plan | Portfolio | ProfileDigest |
|---|---|---|
| Anonyme | non | non |
| Free / Connected | 2 analyses avec portfolio / mois | oui |
| Shortlisted | illimité | oui |
| Hired | illimité + scout en Sonnet pour scoring plus fin | oui |

Raison : le portfolio est le hook qui rend l'analyse pertinente pour les non-devs. Le mettre full-premium dégrade le funnel d'acquisition pour les personas qu'on veut séduire.

---

## Roadmap ordonnée

**Étape 1 — Mesure (prérequis)**
Logger TTFT, durée de génération, output tokens réels par section/sous-appel. Aucune optimisation sans données.

**Étape 2 — Quick wins de latence**
- `max_tokens: 16000 → 8000` sur l'appel principal
- Audit du prompt : demander explicitement la concision
- Vérifier que le frontend rend les sections au fur et à mesure (`analysis_delta`)
- Confirmer que la negotiation ne bloque pas l'UI

**Étape 3 — ProfileDigest (chantier fondateur)**
- Schéma `ProfileDigest`
- Stockage + invalidation par hash
- Génération via Haiku vision
- Refactor du flow d'analyse pour consommer le digest
- UX onboarding : digest généré pendant la création de compte
- Bouton "Refresh my profile" + statut visible ("last updated X days ago")

**Étape 4 — Portfolio analysis**
Plug-in dans le pipeline du digest. Choix du scraper (Jina Reader / Firecrawl / Playwright) à arbitrer à ce moment-là. SSRF validation côté backend.

**Étape 5 — Cross-profile consistency check**
Output user-facing dédié, calculé à la génération du digest. Design UX à faire à ce moment-là.

**Étape 6 — Parallélisation sub-calls (si nécessaire)**
Refactor sérieux du provider Claude. À ne lancer **que si** les étapes 1–4 ne descendent pas la latence sous ~75s.

---

## Risques & points d'attention

- **Compression lossy du CV** : un digest trop résumé peut perdre des micro-signaux niche. Mitigation : sections verbatim (timeline, tech stack) + sections synthétisées (signaux qualitatifs).
- **CV parfois tweaké par job** : indexer le digest par hash du PDF CV. Nouveau hash = nouveau digest.
- **Invalidation = bug magnet** : un digest stale produit une analyse mensongère. Hashes + TTL + bouton refresh visibles, à designer avec soin.
- **SSRF sur portfolio URL** : HTTPS only, bloquer IPs privées/localhost, max 2-3 redirects.
- **Premier run cold-start** : générer le digest à l'onboarding, pas pendant la première analyse, pour ne pas dégrader la perception.
- **Anonymes ne bénéficient pas du digest** : aligné avec la monétisation, mais à valider explicitement.

---

## Décisions à figer plus tard

- Choix du scraper (Jina Reader vs Firecrawl vs Playwright self-hosted) — étape 4
- Modèle scout : Haiku partout, ou Sonnet pour les Hired
- Format exact des sections "verbatim" du digest
- UX exacte du bouton refresh et de l'affichage de fraîcheur
- Quotas exacts par plan pour le portfolio
