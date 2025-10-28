import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

// Helper function to ensure logs directory exists and write parsed JSON
const writeLogFile = (modelId: string, data: any, type: 'raw' | 'parsed' = 'parsed') => {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Generate timestamp in ISO format
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // Replace forward slashes in modelId to avoid directory path issues
    const safeModelId = modelId.replace(/\//g, '-');
    const filename = `${type}-${safeModelId}-${timestamp}.json`;
    const filepath = path.join(logsDir, filename);
    
    // Write the JSON data to file
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Logged ${type} response for ${modelId} to ${filename}`);
  } catch (error) {
    console.error(`Failed to write log file for ${modelId}:`, error);
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

  const claudeApiPlugin = {
    name: "dev-claude-animation-endpoint",
    apply: "serve" as const,
    configureServer(server: any) {
      // Title generation endpoint
      server.middlewares.use("/api/generate-titles", async (req: any, res: any) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
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

          const { pdfText } = body || {};
          if (!pdfText) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "pdfText is required" }));
            return;
          }

          const openrouterApiKey = env.OPENROUTER_API_KEY;
          if (!openrouterApiKey) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "OpenRouter API key not configured" }));
            return;
          }

          const prompt = `Based on the following text from a PDF document, generate a title and subtitle in the style of "The Way of [Subject]" and "Experience [Document/Author] like never before. Select text to see live simulations."

PDF Text:
${pdfText}

Please analyze the content and respond with a JSON object containing:
{
  "title": "The Way of [extracted subject/topic]",
  "subtitle": "Experience [document name/author/topic] like never before. Select text to see live simulations."
}

Examples:
- For an electrodynamics textbook: {"title": "The Way of Electrodynamics", "subtitle": "Experience Griffiths' Introduction to Electrodynamics like never before. Select text to see live simulations."}
- For a machine learning paper: {"title": "The Way of Machine Learning", "subtitle": "Experience this ML research paper like never before. Select text to see live simulations."}
- For a quantum mechanics text: {"title": "The Way of Quantum Mechanics", "subtitle": "Experience quantum physics like never before. Select text to see live simulations."}

Extract the main subject/topic and create appropriate titles that follow this pattern.`;

          const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openrouterApiKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:5173",
              "X-Title": "Electro Code Canvas"
            },
            body: JSON.stringify({
              model: "anthropic/claude-3.5-sonnet",
              messages: [
                {
                  role: "user",
                  content: prompt
                }
              ],
              max_tokens: 500,
              temperature: 0.7
            })
          });

          if (!openrouterResponse.ok) {
            throw new Error(`OpenRouter API error: ${openrouterResponse.status}`);
          }

          const openrouterData = await openrouterResponse.json() as any;
          const content = openrouterData.choices?.[0]?.message?.content;

          if (!content) {
            throw new Error("No content received from OpenRouter");
          }

          // Try to parse JSON from the response
          let result;
          try {
            // Look for JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              result = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No JSON found in response");
            }
          } catch (parseError) {
            // Fallback: create titles from the text content
            console.warn("Failed to parse JSON response, using fallback", parseError);
            result = {
              title: "The Way of Knowledge",
              subtitle: "Experience this document like never before. Select text to see live simulations."
            };
          }

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));

        } catch (error) {
          console.error("Title generation error:", error);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ 
            error: "Failed to generate titles",
            title: "The Way of Knowledge",
            subtitle: "Experience this document like never before. Select text to see live simulations."
          }));
        }
      });

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

          const { selectionText, pageContext, pageNumber, multiModelMode, enabledModels } = body || {};
          if (!selectionText || !pageContext) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "selectionText and pageContext are required" }));
            return;
          }

          const system = `
You are an expert animator and educator and p5.js creative coder specializing in visualizations and animations for educational purposes.
Your job is to create a p5 animation spec that illustrates ONLY the selected text passage, using the page context for understanding but focusing the visualization on the specific selection.
The animation must help illustrate the core concept in a concise, visually clear way suitable for a sidebar canvas.

You MUST return a JSON object with this exact structure:
{
  "version": "p5.v1",
  "title": "<Short descriptive title of the animation>",
  "concept": "<One sentence describing what is being illustrated>",
  "sketch": {
    "background": "#F5F4EF",
    "frameRate": 30,
    "noLoop": false,
    "pixelDensity": 1,
    "setup": "<JavaScript code body for setup function>",
    "draw": "<JavaScript code body for draw function>"
  },
  "meta": {
    "hints": ["Array of 3 short hint strings"]
  }
}

COLOR PALETTE AND VISUAL DESIGN:
- CRITICAL: The background color MUST be exactly '#F5F4EF' for consistency with the application design.
- Use a muted color palette that complements the warm, academic aesthetic. No very bright colors.
- AVOID bright, neon, or overly saturated colors that clash with the academic aesthetic
- Use subtle gradients and transparency (alpha values) for depth and layering
- Prefer darker, more saturated colors that stand out against the light background
- Never use dark or black for solid objects.

CONSTRAINTS AND CONTRACT:
- Focus ONLY on illustrating the selected text passage, not the entire page context
- Do NOT call p.createCanvas. The host will call p.createCanvas(ctx.width, ctx.height) automatically.
- Use only (p, state, ctx) provided by the host. p is the p5 instance.
- Use ctx.width and ctx.height to size elements so it fits parent, never exceeding page height.
- Don't call background() in draw. The host will call background(state.background) automatically. If you do call background(), it will be ignored.
- Do not import or reference external libraries. Only standard p5 APIs.
- Keep drawing performant: avoid creating new arrays/objects in draw loops unnecessarily.
- The code in setup/draw must be valid, self-contained JavaScript bodies, not wrapped in function declarations.
- SHARED EXECUTION CONTEXT: Variables defined in setup are accessible in draw. To create shared variables, declare them WITHOUT let/const/var in setup (e.g., 'myVar = 10;' not 'let myVar = 10;'). This makes them accessible in draw.
- IMPORTANT: All newlines in JavaScript code strings must be escaped as \\n, not actual newlines.
- Return ONLY the JSON object, no markdown, no explanations, no code fences.
- Do NOT use any WebGL-specific functions. Do NOT use 3D shapes. Only do 2D.
`


const userPrompt = `Please create an animation that illustrates the selected text: "${selectionText}"

Use the following page context to understand the broader topic, but focus your visualization specifically on the selected text concept:

Page Context: ${pageContext}
Page Number: ${pageNumber}

Remember to:
- Illustrate ONLY the concept in the selected text, not the entire page
- Make the visualization educational and visually clear
- Ensure the animation fits well in a sidebar canvas
- Position elements symmetrically around the center point for proper visual balance`;

          const user = userPrompt;

          // Define all available models
          const allModels = [
            { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", model: "anthropic/claude-3.5-haiku" },
            { id: "gpt-4o-mini", name: "GPT-4o Mini", model: "openai/gpt-4o-mini" },
            { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", model: "openai/gpt-4.1-mini" },
            { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", model: "google/gemini-2.5-flash" },
            { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash", model: "google/gemini-2.0-flash-001" },
            { id: "grok-code-fast-1", name: "Grok Code Fast", model: "x-ai/grok-code-fast-1" },
          ];

          // Determine which models to use based on mode and settings
          let modelsToUse;
          if (multiModelMode && enabledModels && Array.isArray(enabledModels)) {
            // Multi-model mode: use enabled models from settings
            modelsToUse = allModels.filter(model => 
              enabledModels.some(enabled => enabled.id === model.id && enabled.enabled)
            );
          } else {
            // Single-model mode: use first enabled model or default
            const firstEnabledModel = enabledModels && Array.isArray(enabledModels) 
              ? enabledModels.find(model => model.enabled)
              : null;
            
            if (firstEnabledModel) {
              const modelConfig = allModels.find(model => model.id === firstEnabledModel.id);
              modelsToUse = modelConfig ? [modelConfig] : [allModels[0]];
            } else {
              modelsToUse = [allModels[0]]; // Default to first model
            }
          }

          // Ensure at least one model is selected
          if (modelsToUse.length === 0) {
            modelsToUse = [allModels[0]];
          }

          // Set up streaming response headers
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/plain");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          let completedCount = 0;
          const totalModels = modelsToUse.length;

          // Call selected models in parallel and stream results as they arrive
          const modelPromises = modelsToUse.map(async (modelInfo) => {
            const startTime = Date.now();
            try {
              const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                  "HTTP-Referer": "http://localhost:8080",
                  "X-Title": "Electro Code Canvas",
                },
                body: JSON.stringify({
                  model: modelInfo.model,
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

              const responseTime = Date.now() - startTime;

              if (!response.ok) {
                const errText = await response.text();
              const result = {
                modelId: modelInfo.id,
                modelName: modelInfo.name,
                success: false,
                error: `API error: ${response.status} ${errText}`,
                responseTime,
                spec: null
              };
              
              // Stream this result immediately
              res.write(JSON.stringify(result) + '\n');
              
              completedCount++;
              if (completedCount === totalModels) {
                res.end();
              }
              
              return result;
              }

              const data = await response.json() as any;
              let spec = data.choices?.[0]?.message?.content;
              
              if (!spec) {
                const result = {
                  modelId: modelInfo.id,
                  modelName: modelInfo.name,
                  success: false,
                  error: "No content in response",
                  responseTime,
                  spec: null
                };
                
                // Stream this result immediately
                res.write(JSON.stringify(result) + '\n');
                
                completedCount++;
                if (completedCount === totalModels) {
                  res.end();
                }
                
                return result;
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
                  const result = {
                    modelId: modelInfo.id,
                    modelName: modelInfo.name,
                    success: false,
                    error: `JSON parse error: ${(e as Error).message}`,
                    responseTime,
                    spec: null
                  };
                  
                  // Stream this result immediately
                  res.write(JSON.stringify(result) + '\n');
                  
                  completedCount++;
                  if (completedCount === totalModels) {
                    res.end();
                  }
                  
                  return result;
                }
              }

              writeLogFile(modelInfo.id, spec, 'parsed');

              // Minimal validation
              const isValid = spec && spec.version === "p5.v1" && spec.sketch && typeof spec.sketch.setup === "string" && typeof spec.sketch.draw === "string";
              
              let result;
              if (!isValid) {
                result = {
                  modelId: modelInfo.id,
                  modelName: modelInfo.name,
                  success: false,
                  error: "Invalid spec format",
                  responseTime,
                  spec: null
                };
              } else {
                result = {
                  modelId: modelInfo.id,
                  modelName: modelInfo.name,
                  success: true,
                  error: null,
                  responseTime,
                  spec
                };
              }
              
              // Stream this result immediately
              res.write(JSON.stringify(result) + '\n');
              
              completedCount++;
              if (completedCount === totalModels) {
                res.end();
              }
              
              return result;

            } catch (err: any) {
              const responseTime = Date.now() - startTime;
              const result = {
                modelId: modelInfo.id,
                modelName: modelInfo.name,
                success: false,
                error: err?.message || "Unknown error",
                responseTime,
                spec: null
              };
              
              // Stream this result immediately
              res.write(JSON.stringify(result) + '\n');
              
              completedCount++;
              if (completedCount === totalModels) {
                res.end();
              }
              
              return result;
            }
          });

          // Don't wait for all promises - they stream individually
          Promise.all(modelPromises).catch(() => {
            // Ensure response ends even if there's an error
            if (!res.headersSent) {
              res.end();
            }
          });
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
