import { useMemo } from "react";

/* Diagram coordinate space. HTML nodes are positioned with the % values and
   the SVG overlays use the same units with preserveAspectRatio="none", so
   lines follow the nodes on any container size. */
export const VIEW_W = 1000;
export const VIEW_H = 620;

const CENTER_X = VIEW_W / 2;
const CENTER_Y = VIEW_H / 2;
const RADIUS_X = 340;
const RADIUS_Y = 236;

export type SourceKey = "cv" | "linkedin" | "github" | "portfolio" | "cover";

/** Degrees clockwise from 12 o'clock. */
const SOURCE_ANGLES: Record<SourceKey, number> = {
  cv: 324,
  linkedin: 36,
  github: 108,
  portfolio: 180,
  cover: 252,
};

export type DiagramPoint = { x: number; y: number; leftPct: number; topPct: number };

const toPoint = (x: number, y: number): DiagramPoint => ({
  x,
  y,
  leftPct: (x / VIEW_W) * 100,
  topPct: (y / VIEW_H) * 100,
});

export type ArcGeometry = {
  a: DiagramPoint;
  c: { x: number; y: number };
  b: DiagramPoint;
  path: string;
  labelPoint: DiagramPoint;
};

/** Point on the quadratic bezier at parameter t. */
export const arcPointAt = (g: ArcGeometry, t: number) => {
  const q = 1 - t;
  return {
    x: q * q * g.a.x + 2 * q * t * g.c.x + t * t * g.b.x,
    y: q * q * g.a.y + 2 * q * t * g.c.y + t * t * g.b.y,
  };
};

const lerp = (p: { x: number; y: number }, q: { x: number; y: number }, t: number) => ({
  x: p.x + (q.x - p.x) * t,
  y: p.y + (q.y - p.y) * t,
});

