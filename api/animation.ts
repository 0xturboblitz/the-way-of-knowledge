import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured" });

  try {
    const { selectionText, pageContext, pageNumber, multiModelMode, enabledModels } = (req.body ?? {});
    if (!selectionText || !pageContext) return res.status(400).json({ error: "selectionText and pageContext are required" });

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
    
    const allModels = [
      { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", model: "anthropic/claude-3.5-haiku" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", model: "openai/gpt-4o-mini" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", model: "openai/gpt-4.1-mini" },
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", model: "google/gemini-2.5-flash" },
      { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash", model: "google/gemini-2.0-flash-001" },
      { id: "grok-code-fast-1", name: "Grok Code Fast", model: "x-ai/grok-code-fast-1" }
    ];

    let modelsToUse: typeof allModels;
    if (multiModelMode && Array.isArray(enabledModels)) {
      modelsToUse = allModels.filter(m => enabledModels.some((e: any) => e.id === m.id && e.enabled));
    } else {
      const first = Array.isArray(enabledModels) ? enabledModels.find((m:any)=>m.enabled) : null;
      const cfg = first ? allModels.find(m => m.id === first.id) : allModels[0];
      modelsToUse = [cfg ?? allModels[0]];
    }
    if (!modelsToUse.length) modelsToUse = [allModels[0]];

    // Run in parallel and stream results as they complete
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const promises = modelsToUse.map(async (modelInfo) => {
      const t0 = Date.now();
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://your-vercel-domain.vercel.app",
            "X-Title": "Electro Code Canvas",
          },
          body: JSON.stringify({
            model: modelInfo.model,
            max_tokens: 4000,
            temperature: 0.3,
            messages: [{ role: "system", content: system }, { role: "user", content: user }],
            response_format: { type: "json_object" }
          })
        });

        const responseTime = Date.now() - t0;
        if (!r.ok) {
          const errText = await r.text();
          return { modelId: modelInfo.id, modelName: modelInfo.name, success: false, error: `API error: ${r.status} ${errText}`, responseTime, spec: null };
        }
        
        const json = await r.json();
        const content = json.choices?.[0]?.message?.content;
        
        if (!content) {
          return { modelId: modelInfo.id, modelName: modelInfo.name, success: false, error: "No content in response", responseTime, spec: null };
        }
        
        try {
          const spec = JSON.parse(content);
          return { modelId: modelInfo.id, modelName: modelInfo.name, success: true, error: null, responseTime, spec };
        } catch (e: any) {
          return { modelId: modelInfo.id, modelName: modelInfo.name, success: false, error: `Failed to parse spec: ${e.message}`, responseTime, spec: null };
        }
      } catch (e:any) {
        return { modelId: modelInfo.id, modelName: modelInfo.name, success: false, error: e?.message || "Unknown error", responseTime: Date.now() - t0, spec: null };
      }
    });

    // Send results as newline-delimited JSON as they complete
    for (const promise of promises) {
      const result = await promise;
      res.write(JSON.stringify(result) + '\n');
    }
    
    res.end();
  } catch (e:any) {
    return res.status(500).json({ error: e?.message || "Internal error" });
  }
}
