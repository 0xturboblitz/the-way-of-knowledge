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

      // Create a shared execution context by wrapping both setup and draw in a single function
      // This allows variables defined in setup to be accessible in draw
      const sharedContextCode = `
        // Shared variables scope - variables declared here are accessible to both setup and draw
        let setupFn, drawFn;
        
        // p5.js constants passed as variables (can be redefined by models if needed)
        // Mathematical constants
        let PI = Math.PI;
        let TWO_PI = Math.PI * 2;
        let HALF_PI = Math.PI / 2;
        let QUARTER_PI = Math.PI / 4;
        let TAU = Math.PI * 2;
        
        // Shape mode constants
        let CORNER = 'corner';
        let CORNERS = 'corners';
        let CENTER = 'center';
        let RADIUS = 'radius';
        
        // Color mode constants
        let RGB = 'rgb';
        let HSB = 'hsb';
        let HSL = 'hsl';
        
        // Angle mode constants
        let DEGREES = 'degrees';
        let RADIANS = 'radians';
        
        // Blend mode constants
        let BLEND = 'source-over';
        let ADD = 'lighter';
        let DARKEST = 'darken';
        let LIGHTEST = 'lighten';
        let DIFFERENCE = 'difference';
        let EXCLUSION = 'exclusion';
        let MULTIPLY = 'multiply';
        let SCREEN = 'screen';
        let REPLACE = 'copy';
        let OVERLAY = 'overlay';
        let HARD_LIGHT = 'hard-light';
        let SOFT_LIGHT = 'soft-light';
        let DODGE = 'color-dodge';
        let BURN = 'color-burn';
        
        // Key constants
        let BACKSPACE = 8;
        let DELETE = 46;
        let ENTER = 13;
        let RETURN = 13;
        let TAB = 9;
        let ESCAPE = 27;
        let SHIFT = 16;
        let CONTROL = 17;
        let OPTION = 18;
        let ALT = 18;
        let UP_ARROW = 38;
        let DOWN_ARROW = 40;
        let LEFT_ARROW = 37;
        let RIGHT_ARROW = 39;
        
        // Mouse button constants
        let LEFT = 'left';
        let RIGHT = 'right';
        
        // Renderer constants
        let P2D = 'p2d';
        let WEBGL = 'webgl';
        
        // Common p5.js functions as variables (to prevent errors)
        let min = Math.min;
        let max = Math.max;
        let abs = Math.abs;
        let ceil = Math.ceil;
        let floor = Math.floor;
        let round = Math.round;
        let sqrt = Math.sqrt;
        let pow = Math.pow;
        let sin = Math.sin;
        let cos = Math.cos;
        let tan = Math.tan;
        let asin = Math.asin;
        let acos = Math.acos;
        let atan = Math.atan;
        let atan2 = Math.atan2;
        let degrees = (radians) => radians * 180 / Math.PI;
        let radians = (degrees) => degrees * Math.PI / 180;
        let map = (value, start1, stop1, start2, stop2) => start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
        let lerp = (start, stop, amt) => start + (stop - start) * amt;
        let constrain = (amt, low, high) => Math.max(Math.min(amt, high), low);
        let dist = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        let mag = (x, y) => Math.sqrt(x * x + y * y);
        let norm = (value, start, stop) => (value - start) / (stop - start);
        let sq = (x) => x * x;
        
        // Handle background() calls gracefully - models might call this despite instructions
        let background = (...args) => {
          console.warn('background() called in user code - this is handled by the host');
          // Don't actually call p.background() here as it's handled by the host
        };
        
        // Setup function with access to shared scope
        setupFn = function(p, state, ctx) {
          ${setupBody}
        };
        
        // Draw function with access to shared scope  
        drawFn = function(p, state, ctx) {
          ${drawBody}
        };
        
        return { setupFn, drawFn };
      `;
      
      const contextFactory = new Function(sharedContextCode);
      const { setupFn, drawFn } = contextFactory() as {
        setupFn: (p: p5, state: any, ctx: { width: number; height: number }) => void;
        drawFn: (p: p5, state: any, ctx: { width: number; height: number }) => void;
      };

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


