export interface P5SketchSpec {
  version: "p5.v1";
  title: string;
  concept: string;
  sketch: {
    background: string;
    frameRate: number;
    noLoop: boolean;
    pixelDensity: number;
    setup: string;
    draw: string;
  };
  meta?: {
    hints?: string[];
  };
}

export async function requestAnimation(params: {
  selectionText: string;
  pageContext: string;
  pageNumber: number | null;
  signal?: AbortSignal;
}): Promise<P5SketchSpec> {
  const response = await fetch("/api/animation", {
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
    throw new Error(`Model request failed: ${response.status} ${text}`);
  }
  const json = await response.json();
  return json.spec as P5SketchSpec;
}


