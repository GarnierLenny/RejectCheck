"use client";

import { motion, useTime, useTransform, type MotionValue } from "framer-motion";
import { CenterNode } from "./CenterNode";
import { MismatchLine } from "./MismatchLine";
import { MISMATCHES, SOURCES, SourceNode } from "./SourceNode";
import {
  MESH_PAIRS,
  TIMELINE,
  VIEW_H,
  VIEW_W,
  arcPointAt,
  useDiagramLayout,
  type ArcGeometry,
  type DiagramPoint,
  type SourceKey,
} from "./useDiagramLayout";

function Spoke({ path, index, progress }: { path: string; index: number; progress: MotionValue<number> }) {
  const draw = TIMELINE.spokeDraw(index);
  const pathLength = useTransform(progress, draw, [0, 1]);
  const opacity = useTransform(
    progress,
    [draw[0], draw[0] + 0.005, TIMELINE.spokeFade[0], TIMELINE.spokeFade[1], TIMELINE.dim[0], TIMELINE.dim[1]],
    [0, 1, 1, 0.3, 0.3, 0.15],
  );
  return (
    <motion.path
      d={path}
      fill="none"
      stroke="var(--rc-border)"
      strokeWidth={1.5}
      vectorEffect="non-scaling-stroke"
      style={{ pathLength, opacity }}
    />
  );
}

function FlowDot({
  from,
  to,
  delay,
  color = "var(--rc-hint)",
  r = 3,
}: {
  from: DiagramPoint;
  to: DiagramPoint;
  delay: number;
  color?: string;
  r?: number;
}) {
  return (
    <motion.circle
      cx={from.x}
      cy={from.y}
      r={r}
      fill={color}
      initial={{ x: 0, y: 0, opacity: 0 }}
      animate={{ x: [0, to.x - from.x], y: [0, to.y - from.y], opacity: [0, 0.9, 0.9, 0] }}
      transition={{
        duration: 1.5,
        ease: "easeIn",
        repeat: Infinity,
        repeatDelay: 0.55,
        delay,
        opacity: { duration: 1.5, times: [0, 0.15, 0.8, 1], repeat: Infinity, repeatDelay: 0.55, delay },
      }}
    />
  );
}

/* The engine's scan: a ring sweeping out from the logo, one per finding, so
   the contradictions read as detected by RejectCheck rather than discovered
   by the sources themselves. Scaled about its own centre inside a translated
   <g>, so it animates on transform alone. */
function ScanPulse({ index, center, progress }: { index: number; center: DiagramPoint; progress: MotionValue<number> }) {
  const [start, end] = TIMELINE.scan[index];
  const scale = useTransform(progress, [start, end], [0.1, 1.35]);
  const opacity = useTransform(progress, [start, start + (end - start) * 0.18, end], [0, 0.55, 0]);
  return (
    <g transform={`translate(${center.x} ${center.y})`}>
      <motion.circle
        r={300}
        fill="none"
        stroke="var(--rc-red)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        style={{ scale, opacity, willChange: "transform, opacity" }}
      />
    </g>
  );
}

/* Phase 3: each source reports its cleared result back to the engine. Drawn
   from the node inward so the motion reads as delivery, not broadcast. */
function ReportSpoke({ from, to, index, progress }: { from: DiagramPoint; to: DiagramPoint; index: number; progress: MotionValue<number> }) {
  const draw = TIMELINE.reportDraw(index);
  const pathLength = useTransform(progress, draw, [0, 1]);
  const opacity = useTransform(progress, [draw[0], draw[0] + 0.005], [0, 1]);
  return (
    <motion.path
      d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
      fill="none"
      stroke="var(--rc-blue)"
      strokeWidth={1.75}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      style={{ pathLength, opacity }}
    />
  );
}

/* Phase 2 verification mesh: one faint red arc per checked pair, so every
   node is visibly cross-examined against every other. */
function MeshLine({ geometry, index, progress }: { geometry: ArcGeometry; index: number; progress: MotionValue<number> }) {
  const draw = TIMELINE.meshDraw(index);
  const pathLength = useTransform(progress, draw, [0, 1]);
  /* Kept well under the contradiction arcs' opacity: red at the same values
     as the old grey would read far heavier and the 3 findings must stay the
     dominant marks. Thinner stroke (1 vs 2) does the rest. */
  const opacity = useTransform(
    progress,
    [draw[0], draw[0] + 0.005, TIMELINE.meshSettle[0], TIMELINE.meshSettle[1], TIMELINE.dim[0], TIMELINE.dim[1]],
    [0, 0.34, 0.34, 0.2, 0.2, 0.09],
  );
  return (
    <motion.path
      d={geometry.path}
      fill="none"
      stroke="var(--rc-red)"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      style={{ pathLength, opacity }}
    />
  );
}

/* A data dot ping-ponging along a mesh arc: the two sources "talking".
   Driven by one shared clock (see DiagramDesktop) rather than a timer each,
   and only mounted while ambient; the scroll gate fades the whole swarm in
   and out of phase 2. */
