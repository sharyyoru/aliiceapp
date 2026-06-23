"use client";

import { useEffect, useRef } from "react";

type DotMatrixProps = {
  /** Spacing between dots in px */
  gap?: number;
  /** Base dot radius in px */
  dotRadius?: number;
  /** Animation speed multiplier */
  speed?: number;
  className?: string;
};

/**
 * Lightweight, dependency-free animated dot-matrix "shader" rendered on a
 * 2D canvas. Recreates the Aceternity shaders look: a grid of dots with a
 * travelling wave of color/opacity, plus a soft pointer-follow highlight.
 *
 * Tuned for a light background — base dots are light gray and animate toward
 * an indigo/sky highlight.
 */
export default function DotMatrix({
  gap = 24,
  dotRadius = 1.2,
  speed = 1,
  className = "",
}: DotMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: -9999, y: -9999, active: false });
  const frame = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    // Highlight color components (indigo -> sky blend)
    const baseColor = { r: 209, g: 213, b: 219 }; // slate-300
    const hiColor = { r: 79, g: 70, b: 229 }; // indigo-600

    const start = performance.now();

    const render = (now: number) => {
      const t = ((now - start) / 1000) * speed;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / gap) + 1;
      const rows = Math.ceil(height / gap) + 1;

      // Wave direction (diagonal), travels across the grid
      const wavelength = 7; // in cells
      const k = (Math.PI * 2) / wavelength;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * gap;
          const y = j * gap;

          // Travelling diagonal wave -> 0..1 intensity
          const phase = (i + j) * k - t * 1.6;
          let intensity = (Math.sin(phase) + 1) / 2;
          // Sharpen the wave crest so highlights feel like ripples
          intensity = Math.pow(intensity, 2.4);

          // Pointer proximity boost (soft radial highlight)
          if (pointer.current.active) {
            const dx = x - pointer.current.x;
            const dy = y - pointer.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const radius = 160;
            if (dist < radius) {
              const boost = 1 - dist / radius;
              intensity = Math.min(1, intensity + boost * boost * 0.9);
            }
          }

          if (prefersReduced) intensity = 0;

          const r = Math.round(baseColor.r + (hiColor.r - baseColor.r) * intensity);
          const g = Math.round(baseColor.g + (hiColor.g - baseColor.g) * intensity);
          const b = Math.round(baseColor.b + (hiColor.b - baseColor.b) * intensity);
          const alpha = 0.35 + intensity * 0.55;
          const radius = dotRadius + intensity * 1.3;

          ctx.beginPath();
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frame.current = requestAnimationFrame(render);
    };

    frame.current = requestAnimationFrame(render);

    const handleMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.current.x = e.clientX - rect.left;
      pointer.current.y = e.clientY - rect.top;
      pointer.current.active = true;
    };
    const handleLeave = () => {
      pointer.current.active = false;
    };

    const parent = canvas.parentElement;
    parent?.addEventListener("pointermove", handleMove);
    parent?.addEventListener("pointerleave", handleLeave);

    return () => {
      cancelAnimationFrame(frame.current);
      ro.disconnect();
      parent?.removeEventListener("pointermove", handleMove);
      parent?.removeEventListener("pointerleave", handleLeave);
    };
  }, [gap, dotRadius, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
