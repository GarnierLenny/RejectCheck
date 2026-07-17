#!/usr/bin/env python3
"""
Tier-1 archetype calibration (offline, one-off).

Reads the Kaggle Resume Dataset (livecareer scrape, CC0), computes the SAME
structural axes as web/app/lib/cv-checks.ts for every resume, aggregates them
into per-role-family bands (p25 / median / p75), and emits role-archetypes.json.

We keep ONLY the aggregate numbers. The raw resumes are never stored, shipped,
or displayed — this is calibration, not a corpus we redistribute.

Metric definitions mirror cv-checks.ts. When we wire Tier 1 into the app, the
runtime value is computed by cv-checks.ts and compared against these bands.
"""

import csv
import json
import re
import statistics
import sys
from collections import defaultdict

CSV_PATH = "../resumes/Resume/Resume.csv"
OUT_PATH = "role-archetypes.json"

# Mirror of ACTION_VERBS in web/app/lib/cv-checks.ts — keep in sync.
ACTION_VERBS = set("""
led lead managed manage directed direct owned own oversaw oversee supervised supervise
headed head chaired coordinated coordinate spearheaded spearhead orchestrated championed
drove drive ran run founded found built build created create developed develop designed
design engineered engineer architected implemented implement shipped ship launched launch
deployed deploy delivered deliver produced produce authored wrote write published publish
rebuilt redesigned revamped prototyped programmed improved improve increased increase grew
grow scaled scale expanded expand boosted boost accelerated accelerate optimized optimised
optimize streamlined streamline automated automate reduced reduce cut saved save lowered
minimized minimised maximized maximised transformed transform restructured consolidated
standardized standardised migrated migrate integrated integrate modernized modernised
achieved achieve generated generate exceeded exceed surpassed won win closed close
negotiated negotiate secured secure sold sell acquired mentored mentor trained train
coached coach hired hire recruited recruit facilitated facilitate presented present
collaborated collaborate partnered partner advised advise consulted consult guided guide
analyzed analysed analyze evaluated evaluate researched research assessed assess measured
measure tracked track forecasted forecast budgeted budget planned plan executed execute
established establish initiated initiate pioneered pioneer resolved resolve tested test
maintained maintain configured configure administered administer processed organized
organised géré gérer dirigé diriger développé développer créé créer conçu concevoir lancé
lancer déployé déployer livré livrer mené mener piloté piloter réalisé réaliser augmenté
augmenter réduit réduire amélioré améliorer optimisé optimiser automatisé automatiser
coordonné coordonner organisé organiser négocié négocier formé former encadré encadrer
supervisé superviser analysé analyser généré générer rédigé rédiger fondé fonder
restructuré accéléré présenté présenter
""".split())

# Dataset's 24 categories -> our role families (superset of the prompt/lexicon
# families; broader on purpose so every category lands somewhere sensible).
CATEGORY_TO_FAMILY = {
    "INFORMATION-TECHNOLOGY": "software",
    "ENGINEERING": "engineering",
    "FINANCE": "finance", "BANKING": "finance", "ACCOUNTANT": "finance",
    "SALES": "sales", "BUSINESS-DEVELOPMENT": "sales",
    "HEALTHCARE": "healthcare", "FITNESS": "healthcare",
    "HR": "hr",
    "DESIGNER": "design", "ARTS": "design", "APPAREL": "design",
    "DIGITAL-MEDIA": "marketing", "PUBLIC-RELATIONS": "marketing",
    "CONSULTANT": "consulting",
    "TEACHER": "education",
    "ADVOCATE": "legal",
    "CONSTRUCTION": "trades", "AUTOMOBILE": "trades", "AGRICULTURE": "trades",
    "AVIATION": "operations", "CHEF": "hospitality", "BPO": "operations",
}

NUM_TOKEN = re.compile(r"\d[\d.,]*%?")
TAG = re.compile(r"<[^>]+>")


def words(s):
    return [w for w in s.strip().split() if w]