function MeshTalkDot({
  geometry,
  duration,
  phase,
  gate,
  time,
}: {
  geometry: ArcGeometry;
  duration: number;
  phase: number;
  gate: MotionValue<number>;
  time: MotionValue<number>;
}) {
  /* Triangle wave over the curve parameter: 0 → 1 → 0 = there and back. */
  const t = useTransform(time, (ms) => {
    const cycle = (ms / 1000 / duration + phase) % 1;
    return cycle < 0.5 ? cycle * 2 : (1 - cycle) * 2;
  });
  const x = useTransform(t, (v) => arcPointAt(geometry, v).x);
  const y = useTransform(t, (v) => arcPointAt(geometry, v).y);
  return <motion.circle r={2.4} fill="var(--rc-hint)" cx={0} cy={0} style={{ x, y, opacity: gate }} />;
}

type DiagramDesktopProps = {
  progress: MotionValue<number>;
  /** Time-based ambient animations (flow dots, cross-talk, engine pulse);
      parent turns this off when off-screen or reduced motion. */
  ambient: boolean;
};

export function DiagramDesktop({ progress, ambient }: DiagramDesktopProps) {
  const layout = useDiagramLayout();
  const dotsOpacity = useTransform(progress, [...TIMELINE.dotsWindow], [0, 1, 1, 0]);
  const meshTalkOpacity = useTransform(progress, [...TIMELINE.meshTalk], [0, 0.85, 0.85, 0]);
  const reportFlowOpacity = useTransform(progress, [...TIMELINE.reportFlow], [0, 1, 1, 1]);
  /* One clock for every cross-talk dot. */
  const time = useTime();

  const meshGeometries = MESH_PAIRS.map((p) => layout.arc(p.from, p.to, p.bow));

  const flashesByKey: Record<SourceKey, Array<[number, number]>> = {
    cv: [], linkedin: [], github: [], portfolio: [], cover: [],
  };
  MISMATCHES.forEach((m, i) => {
    const [drawStart] = TIMELINE.mismatchDraw[i];
    for (const key of [m.from, m.to]) {
      flashesByKey[key].push(TIMELINE.flashFor(drawStart));
    }
  });

  return (
    <div
      style={{
        position: "relative",
        width: "min(1060px, 94vw)",
        height: "min(58vh, 560px)",
        margin: "0 auto",
        flexShrink: 1,
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        aria-hidden
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", zIndex: 0 }}
      >
        {SOURCES.map((s, i) => (
          <Spoke key={s.key} path={layout.spokePath(s.key)} index={i} progress={progress} />
        ))}
        {meshGeometries.map((g, i) => (
          <MeshLine key={`mesh-${MESH_PAIRS[i].from}-${MESH_PAIRS[i].to}`} geometry={g} index={i} progress={progress} />
        ))}
        {TIMELINE.scan.map((_, i) => (
          <ScanPulse key={`scan-${i}`} index={i} center={layout.center} progress={progress} />
        ))}
        {ambient && (
          <motion.g style={{ opacity: dotsOpacity }}>
            {SOURCES.map((s, i) => (
              <FlowDot key={s.key} from={layout.nodes[s.key]} to={layout.center} delay={i * 0.35} />
            ))}
          </motion.g>
        )}
        {SOURCES.map((s, i) => (
          <ReportSpoke
            key={`report-${s.key}`}
            from={layout.nodes[s.key]}
            to={layout.center}
            index={i}
            progress={progress}
          />
        ))}
        {ambient && (
          <motion.g style={{ opacity: reportFlowOpacity }}>
            {SOURCES.map((s, i) => (
              <FlowDot
                key={`report-dot-${s.key}`}
                from={layout.nodes[s.key]}
                to={layout.center}
                delay={i * 0.22}
                color="var(--rc-blue)"
                r={3.4}
              />
            ))}
          </motion.g>
        )}
        {ambient &&
          meshGeometries.map((g, i) => (
            <MeshTalkDot
              key={`talk-${MESH_PAIRS[i].from}-${MESH_PAIRS[i].to}`}
              geometry={g}
              duration={2.2 + (i % 3) * 0.4}
              phase={i / MESH_PAIRS.length}
              gate={meshTalkOpacity}
              time={time}
            />
          ))}
      </svg>
      {MISMATCHES.map((m, i) => (
        <MismatchLine
          key={`${m.from}-${m.to}`}
          geometry={layout.arc(m.from, m.to, m.bow)}
          label={m.label}
          draw={TIMELINE.mismatchDraw[i]}
          progress={progress}
        />
      ))}
      {SOURCES.map((s, i) => (
        <SourceNode
          key={s.key}
          name={s.name}
          icon={s.icon}
          score={s.score}
          point={layout.nodes[s.key]}
          progress={progress}
          appear={TIMELINE.nodeAppear(i)}
          scoreIn={TIMELINE.scoreIn(i)}
          flashes={flashesByKey[s.key]}
        />
      ))}
      <CenterNode progress={progress} pulse={ambient} point={layout.center} />
    </div>
  );
}
