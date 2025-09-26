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

export interface ModelResult {
  modelId: string;
  modelName: string;
  success: boolean;
  error: string | null;
  responseTime: number;
  spec: P5SketchSpec | null;
}

export interface AnimationResponse {
  results: ModelResult[];
}

export async function requestAnimation(params: {
  selectionText: string;
  pageContext: string;
  pageNumber: number | null;
  multiModelMode?: boolean;
  enabledModels?: { id: string; enabled: boolean; }[];
  signal?: AbortSignal;
}): Promise<AnimationResponse> {
  const response = await fetch("/api/animation", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      selectionText: params.selectionText,
      pageContext: params.pageContext,
      pageNumber: params.pageNumber,
      multiModelMode: params.multiModelMode,
      enabledModels: params.enabledModels,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Model request failed: ${response.status} ${text}`);
  }
  const json = await response.json();
  return json as AnimationResponse;
}