def strip_tags(html):
    return re.sub(r"\s+", " ", TAG.sub(" ", html)).strip()


def extract_bullets(html):
    """Real bullets from the HTML structure: <li> items, plus <p> blocks and
    <br>-separated lines. Resume_str is flattened (no newlines), so the HTML is
    the only reliable source of line structure."""
    raw = []
    raw += re.findall(r"<li[^>]*>(.*?)</li>", html, re.S)
    raw += re.findall(r"<p[^>]*>(.*?)</p>", html, re.S)
    for block in re.split(r"<br\s*/?>", html):
        raw.append(block)
    out = []
    for chunk in raw:
        line = strip_tags(chunk)
        w = words(line)
        if 3 <= len(w) <= 40:
            out.append(line)
    return out


def metrics(html, text):
    plain = text or strip_tags(html)
    all_words = words(plain)
    wc = len(all_words) or 1
    bullets = extract_bullets(html or "")
    bc = len(bullets) or 1

    quantified = sum(1 for b in bullets if re.search(r"\d", b))
    action = 0
    for b in bullets:
        first = re.sub(r"[^a-z]", "", (words(b)[0] if words(b) else "").lower())
        if first in ACTION_VERBS:
            action += 1
    num_tokens = len(NUM_TOKEN.findall(plain))
    avg_bullet = statistics.mean(len(words(b)) for b in bullets) if bullets else 0

    return {
        "quantified_bullet_pct": round(100 * quantified / bc, 1),
        "action_verb_pct": round(100 * action / bc, 1),
        "metric_density": round(100 * num_tokens / wc, 2),  # numbers per 100 words
        "avg_bullet_len": round(avg_bullet, 1),
        "word_count": len(all_words),
        "_bullets": len(bullets),
    }


def band(values):
    vs = sorted(values)
    if not vs:
        return None
    q = statistics.quantiles(vs, n=4) if len(vs) >= 4 else [vs[0], statistics.median(vs), vs[-1]]
    return {"p25": round(q[0], 1), "median": round(statistics.median(vs), 1), "p75": round(q[2], 1)}


def main():
    csv.field_size_limit(sys.maxsize)
    by_family = defaultdict(lambda: defaultdict(list))
    counts = defaultdict(int)

    with open(CSV_PATH, newline="", encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            fam = CATEGORY_TO_FAMILY.get(row.get("Category", ""), "other")
            m = metrics(row.get("Resume_html", ""), row.get("Resume_str", ""))
            counts[fam] += 1
            for k, v in m.items():
                by_family[fam][k].append(v)

    AXES = ["quantified_bullet_pct", "action_verb_pct", "metric_density", "avg_bullet_len", "word_count"]
    archetypes = {}
    for fam in sorted(by_family):
        archetypes[fam] = {
            "n": counts[fam],
            "avg_bullets_detected": round(statistics.mean(by_family[fam]["_bullets"]), 1),
            "axes": {ax: band(by_family[fam][ax]) for ax in AXES},
        }

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump({"source": "kaggle/snehaanbhawal/resume-dataset (CC0, livecareer)",
                   "note": "aggregate structural bands only; typical not outcome-labeled",
                   "families": archetypes}, f, indent=2)

    # Human-readable summary.
    print(f"{'family':13} {'n':>4} {'bul':>4}  {'quant%':>16} {'action%':>16} {'metric/100w':>16} {'bulletLen':>14}")
    for fam, d in archetypes.items():
        a = d["axes"]
        def fmt(x):
            return f"{x['p25']}-{x['median']}-{x['p75']}" if x else "-"
        print(f"{fam:13} {d['n']:>4} {d['avg_bullets_detected']:>4}  "
              f"{fmt(a['quantified_bullet_pct']):>16} {fmt(a['action_verb_pct']):>16} "
              f"{fmt(a['metric_density']):>16} {fmt(a['avg_bullet_len']):>14}")
    print(f"\nWrote {OUT_PATH} (p25-median-p75 per axis)")


if __name__ == "__main__":
    main()
