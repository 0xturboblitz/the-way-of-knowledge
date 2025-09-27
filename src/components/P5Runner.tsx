import React, { useEffect, useRef, useState } from 'react';
import type p5 from 'p5';
import { P5SketchSpec } from '@/lib/animation';

interface P5RunnerProps {
  spec: P5SketchSpec | null;
  className?: string;
}

// Lazy import p5 only on client
let P5Ctor: typeof import('p5') | null = null;
async function ensureP5(): Promise<typeof import('p5')> {
  if (P5Ctor) return P5Ctor as unknown as typeof import('p5');
  const mod = await import('p5');
  P5Ctor = (mod.default || mod) as unknown as typeof import('p5');
  return P5Ctor as unknown as typeof import('p5');
}

export const P5Runner: React.FC<P5RunnerProps> = ({ spec, className }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const p5Ref = useRef<p5 | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!spec) {
      // Cleanup any previous instance
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
      return;
    }

    (async () => {
      const P5 = await ensureP5();
      if (cancelled) return;

      // Cleanup any previous instance
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }

      const hostCtx = {
        width: 10,
        height: 10,
      } as { width: number; height: number };

      const state: Record<string, any> = {};

      const setupBody = spec.sketch.setup || '';
      const drawBody = spec.sketch.draw || '';

      const setupFn = new Function('p', 'state', 'ctx', setupBody) as (p: p5, state: any, ctx: { width: number; height: number }) => void;
      const drawFn = new Function('p', 'state', 'ctx', drawBody) as (p: p5, state: any, ctx: { width: number; height: number }) => void;

      const sketch = (p: p5) => {
        p.setup = () => {
          const parent = containerRef.current;
          if (!parent) return;
          const rect = parent.getBoundingClientRect();
          // Keep canvas never taller than parent container
          hostCtx.width = Math.max(100, Math.floor(rect.width));
          hostCtx.height = Math.max(100, Math.floor(rect.height));
          // Create 2D canvas
          p.createCanvas(hostCtx.width, hostCtx.height);
          try {
            if (spec.sketch.pixelDensity) p.pixelDensity(spec.sketch.pixelDensity);
            if (spec.sketch.frameRate) p.frameRate(spec.sketch.frameRate);
            setupFn(p, state, hostCtx);
            if (spec.sketch.noLoop) p.noLoop();
          } catch (err) {
            // Fail safely
            // eslint-disable-next-line no-console
            console.error('p5 setup error', err);
          }
        };

        p.draw = () => {
          try {
            if (spec.sketch.background) {
              p.background(spec.sketch.background);
            }
            // Add background to state for the sketch to use
            state.background = spec.sketch.background;
            drawFn(p, state, hostCtx);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('p5 draw error', err);
            p.noLoop();
          }
        };
      };

      const instance = new P5(sketch, containerRef.current as HTMLElement);
      p5Ref.current = instance as unknown as p5;

      // Resize handling to keep centered and within container
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      resizeObserverRef.current = new ResizeObserver(() => {
        const p = p5Ref.current;
        const parent = containerRef.current;
        if (!p || !parent) return;
        const rect = parent.getBoundingClientRect();
        const newW = Math.max(100, Math.floor(rect.width));
        const newH = Math.max(100, Math.floor(rect.height));
        if (newW !== hostCtx.width || newH !== hostCtx.height) {
          hostCtx.width = newW;
          hostCtx.height = newH;
          p.resizeCanvas(newW, newH);
          if (!spec.sketch.noLoop) p.loop();
        }
      });
      resizeObserverRef.current.observe(containerRef.current as Element);
    })();

    return () => {
      cancelled = true;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
    };
  }, [spec]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        }}
      />
    </div>
  );
};


