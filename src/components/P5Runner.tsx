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
        
        // Mouse button constants
        let LEFT = 'left';
        let RIGHT = 'right';
        
        // Renderer constants
        let P2D = 'p2d';
        
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
          // Don't actually call p.background() here as it's handled by the host
        };
        
        // Drawing functions - will be rerouted to p5 instance in setup/draw
        let fill, stroke, noFill, noStroke, strokeWeight, strokeCap, strokeJoin;
        let colorMode, rectMode, ellipseMode, imageMode;
        
        // Canvas dimensions - will be updated in setup
        let width = 100;
        let height = 100;
        
        // Common center coordinates - will be updated when canvas dimensions change
        let centerX = 50;
        let centerY = 50;
        
        // Color function - creates p5.Color objects
        let color = (...args) => {
          // Simple color creation - p5.js will handle this properly when the sketch runs
          if (args.length === 1) {
            return args[0]; // grayscale
          } else if (args.length === 3) {
            return 'rgb(' + args[0] + ', ' + args[1] + ', ' + args[2] + ')';
          } else if (args.length === 4) {
            return 'rgba(' + args[0] + ', ' + args[1] + ', ' + args[2] + ', ' + (args[3] / 255) + ')';
          }
          return args[0] || '#000000';
        };
        
        // Random function
        let random = (...args) => {
          if (args.length === 0) {
            return Math.random();
          } else if (args.length === 1) {
            return Math.random() * args[0];
          } else if (args.length === 2) {
            return Math.random() * (args[1] - args[0]) + args[0];
          }
          return Math.random();
        };
        
        // Noise function (simplified)
        let noise = (x, y = 0, z = 0) => {
          // Simple noise approximation
          return Math.abs(Math.sin(x * 12.9898 + y * 78.233 + z * 37.719)) * 0.5 + 0.5;
        };
        
        // Frame count - will be updated by p5
        let frameCount = 0;
        
        // Mouse position - will be updated by p5
        let mouseX = 0;
        let mouseY = 0;
        let pmouseX = 0;
        let pmouseY = 0;
        
        // Shape functions - will be rerouted to p5 instance in setup/draw
        let point, line, rect, square, circle, ellipse, arc, triangle, quad;
        let beginShape, endShape, vertex, curveVertex, bezierVertex, quadraticVertex;
        
        // Transformation functions - will be rerouted to p5 instance in setup/draw
        let translate, rotate, rotateX, rotateY, rotateZ, scale, shearX, shearY;
        let push, pop;
        
        // Additional p5.js utility functions commonly used in physics
        let createVector = (x = 0, y = 0, z = 0) => ({ x, y, z });
        let noiseSeed = (seed) => { /* p5.js will handle this */ };
        let randomSeed = (seed) => { /* p5.js will handle this */ };
        let millis = () => Date.now();
        let second = () => new Date().getSeconds();
        let minute = () => new Date().getMinutes();
        let hour = () => new Date().getHours();
        let day = () => new Date().getDate();
        let month = () => new Date().getMonth() + 1;
        let year = () => new Date().getFullYear();
        
        // Text functions - will be rerouted to p5 instance in setup/draw
        let text, textAlign, textFont, textSize, textStyle, textWidth, textAscent, textDescent;
        
        // Loop control - will be rerouted to p5 instance in setup/draw
        let loop, noLoop, redraw;
        
        // Canvas functions - will be rerouted to p5 instance in setup/draw
        let createCanvas, resizeCanvas, pixelDensity, displayDensity;
        
        // Angle mode - will be rerouted to p5 instance in setup/draw
        let angleMode;
        
        // Setup function with access to shared scope
        setupFn = function(p, state, ctx) {
          // Update canvas dimensions
          width = ctx.width;
          height = ctx.height;
          centerX = width / 2;
          centerY = height / 2;
          
          // Add p5.js constants as properties on the p5 instance for compatibility
          // This supports both TWO_PI and p.TWO_PI usage patterns
          p.PI = PI;
          p.TWO_PI = TWO_PI;
          p.HALF_PI = HALF_PI;
          p.QUARTER_PI = QUARTER_PI;
          p.TAU = TAU;
          p.CENTER = CENTER;
          p.CORNER = CORNER;
          p.CORNERS = CORNERS;
          p.RADIUS = RADIUS;
          p.RGB = RGB;
          p.HSB = HSB;
          p.HSL = HSL;
          p.DEGREES = DEGREES;
          p.RADIANS = RADIANS;
          p.BLEND = BLEND;
          p.ADD = ADD;
          p.DARKEST = DARKEST;
          p.LIGHTEST = LIGHTEST;
          p.DIFFERENCE = DIFFERENCE;
          p.EXCLUSION = EXCLUSION;
          p.MULTIPLY = MULTIPLY;
          p.SCREEN = SCREEN;
          p.REPLACE = REPLACE;
          p.OVERLAY = OVERLAY;
          p.HARD_LIGHT = HARD_LIGHT;
          p.SOFT_LIGHT = SOFT_LIGHT;
          p.DODGE = DODGE;
          p.BURN = BURN;
          p.LEFT = LEFT;
          p.RIGHT = RIGHT;
          p.P2D = P2D;
          
          // Reroute drawing functions to p5 instance
          fill = (...args) => p.fill(...args);
          stroke = (...args) => p.stroke(...args);
          noFill = () => p.noFill();
          noStroke = () => p.noStroke();
          strokeWeight = (weight) => p.strokeWeight(weight);
          strokeCap = (cap) => p.strokeCap(cap);
          strokeJoin = (join) => p.strokeJoin(join);
          colorMode = (...args) => p.colorMode(...args);
          rectMode = (mode) => p.rectMode(mode);
          ellipseMode = (mode) => p.ellipseMode(mode);
          imageMode = (mode) => p.imageMode(mode);
          
          // Reroute shape functions to p5 instance
          point = (x, y) => p.point(x, y);
          line = (x1, y1, x2, y2) => p.line(x1, y1, x2, y2);
          rect = (x, y, w, h, tl, tr, br, bl) => p.rect(x, y, w, h, tl, tr, br, bl);
          square = (x, y, s, tl, tr, br, bl) => p.square(x, y, s, tl, tr, br, bl);
          circle = (x, y, d) => p.circle(x, y, d);
          ellipse = (x, y, w, h) => p.ellipse(x, y, w, h);
          arc = (x, y, w, h, start, stop, mode) => p.arc(x, y, w, h, start, stop, mode);
          triangle = (x1, y1, x2, y2, x3, y3) => p.triangle(x1, y1, x2, y2, x3, y3);
          quad = (x1, y1, x2, y2, x3, y3, x4, y4) => p.quad(x1, y1, x2, y2, x3, y3, x4, y4);
          
          // Reroute shape drawing functions
          beginShape = (kind) => p.beginShape(kind);
          endShape = (mode) => p.endShape(mode);
          vertex = (x, y) => p.vertex(x, y);
          curveVertex = (x, y) => p.curveVertex(x, y);
          bezierVertex = (x2, y2, x3, y3, x4, y4) => p.bezierVertex(x2, y2, x3, y3, x4, y4);
          quadraticVertex = (cx, cy, x3, y3) => p.quadraticVertex(cx, cy, x3, y3);
          
          // Reroute transformation functions
          translate = (x, y, z) => p.translate(x, y, z);
          rotate = (angle) => p.rotate(angle);
          rotateX = (angle) => p.rotateX(angle);
          rotateY = (angle) => p.rotateY(angle);
          rotateZ = (angle) => p.rotateZ(angle);
          scale = (s, y, z) => p.scale(s, y, z);
          shearX = (angle) => p.shearX(angle);
          shearY = (angle) => p.shearY(angle);
          push = () => p.push();
          pop = () => p.pop();
          
          // Reroute text functions
          text = (str, x, y, x2, y2) => p.text(str, x, y, x2, y2);
          textAlign = (horizAlign, vertAlign) => p.textAlign(horizAlign, vertAlign);
          textFont = (font, size) => p.textFont(font, size);
          textSize = (size) => p.textSize(size);
          textStyle = (style) => p.textStyle(style);
          textWidth = (str) => p.textWidth(str);
          textAscent = () => p.textAscent();
          textDescent = () => p.textDescent();
          
          // Reroute loop control functions
          loop = () => p.loop();
          noLoop = () => p.noLoop();
          redraw = () => p.redraw();
          
          // Reroute canvas functions
          createCanvas = (w, h, renderer) => p.createCanvas(w, h, renderer);
          resizeCanvas = (w, h) => p.resizeCanvas(w, h);
          pixelDensity = (val) => p.pixelDensity(val);
          displayDensity = () => p.displayDensity();
          
          // Reroute angle mode
          angleMode = (mode) => p.angleMode(mode);
          
          ${setupBody}
        };
        
        // Draw function with access to shared scope  
        drawFn = function(p, state, ctx) {
          // Update dynamic variables
          width = ctx.width;
          height = ctx.height;
          centerX = width / 2;
          centerY = height / 2;
          frameCount = p.frameCount || 0;
          mouseX = p.mouseX || 0;
          mouseY = p.mouseY || 0;
          pmouseX = p.pmouseX || 0;
          pmouseY = p.pmouseY || 0;
          key = p.key || '';
          keyCode = p.keyCode || 0;
          keyIsPressed = p.keyIsPressed || false;
          mouseIsPressed = p.mouseIsPressed || false;
          mouseButton = p.mouseButton || LEFT;
          
          // Add p5.js constants as properties on the p5 instance for compatibility
          // This supports both TWO_PI and p.TWO_PI usage patterns
          p.PI = PI;
          p.TWO_PI = TWO_PI;
          p.HALF_PI = HALF_PI;
          p.QUARTER_PI = QUARTER_PI;
          p.TAU = TAU;
          p.CENTER = CENTER;
          p.CORNER = CORNER;
          p.CORNERS = CORNERS;
          p.RADIUS = RADIUS;
          p.RGB = RGB;
          p.HSB = HSB;
          p.HSL = HSL;
          p.DEGREES = DEGREES;
          p.RADIANS = RADIANS;
          p.BLEND = BLEND;
          p.ADD = ADD;
          p.DARKEST = DARKEST;
          p.LIGHTEST = LIGHTEST;
          p.DIFFERENCE = DIFFERENCE;
          p.EXCLUSION = EXCLUSION;
          p.MULTIPLY = MULTIPLY;
          p.SCREEN = SCREEN;
          p.REPLACE = REPLACE;
          p.OVERLAY = OVERLAY;
          p.HARD_LIGHT = HARD_LIGHT;
          p.SOFT_LIGHT = SOFT_LIGHT;
          p.DODGE = DODGE;
          p.BURN = BURN;
          p.LEFT = LEFT;
          p.RIGHT = RIGHT;
          p.P2D = P2D;
          
          // Reroute drawing functions to p5 instance (in case they're called in draw)
          fill = (...args) => p.fill(...args);
          stroke = (...args) => p.stroke(...args);
          noFill = () => p.noFill();
          noStroke = () => p.noStroke();
          strokeWeight = (weight) => p.strokeWeight(weight);
          strokeCap = (cap) => p.strokeCap(cap);
          strokeJoin = (join) => p.strokeJoin(join);
          colorMode = (...args) => p.colorMode(...args);
          rectMode = (mode) => p.rectMode(mode);
          ellipseMode = (mode) => p.ellipseMode(mode);
          imageMode = (mode) => p.imageMode(mode);
          
          // Reroute shape functions to p5 instance
          point = (x, y) => p.point(x, y);
          line = (x1, y1, x2, y2) => p.line(x1, y1, x2, y2);
          rect = (x, y, w, h, tl, tr, br, bl) => p.rect(x, y, w, h, tl, tr, br, bl);
          square = (x, y, s, tl, tr, br, bl) => p.square(x, y, s, tl, tr, br, bl);
          circle = (x, y, d) => p.circle(x, y, d);
          ellipse = (x, y, w, h) => p.ellipse(x, y, w, h);
          arc = (x, y, w, h, start, stop, mode) => p.arc(x, y, w, h, start, stop, mode);
          triangle = (x1, y1, x2, y2, x3, y3) => p.triangle(x1, y1, x2, y2, x3, y3);
          quad = (x1, y1, x2, y2, x3, y3, x4, y4) => p.quad(x1, y1, x2, y2, x3, y3, x4, y4);
          
          // Reroute shape drawing functions
          beginShape = (kind) => p.beginShape(kind);
          endShape = (mode) => p.endShape(mode);
          vertex = (x, y) => p.vertex(x, y);
          curveVertex = (x, y) => p.curveVertex(x, y);
          bezierVertex = (x2, y2, x3, y3, x4, y4) => p.bezierVertex(x2, y2, x3, y3, x4, y4);
          quadraticVertex = (cx, cy, x3, y3) => p.quadraticVertex(cx, cy, x3, y3);
          
          // Reroute transformation functions
          translate = (x, y, z) => p.translate(x, y, z);
          rotate = (angle) => p.rotate(angle);
          rotateX = (angle) => p.rotateX(angle);
          rotateY = (angle) => p.rotateY(angle);
          rotateZ = (angle) => p.rotateZ(angle);
          scale = (s, y, z) => p.scale(s, y, z);
          shearX = (angle) => p.shearX(angle);
          shearY = (angle) => p.shearY(angle);
          push = () => p.push();
          pop = () => p.pop();
          
          // Reroute text functions
          text = (str, x, y, x2, y2) => p.text(str, x, y, x2, y2);
          textAlign = (horizAlign, vertAlign) => p.textAlign(horizAlign, vertAlign);
          textFont = (font, size) => p.textFont(font, size);
          textSize = (size) => p.textSize(size);
          textStyle = (style) => p.textStyle(style);
          textWidth = (str) => p.textWidth(str);
          textAscent = () => p.textAscent();
          textDescent = () => p.textDescent();
          
          // Reroute loop control functions
          loop = () => p.loop();
          noLoop = () => p.noLoop();
          redraw = () => p.redraw();
          
          // Reroute canvas functions
          createCanvas = (w, h, renderer) => p.createCanvas(w, h, renderer);
          resizeCanvas = (w, h) => p.resizeCanvas(w, h);
          pixelDensity = (val) => p.pixelDensity(val);
          displayDensity = () => p.displayDensity();
          
          // Reroute angle mode
          angleMode = (mode) => p.angleMode(mode);
          
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


