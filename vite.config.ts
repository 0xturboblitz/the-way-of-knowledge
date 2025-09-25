import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

  const claudeApiPlugin = {
    name: "dev-claude-animation-endpoint",
    apply: "serve" as const,
    configureServer(server: any) {
      server.middlewares.use("/api/animation", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method Not Allowed" }));
          return;
        }

        if (!OPENROUTER_API_KEY) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "OPENROUTER_API_KEY is not configured" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          await new Promise<void>((resolve, reject) => {
            req.on("data", (c: Buffer) => chunks.push(c));
            req.on("end", () => resolve());
            req.on("error", (err: Error) => reject(err));
          });
          const raw = Buffer.concat(chunks).toString("utf8");
          const body = raw ? JSON.parse(raw) : {};

          const { selectionText, pageContext, pageNumber } = body || {};
          if (!selectionText || !pageContext) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "selectionText and pageContext are required" }));
            return;
          }

          const system = `
You are an expert electrodynamics educator and p5.js creative coder specializing in electromagnetic field visualizations.
Create a p5 animation spec that illustrates ONLY the selected text passage, using the page context for understanding but focusing the visualization on the specific selection.
The animation must help illustrate the core electromagnetic concept in a concise, visually clear way suitable for a sidebar canvas.

You MUST return a JSON object with this exact structure:
{
  "version": "p5.v1",
  "title": "Short descriptive title",
  "concept": "One sentence describing what is being illustrated",
  "sketch": {
    "background": "#F5F4EF",
    "frameRate": 30,
    "noLoop": false,
    "pixelDensity": 1,
    "setup": "JavaScript code body for setup function",
    "draw": "JavaScript code body for draw function"
  },
  "meta": {
    "hints": ["Array of 3 short hint strings"]
  }
}

ELECTRODYNAMICS VISUALIZATION GUIDELINES:
- Electric Fields: Use flowing lines, field vectors, or particle trajectories. Show field strength with line density or color intensity.
- Magnetic Fields: Visualize with circular field lines around currents, or use 3D helical patterns for solenoids.
- Electromagnetic Waves: Show oscillating E and B fields perpendicular to each other and propagation direction.
- Charges: Represent as spheres with appropriate colors (red for positive, blue for negative). Show motion and interactions.
- Currents: Visualize as flowing particles or arrows along conductors. Use animation to show direction and magnitude.
- Gauss's Law: Show field lines emanating from charges, with density representing field strength.
- Faraday's Law: Animate changing magnetic flux and induced electric fields or currents.
- Ampère's Law: Show circular magnetic fields around current-carrying wires.
- Lorentz Force: Animate charged particle motion in crossed E and B fields.
- Capacitors: Show field lines between plates, charge distributions, and energy storage.
- Inductors: Visualize magnetic field buildup and energy storage in coils.
- Electromagnetic Induction: Show relative motion between magnets and conductors.

WEBGL AND 3D CAPABILITIES:
- The canvas runs in WEBGL mode by default, giving you access to 3D graphics
- You can use 3D primitives: p.box(), p.sphere(), p.cylinder(), p.cone(), p.torus(), p.plane()
- 3D transformations: p.translate(), p.rotate(), p.rotateX(), p.rotateY(), p.rotateZ(), p.scale()
- Camera controls: p.camera(), p.perspective(), p.ortho()
- Lighting: p.ambientLight(), p.directionalLight(), p.pointLight(), p.spotLight()
- Materials: p.ambientMaterial(), p.specularMaterial(), p.normalMaterial(), p.texture()
- Use p.push() and p.pop() to save/restore transformation matrix
- 3D coordinates: x (left-right), y (up-down), z (forward-back from screen)
- IMPORTANT: Do NOT use p.text() or any text rendering in WebGL mode as it's not supported
- Instead of text, use visual elements like shapes, colors, and animations to convey concepts

COLOR PALETTE AND VISUAL DESIGN:
- CRITICAL: The background color MUST be exactly '#F5F4EF' for consistency with the application design.
- Use a sophisticated, muted color palette that complements the warm, academic aesthetic:
  * Deep blues: #2563EB, #1E40AF, #1E3A8A (for magnetic fields, negative charges)
  * Rich reds: #DC2626, #B91C1C, #991B1B (for electric fields, positive charges)
  * Elegant greens: #059669, #047857, #065F46 (for neutral elements, conductors)
  * Warm oranges: #EA580C, #C2410C, #9A3412 (for energy, heat, resistance)
  * Deep purples: #7C3AED, #6D28D9, #5B21B6 (for electromagnetic waves, special effects)
  * Sophisticated grays: #374151, #4B5563, #6B7280 (for structural elements)
- AVOID bright, neon, or overly saturated colors that clash with the academic aesthetic
- Use subtle gradients and transparency (alpha values) for depth and layering
- Prefer darker, more saturated colors that stand out against the light background
- Use color intensity and saturation to represent field strength or energy levels
- Never use dark or black for solid objects.

ANIMATION TECHNIQUES FOR ELECTRODYNAMICS:
- Use smooth, physics-based motion with proper acceleration and velocity
- Implement realistic field line behavior (continuous, never crossing, proper density)
- Show time-varying phenomena with appropriate phase relationships
- Use particle systems for charge flows and field visualizations
- Implement proper vector field representations with directional indicators
- Show energy flow with animated streamlines or particle motion
- Use oscillatory motion for AC phenomena and wave propagation
- Implement realistic electromagnetic wave properties (frequency, wavelength, amplitude)

CONSTRAINTS AND CONTRACT:
- Focus ONLY on illustrating the selected text passage, not the entire page context
- Do NOT call p.createCanvas. The host will call p.createCanvas(ctx.width, ctx.height, p.WEBGL) automatically.
- Use only (p, state, ctx) provided by the host. p is the p5 instance with WebGL enabled.
- Use ctx.width and ctx.height to size elements so it fits parent, never exceeding page height.
- Do not import or reference external libraries. Only standard p5 APIs.
- Keep drawing performant: avoid creating new arrays/objects in draw loops unnecessarily.
- The code in setup/draw must be valid, self-contained JavaScript bodies, not wrapped in function declarations.
- IMPORTANT: All newlines in JavaScript code strings must be escaped as \\n, not actual newlines.
- Prefer 3D visualizations when they help illustrate electromagnetic concepts
- Use appropriate lighting and materials to make 3D objects clearly visible against the light background
- Make sure the animation is WELL CENTERED and fits the canvas.
- Return ONLY the JSON object, no markdown, no explanations, no code fences.
`;

          const userPrompt = `Please create an animation that illustrates the selected text: "${selectionText}"

Use the following page context to understand the broader topic, but focus your visualization specifically on the selected text concept:

Page Context: ${pageContext}
Page Number: ${pageNumber}

Remember to:
- Illustrate ONLY the concept in the selected text, not the entire page
- Use the sophisticated color palette specified in the system prompt
- Create smooth, physics-accurate animations
- Make the visualization educational and visually clear
- Ensure the animation fits well in a sidebar canvas`;

          const user = userPrompt;

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "HTTP-Referer": "http://localhost:8080",
              "X-Title": "Electro Code Canvas",
            },
            body: JSON.stringify({
              // model: "anthropic/claude-3.5-haiku",
              // model: "openai/gpt-4.1-mini",
              model: "google/gemini-2.5-flash", 
              // model: "openai/gpt-4o-mini",
              // model: "x-ai/grok-code-fast-1",
              max_tokens: 4000,
              temperature: 0.3,
              messages: [
                { role: "system", content: system },
                { role: "user", content: user }
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "p5_animation_spec",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      version: { type: "string", const: "p5.v1" },
                      title: { type: "string" },
                      concept: { type: "string" },
                      sketch: {
                        type: "object",
                        properties: {
                          background: { type: "string" },
                          frameRate: { type: "number" },
                          noLoop: { type: "boolean" },
                          pixelDensity: { type: "number" },
                          setup: { type: "string" },
                          draw: { type: "string" }
                        },
                        required: ["background", "frameRate", "noLoop", "pixelDensity", "setup", "draw"],
                        additionalProperties: false
                      },
                      meta: {
                        type: "object",
                        properties: {
                          hints: { type: "array", items: { type: "string" } }
                        },
                        required: ["hints"],
                        additionalProperties: false
                      }
                    },
                    required: ["version", "title", "concept", "sketch", "meta"],
                    additionalProperties: false
                  }
                }
              }
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "OpenRouter API error", details: errText }));
            return;
          }

          const data = await response.json() as any;
          // OpenRouter returns structured JSON directly
          let spec = data.choices?.[0]?.message?.content;
          
          if (!spec) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "No content in OpenRouter response", raw: JSON.stringify(data) }));
            return;
          }

          // If spec is a string (fallback for when structured output fails), try to parse it
          if (typeof spec === 'string') {
            try {
              // Try to extract JSON from markdown code blocks
              const jsonMatch = spec.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
              if (jsonMatch) {
                spec = JSON.parse(jsonMatch[1]);
              } else {
                // Try to parse the whole string as JSON
                spec = JSON.parse(spec);
              }
            } catch (e) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ 
                error: "Failed to parse OpenRouter response as JSON", 
                raw: spec.substring(0, 500) + "...",
                parseError: (e as Error).message 
              }));
              return;
            }
          }

          // Minimal validation
          const isValid = spec && spec.version === "p5.v1" && spec.sketch && typeof spec.sketch.setup === "string" && typeof spec.sketch.draw === "string";
          if (!isValid) {
            console.error('Validation failed for spec:', spec);
            res.statusCode = 422;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid spec format", spec }));
            return;
          }

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ spec }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err?.message || "Internal error" }));
        }
      });
    },
  };

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
      mode === 'development' && claudeApiPlugin,
    ].filter(Boolean),
    define: {
      // Prevent iframe communication errors in development
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