/** Polyline approximation; good enough to size the label gap. */
const arcLength = (g: ArcGeometry) => {
  let len = 0;
  let prev = arcPointAt(g, 0);
  for (let i = 1; i <= 24; i++) {
    const pt = arcPointAt(g, i / 24);
    len += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  return len;
};

/* A label pill is only ~86% opaque while it fades in (and 55% once dimmed),
   so a line running behind it strikes through the text. Instead of stacking,
   we remove the line there: each contradiction is drawn as two half-curves
   that stop short of the label, each running from its source node inward, so
   the two sources visibly converge on the contradiction. */
export function arcSegments(g: ArcGeometry, label: string) {
  /* Pill width in viewBox units (the box is ~1000x620 over ~1060x520 px, so
     one unit ≈ one px); mirrors the 10px uppercase tracked type in the pill. */
  const labelWidth = label.length * 6.3 + 26;
  const gapHalf = Math.min(0.42, Math.max(0.06, (labelWidth / 2 + 14) / arcLength(g)));
  const t1 = 0.5 - gapHalf;
  const t2 = 0.5 + gapHalf;

  // de Casteljau: sub-curve [0, t1] and sub-curve [t2, 1].
  const A1 = lerp(g.a, g.c, t1);
  const M1 = lerp(A1, lerp(g.c, g.b, t1), t1);
  const B2 = lerp(g.c, g.b, t2);
  const M2 = lerp(lerp(g.a, g.c, t2), B2, t2);

  return {
    // Both halves start at a source node so pathLength draws them inward.
    fromA: `M ${g.a.x} ${g.a.y} Q ${A1.x} ${A1.y} ${M1.x} ${M1.y}`,
    fromB: `M ${g.b.x} ${g.b.y} Q ${B2.x} ${B2.y} ${M2.x} ${M2.y}`,
  };
}

export type DiagramLayout = {
  center: DiagramPoint;
  nodes: Record<SourceKey, DiagramPoint>;
  spokePath: (key: SourceKey) => string;
  arc: (from: SourceKey, to: SourceKey, bow: number) => ArcGeometry;
};

export function useDiagramLayout(): DiagramLayout {
  return useMemo(() => {
    const nodes = Object.fromEntries(
      (Object.keys(SOURCE_ANGLES) as SourceKey[]).map((key) => {
        const rad = (SOURCE_ANGLES[key] * Math.PI) / 180;
        return [
          key,
          toPoint(CENTER_X + RADIUS_X * Math.sin(rad), CENTER_Y - RADIUS_Y * Math.cos(rad)),
        ];
      }),
    ) as Record<SourceKey, DiagramPoint>;

    const spokePath = (key: SourceKey) =>
      `M ${nodes[key].x} ${nodes[key].y} L ${CENTER_X} ${CENTER_Y}`;

    /* Quadratic bezier bowed away from the center so the line clears the
       engine node; the label pill sits on the curve at t = 0.5. */
    const arc = (from: SourceKey, to: SourceKey, bow: number): ArcGeometry => {
      const a = nodes[from];
      const b = nodes[to];
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const dirX = midX - CENTER_X;
      const dirY = midY - CENTER_Y;
      const len = Math.hypot(dirX, dirY) || 1;
      const c = { x: midX + (dirX / len) * bow, y: midY + (dirY / len) * bow };
      const mid = { x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y };
      return {
        a,
        c,
        b,
        path: `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`,
        labelPoint: toPoint(mid.x, mid.y),
      };
    };

    return { center: toPoint(CENTER_X, CENTER_Y), nodes, spokePath, arc };
  }, []);
}

/* Every source pair gets cross-examined. The 3 contradiction pairs live in
   MISMATCHES (SourceNode.tsx); these are the 7 remaining "checked" pairs,
   drawn as a faint verification mesh during phase 2. Bows: 46 for
   ring-adjacent pairs, 112 for pairs that would otherwise graze the engine. */
export const MESH_PAIRS: Array<{ from: SourceKey; to: SourceKey; bow: number }> = [
  { from: "linkedin", to: "github", bow: 46 },
  { from: "github", to: "portfolio", bow: 46 },
  { from: "portfolio", to: "cover", bow: 46 },
  { from: "cover", to: "cv", bow: 46 },
  { from: "linkedin", to: "portfolio", bow: 112 },
  { from: "cv", to: "portfolio", bow: 112 },
  { from: "cover", to: "linkedin", bow: 112 },
];

/* ─── Scroll choreography (progress 0..1 across the 300vh container) ─────
   Phase 2 owns the largest share on purpose: it is the message. The mesh
   sweep ("we compare every pair") runs first, then the three red lines draw
   ONE AT A TIME with dead space between so each registers. */
export const TIMELINE = {
  nodeAppear: (i: number): [number, number] => [0.03 + i * 0.032, 0.1 + i * 0.032],
  /* Each source is scored once it has been read, between phase 1 and 2: the
     last plate settles at 0.333, just before the mesh starts drawing. */
  scoreIn: (i: number): [number, number] => [0.225 + i * 0.012, 0.285 + i * 0.012],
  spokeDraw: (i: number): [number, number] => [0.1 + i * 0.028, 0.22 + i * 0.028],
  dotsWindow: [0.1, 0.14, 0.33, 0.4] as const,
  spokeFade: [0.33, 0.385] as const,
  meshDraw: (i: number): [number, number] => [0.335 + i * 0.008, 0.385 + i * 0.008],
  meshSettle: [0.45, 0.5] as const,
  meshTalk: [0.36, 0.42, 0.65, 0.7] as const,
  mismatchDraw: [
    [0.42, 0.5],
    [0.515, 0.585],
    [0.6, 0.665],
  ] as Array<[number, number]>,
  /* The engine is the detector: each finding is preceded by a ring sweeping
     out from the logo, and the edge snaps in as the ring passes over it. Each
     window opens ~0.05 before its mismatchDraw so cause reads before effect. */
  scan: [
    [0.37, 0.475],
    [0.465, 0.56],
    [0.55, 0.645],
  ] as Array<[number, number]>,
  flashFor: (drawStart: number): [number, number] => [drawStart, drawStart + 0.042],
  labelFor: ([s, e]: [number, number]): [number, number] => [s + (e - s) * 0.62, e + 0.01],
  highlightFor: (drawStart: number): number => drawStart + 0.02,
  /* Phase 3 — the sources report back to the engine. The red findings recede,
     blue spokes redraw inward one after another, and the green spark blooms
     behind the engine as the last one lands. */
  dim: [0.7, 0.78] as const,
  dimmedOpacity: 0.45,
  reportDraw: (i: number): [number, number] => [0.74 + i * 0.03, 0.83 + i * 0.03],
  reportFlow: [0.78, 0.84, 0.98, 1] as const,
  spark: [0.83, 0.95] as const,
  emit: [0.86, 0.92, 0.98] as const,
  steps: {
    oneOut: [0.3, 0.355] as const,
    two: [0.355, 0.385, 0.66, 0.71] as const,
    threeIn: [0.71, 0.75] as const,
  },
};
