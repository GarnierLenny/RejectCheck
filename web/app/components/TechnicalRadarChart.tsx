"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { AnalysisResult } from "./types";

interface Props {
  data: AnalysisResult["technical_analysis"];
}

export function TechnicalRadarChart({ data }: Props) {
  const chartData = data.skills.map((s) => ({
    subject: s.name,
    current: s.current,
    expected: s.expected,
    fullMark: 10,
  }));

  return (
    <div className="bg-rc-surface border-[0.5px] border-rc-border rounded-2xl overflow-hidden mb-8 shadow-2xl relative group">
      {/* Decorative gradient blur */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-rc-red/5 blur-[100px] pointer-events-none group-hover:bg-rc-red/10 transition-colors duration-700" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rc-amber/5 blur-[100px] pointer-events-none" />

      <div className="p-8 pb-4 border-b border-rc-border/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-rc-hint block mb-1">Module 0.5 — Technical Profile</span>
            <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text bg-gradient-to-r from-rc-text to-rc-text/70 bg-clip-text">
              Skill Gap Analysis
            </h2>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rc-red shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-rc-muted">Expected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rc-green shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-rc-muted">Current</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 items-center">
        <div className="h-[320px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              {/* Radial lines from center to extremities */}
              <PolarGrid polarRadius={[]} stroke="#333" strokeDasharray="3 3" />

              {/* Outer boundary contour */}
              <Radar
                dataKey="fullMark"
                stroke="#333"
                fill="none"
                isAnimationActive={false}
              />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#999', fontSize: 10, fontWeight: 500, fontFamily: 'monospace' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 10]} 
                tick={false} 
                axisLine={false}
              />
              
              {/* Expected Level Radar */}
              <Radar
                name="Expected"
                dataKey="expected"
                stroke="#ef4444"
                strokeWidth={1}
                fill="#ef4444"
                fillOpacity={0.05}
              />

              {/* Current Level Radar */}
              <Radar
                name="Current"
                dataKey="current"
                stroke="#22c55e"
                strokeWidth={2}
                fill="#22c55e"
                fillOpacity={0.2}
                animationDuration={1500}
                animationEasing="ease-out"
              />

              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f0f0f', 
                  border: '0.5px solid #222', 
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#fff',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
                itemStyle={{ padding: '2px 0' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="bg-rc-bg/50 border border-rc-border/50 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 2v20M2 12h20M12 2a10 10 0 0 1 10 10M12 2A10 10 0 0 0 2 12M22 12a10 10 0 0 1-10 10M2 12a10 10 0 0 0 10 10" />
              </svg>
            </div>
            
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red mb-3 font-bold">IA Recommendation</h3>
            <p className="text-[15px] text-rc-text leading-relaxed font-sans italic">
              &ldquo;{data.recommendation}&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {data.skills.map((s, idx) => {
              const gap = s.expected - s.current;
              const isOk = gap <= 0;
              return (
                <div key={idx} className="flex items-center justify-between text-[11px] font-mono border-b border-rc-border/30 pb-2">
                  <span className="text-rc-muted uppercase">{s.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-rc-hint">Lvl {s.current}/{s.expected}</span>
                    <span className={`px-2 py-0.5 rounded ${isOk ? 'bg-rc-green/10 text-rc-green' : 'bg-rc-red/10 text-rc-red'}`}>
                      {isOk ? '✓ AT TARGET' : `-${gap} PTS GAP`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
