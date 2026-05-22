"use client";
import { useEffect, useRef } from "react";

const SPACING = 28;
const BASE_R = 1;
const MAX_R = 1.5;
const INFLUENCE = 120;
const BASE_ALPHA = 0.55;
const HOVER_ALPHA = 0.9;
const BASE_RGB = [165, 160, 153] as const;
const RED_RGB  = [201,  58,  57] as const;

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

const FADE_DURATION = 500; // ms

export function DotGridCanvas({ dotColor: _dotColor }: { dotColor?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const raf = useRef(0);
  const fade = useRef(0);       // 0–1 influence multiplier
  const fadeStart = useRef(0);  // timestamp when fade-out began
  const fading = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.offsetWidth * dpr;
      canvas!.height = canvas!.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw(now = 0) {
      raf.current = 0;

      if (fading.current) {
        const elapsed = now - fadeStart.current;
        fade.current = Math.max(0, 1 - elapsed / FADE_DURATION);
        if (fade.current > 0) {
          raf.current = requestAnimationFrame(draw);
        } else {
          fading.current = false;
          mouse.current = { x: -9999, y: -9999 };
        }
      }

      const w = canvas!.offsetWidth;
      const h = canvas!.offsetHeight;
      const mx = mouse.current.x;
      const my = mouse.current.y;

      ctx.clearRect(0, 0, w, h);

      for (let x = SPACING / 2; x < w + SPACING; x += SPACING) {
        for (let y = SPACING / 2; y < h + SPACING; y += SPACING) {
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = smoothstep(Math.max(0, 1 - dist / INFLUENCE)) * fade.current;
          const r = BASE_R + (MAX_R - BASE_R) * t;
          const alpha = BASE_ALPHA + (HOVER_ALPHA - BASE_ALPHA) * t;
          const cr = lerp(BASE_RGB[0], RED_RGB[0], t * 0.6);
          const cg = lerp(BASE_RGB[1], RED_RGB[1], t * 0.6);
          const cb = lerp(BASE_RGB[2], RED_RGB[2], t * 0.6);

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
          ctx.fill();
        }
      }
    }

    function schedule() {
      if (!raf.current) raf.current = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inBounds = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      if (inBounds) {
        mouse.current = { x, y };
        fade.current = 1;
        fading.current = false;
        schedule();
      } else if (!fading.current && fade.current > 0) {
        fading.current = true;
        fadeStart.current = performance.now();
        raf.current = requestAnimationFrame(draw);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}
