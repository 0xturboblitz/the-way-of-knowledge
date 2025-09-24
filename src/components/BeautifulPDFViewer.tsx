import React, { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Maximize2,
  BookOpen,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Set up PDF.js worker using bundler-friendly URL
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface BeautifulPDFViewerProps {
  pdfUrl: string;
  onTextSelection?: (text: string, context: string) => void;
  className?: string;
}

export const BeautifulPDFViewer = forwardRef<HTMLDivElement, BeautifulPDFViewerProps>(
  ({ pdfUrl, onTextSelection, className }, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState<number>(800);
    const [containerHeight, setContainerHeight] = useState<number>(800);

    const documentOptions = React.useMemo(() => ({
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      wasmUrl: '/wasm/',
    }), []);

    // Track container size for responsive page sizing
    useEffect(() => {
      const element = contentContainerRef.current;
      if (!element) return;

      const updateWidth = () => {
        // subtract padding (p-4 → 32px total) to prevent overflow
        const width = Math.max(0, element.clientWidth - 32);
        const height = Math.max(0, element.clientHeight - 32);
        setContainerWidth(width || 800);
        setContainerHeight(height || 800);
      };

      updateWidth();

      const resizeObserver = new ResizeObserver(() => updateWidth());
      resizeObserver.observe(element);
      window.addEventListener('resize', updateWidth);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateWidth);
      };
    }, []);

    // Handle text selection in PDF
    const handleTextSelection = useCallback((event: Event) => {
      if (!onTextSelection) return;
      
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) return;
      
      const selectedText = selection.toString().trim();
      if (selectedText.length < 3) return; // Ignore very short selections
      
      // Get context around the selection (optional)
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      let context = '';
      
      if (container.nodeType === Node.TEXT_NODE) {
        const parentElement = container.parentElement;
        if (parentElement) {
          context = parentElement.textContent || '';
        }
      } else if (container.nodeType === Node.ELEMENT_NODE) {
        context = (container as Element).textContent || '';
      }
      
      // Clean up context (remove extra whitespace)
      context = context.replace(/\s+/g, ' ').trim();
      
      // Show visual feedback
      toast.success(`Selected: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}"`);
      
      // Call the callback with selected text and context
      onTextSelection(selectedText, context);
      
      // Optional: Clear selection after processing
      // selection.removeAllRanges();
    }, [onTextSelection]);

    // Setup text selection listeners for all text layers
    const setupTextSelectionListeners = useCallback(() => {
      if (!onTextSelection) return;
      
      // Remove existing listeners first
      const existingTextLayers = document.querySelectorAll('.textLayer');
      existingTextLayers.forEach(layer => {
        layer.removeEventListener('mouseup', handleTextSelection);
        layer.removeEventListener('touchend', handleTextSelection);
      });
      
      // Add listeners to all text layers
      const textLayers = document.querySelectorAll('.textLayer');
      textLayers.forEach(layer => {
        layer.addEventListener('mouseup', handleTextSelection);
        layer.addEventListener('touchend', handleTextSelection);
      });
    }, [onTextSelection, handleTextSelection]);

    // Cleanup text selection listeners when component unmounts or page changes
    useEffect(() => {
      return () => {
        const textLayers = document.querySelectorAll('.textLayer');
        textLayers.forEach(layer => {
          layer.removeEventListener('mouseup', handleTextSelection);
          layer.removeEventListener('touchend', handleTextSelection);
        });
      };
    }, [handleTextSelection, pageNumber]);

    // PDF.js event handlers
    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setError(null);
      toast.success("PDF document loaded successfully!");
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
      console.error('Error loading PDF document:', error);
      setIsLoading(false);
      setError(error.message || 'Failed to load PDF document');
      toast.error(`Failed to load PDF document: ${error.message || 'Unknown error'}`);
    }, []);

    const onPageLoadSuccess = useCallback(() => {
      console.log('Page loaded successfully');
      
      // Set up text selection detection after page loads
      setTimeout(() => {
        setupTextSelectionListeners();
      }, 200);
    }, [setupTextSelectionListeners]);

    const onPageLoadError = useCallback((error: Error) => {
      console.error('Error loading page:', error);
      setError(error.message || 'Failed to load page');
    }, []);

    // PDF navigation functions
    const goToPrevPage = useCallback(() => {
      setPageNumber(prev => Math.max(1, prev - 1));
    }, []);

    const goToNextPage = useCallback(() => {
      setPageNumber(prev => Math.min(numPages || 1, prev + 1));
    }, [numPages]);

    const zoomIn = useCallback(() => {
      setScale(prev => Math.min(3.0, prev + 0.2));
    }, []);

    const zoomOut = useCallback(() => {
      setScale(prev => Math.max(0.5, prev - 0.2));
    }, []);

    const resetZoom = useCallback(() => {
      setScale(1.0);
    }, []);

    const rotatePage = useCallback(() => {
      setRotation(prev => (prev + 90) % 360);
    }, []);

    // Download function
    const downloadPDF = () => {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'Introduction to Electrodynamics.pdf';
      link.click();
    };

    // Fullscreen functions
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };

    if (error) {
      const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        setPageNumber(1);
        setScale(1.0);
        setRotation(0);
      };

      return (
        <div className={cn("bg-background border border-border rounded-lg p-8 text-center", className)}>
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2 text-foreground">PDF Loading Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className={cn(
          "pdf-viewer-container relative bg-background border border-border rounded-lg overflow-hidden flex flex-col h-full",
          isFullscreen && "pdf-fullscreen",
          className
        )}
        style={{ boxShadow: 'var(--shadow-elegant)' }}
      >
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Introduction to Electrodynamics.pdf</span>
            </div>
            {numPages && (
              <span className="text-xs text-muted-foreground">
                Page {pageNumber} of {numPages}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Navigation Controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToPrevPage} 
                disabled={pageNumber <= 1}
                className="pdf-control-button h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToNextPage} 
                disabled={pageNumber >= (numPages || 1)}
                className="pdf-control-button h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={zoomOut} className="pdf-control-button h-8 w-8 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetZoom} className="pdf-control-button h-8 w-8 p-0">
                <span className="text-xs font-medium">{Math.round(scale * 100)}%</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={zoomIn} className="pdf-control-button h-8 w-8 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* Other Controls */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={rotatePage} className="pdf-control-button h-8 w-8 p-0">
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="pdf-control-button h-8 w-8 p-0">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadPDF} className="pdf-control-button h-8 w-8 p-0">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Content */}
        <div ref={ref} className="relative flex-1 overflow-auto bg-muted/5">
          <div className="flex justify-center p-4 min-h-[calc(100vh-260px)]">
            {isLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center pdf-loading">
                  <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading PDF document...</p>
                </div>
              </div>
            )}
            
            <div ref={contentContainerRef} className="w-full h-full min-h-[800px] lg:min-h-[calc(100vh-260px)] flex justify-center">
              <Document
                file={pdfUrl}
                options={documentOptions}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading PDF...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center text-destructive">
                      <p>Failed to load PDF document</p>
                    </div>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.max(320, Math.floor(containerWidth * scale))}
                  rotate={rotation}
                  onLoadSuccess={onPageLoadSuccess}
                  onLoadError={onPageLoadError}
                  className="shadow-lg max-w-full"
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>
            </div>
          </div>
        </div>

        {/* Footer with info */}
        <div className="flex items-center justify-between p-3 border-t border-border bg-card/30 backdrop-blur-sm text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>PDF Document Viewer</span>
            {numPages && (
              <span>• {numPages} pages</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Use controls to navigate and zoom</span>
            <span>•</span>
            <span>F for fullscreen</span>
          </div>
        </div>
      </div>
    );
  }
);

BeautifulPDFViewer.displayName = 'BeautifulPDFViewer';
