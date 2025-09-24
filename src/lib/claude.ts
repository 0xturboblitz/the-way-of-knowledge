export interface P5SketchSpec {
  version: "p5.v1";
  title: string;
  concept: string;
  sketch: {
    background: string;
    frameRate: number;
    noLoop: boolean;
    pixelDensity: number;
    setup: string; // JS body
    draw: string;  // JS body
  };
  meta?: {
    hints?: string[];
  };
}

export async function requestClaudeAnimation(params: {
  selectionText: string;
  pageContext: string;
  pageNumber: number | null;
  signal?: AbortSignal;
}): Promise<P5SketchSpec> {
  const response = await fetch("/api/claude-animation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      selectionText: params.selectionText,
      pageContext: params.pageContext,
      pageNumber: params.pageNumber,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude request failed: ${response.status} ${text}`);
  }
  const json = await response.json();
  return json.spec as P5SketchSpec;
}


