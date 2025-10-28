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
  isLoading?: boolean;
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

export async function requestAnimationStreaming(params: {
  selectionText: string;
  pageContext: string;
  pageNumber: number | null;
  multiModelMode?: boolean;
  enabledModels?: { id: string; enabled: boolean; }[];
  signal?: AbortSignal;
  onResult?: (result: ModelResult) => void;
}): Promise<ModelResult[]> {
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

  const results: ModelResult[] = [];
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  try {
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const result = JSON.parse(line) as ModelResult;
            results.push(result);
            params.onResult?.(result);
          } catch (e) {
            console.error('Failed to parse streaming result:', e, line);
          }
        }
      }
    }
    
    // Process any remaining data in buffer
    if (buffer.trim()) {
      try {
        const result = JSON.parse(buffer) as ModelResult;
        results.push(result);
        params.onResult?.(result);
      } catch (e) {
        console.error('Failed to parse final streaming result:', e, buffer);
      }
    }
  } finally {
    reader.releaseLock();
  }

  return results;
}


