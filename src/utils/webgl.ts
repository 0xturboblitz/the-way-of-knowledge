/**
 * WebGL capability detection and utilities
 */

export interface WebGLCapabilities {
  hasWebGL: boolean;
  hasWebGL2: boolean;
  maxTextureSize: number;
  maxVertexAttributes: number;
  extensions: string[];
  renderer: string;
  version: string;
}

/**
 * Detect WebGL capabilities of the current browser/device
 */
export function detectWebGLCapabilities(): WebGLCapabilities {
  const canvas = document.createElement('canvas');
  
  // Try WebGL2 first
  let gl = canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    depth: true,
    stencil: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  }) as WebGL2RenderingContext | WebGLRenderingContext | null;
  
  let hasWebGL2 = !!gl;
  
  // Fallback to WebGL1
  if (!gl) {
    gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      depth: true,
      stencil: true,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    }) as WebGLRenderingContext | null;
  }
  
  const hasWebGL = !!gl;
  
  if (!gl) {
    return {
      hasWebGL: false,
      hasWebGL2: false,
      maxTextureSize: 0,
      maxVertexAttributes: 0,
      extensions: [],
      renderer: 'None',
      version: 'None'
    };
  }
  
  // Get capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  const renderer = gl.getParameter(gl.RENDERER);
  const version = gl.getParameter(gl.VERSION);
  
  // Get supported extensions
  const extensions = gl.getSupportedExtensions() || [];
  
  // Clean up
  canvas.remove();
  
  return {
    hasWebGL,
    hasWebGL2,
    maxTextureSize,
    maxVertexAttributes,
    extensions,
    renderer,
    version
  };
}

/**
 * Check if WebGL is available and working
 */
export function isWebGLAvailable(): boolean {
  const capabilities = detectWebGLCapabilities();
  return capabilities.hasWebGL;
}

/**
 * Get optimal WebGL context attributes based on device capabilities
 */
export function getOptimalWebGLAttributes(): WebGLContextAttributes {
  const capabilities = detectWebGLCapabilities();
  
  return {
    alpha: true,
    antialias: capabilities.maxTextureSize > 4096, // Disable on lower-end devices
    depth: true,
    stencil: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false
  };
}

/**
 * Log WebGL capabilities for debugging
 */
export function logWebGLCapabilities(): void {
  const capabilities = detectWebGLCapabilities();
  console.group('WebGL Capabilities');
  console.log('WebGL Support:', capabilities.hasWebGL);
  console.log('WebGL2 Support:', capabilities.hasWebGL2);
  console.log('Max Texture Size:', capabilities.maxTextureSize);
  console.log('Max Vertex Attributes:', capabilities.maxVertexAttributes);
  console.log('Renderer:', capabilities.renderer);
  console.log('Version:', capabilities.version);
  console.log('Extensions:', capabilities.extensions.length, 'available');
  console.groupEnd();
}

/**
 * WebGL context lost/restored event handlers
 */
export function setupWebGLContextHandlers(
  canvas: HTMLCanvasElement,
  onContextLost?: () => void,
  onContextRestored?: () => void
): () => void {
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('WebGL context lost');
    onContextLost?.();
  };
  
  const handleContextRestored = () => {
    console.log('WebGL context restored');
    onContextRestored?.();
  };
  
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);
  
  // Return cleanup function
  return () => {
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
  };
}
