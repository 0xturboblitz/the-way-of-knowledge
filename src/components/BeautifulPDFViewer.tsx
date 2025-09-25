import React, { useState, useEffect, useRef, forwardRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
  Loader2,
  Hash
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
  onTextSelection?: (text: string, context: string, pageNumber: number, fullPageText: string) => void;
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
    const [currentPageFullText, setCurrentPageFullText] = useState<string>("");
    const [jumpToPage, setJumpToPage] = useState<string>("");
  const [currentVisiblePage, setCurrentVisiblePage] = useState<number>(1);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(800);
  
  // Virtual scrolling configuration
  const BUFFER_PAGES = 2; // Pages to render above and below visible area
  const [actualPageHeight, setActualPageHeight] = useState<number>(1000); // Actual measured page height
  const ESTIMATED_PAGE_HEIGHT = actualPageHeight; // Use measured height when available

    const documentOptions = React.useMemo(() => ({
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      wasmUrl: '/wasm/',
    }), []);

    // Track container size for responsive page sizing and virtual scrolling
    useEffect(() => {
      const element = contentContainerRef.current;
      // The scroll container is the one with overflow-auto class
      const scrollContainer = containerRef.current?.querySelector('.overflow-auto') as HTMLElement;
      if (!element || !scrollContainer) return;

      const updateDimensions = () => {
        // subtract padding (p-4 → 32px total) to prevent overflow
        const width = Math.max(0, element.clientWidth - 32);
        const height = Math.max(0, element.clientHeight - 32);
        setContainerWidth(width || 800);
        setContainerHeight(height || 800);
        setViewportHeight(scrollContainer.clientHeight);
      };

      updateDimensions();

      const resizeObserver = new ResizeObserver(() => updateDimensions());
      resizeObserver.observe(element);
      resizeObserver.observe(scrollContainer);
      window.addEventListener('resize', updateDimensions);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateDimensions);
      };
    }, []);

    // Track last processed selection to prevent duplicates
    const lastSelectionRef = useRef<{ text: string; timestamp: number } | null>(null);

    // Core selection processing (shared by multiple triggers)
    const processCurrentSelection = useCallback((toastFeedback: boolean) => {
      if (!onTextSelection) return;
      const selection = window.getSelection();
      if (!selection) return;
      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length < 3) return;
      if (selection.rangeCount === 0) return;
      
      // Prevent duplicate processing of the same selection within a short time window
      const now = Date.now();
      if (lastSelectionRef.current && 
          lastSelectionRef.current.text === selectedText && 
          now - lastSelectionRef.current.timestamp < 100) {
        return;
      }
      
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer as Node;
      const viewerEl = containerRef.current;
      if (viewerEl && !viewerEl.contains(container.nodeType === Node.TEXT_NODE ? (container.parentNode as Node) : (container as Node))) {
        return;
      }
      let context = '';
      if (container.nodeType === Node.TEXT_NODE) {
        const parentElement = (container as Node).parentElement as Element | null;
        if (parentElement) context = parentElement.textContent || '';
      } else if (container.nodeType === Node.ELEMENT_NODE) {
        context = (container as Element).textContent || '';
      }
      context = context.replace(/\s+/g, ' ').trim();
      
      // Update last selection tracking
      lastSelectionRef.current = { text: selectedText, timestamp: now };
      
      onTextSelection(selectedText, context, pageNumber, currentPageFullText);
    }, [onTextSelection, pageNumber, currentPageFullText]);

    // Handle text selection in PDF (mouse/touch end)
    const handleTextSelection = useCallback((event: Event) => {
      processCurrentSelection(true);
    }, [processCurrentSelection]);

    // Setup text selection listeners for all text layers
    const setupTextSelectionListeners = useCallback(() => {
      if (!onTextSelection) return;
      
      // Remove existing listeners first
      const existingTextLayers = document.querySelectorAll('.textLayer, .react-pdf__Page__textContent');
      existingTextLayers.forEach(layer => {
        layer.removeEventListener('mouseup', handleTextSelection as EventListener);
        layer.removeEventListener('touchend', handleTextSelection as EventListener);
      });
      if (contentContainerRef.current) {
        contentContainerRef.current.removeEventListener('mouseup', handleTextSelection as EventListener);
        contentContainerRef.current.removeEventListener('touchend', handleTextSelection as EventListener);
      }
      
      // Prefer listening on container to avoid multiple overlapping listeners
      if (contentContainerRef.current) {
        contentContainerRef.current.addEventListener('mouseup', handleTextSelection as EventListener);
        contentContainerRef.current.addEventListener('touchend', handleTextSelection as EventListener);
      } else {
        // Fallback: listen on individual text layers if container not available
        const textLayers = document.querySelectorAll('.textLayer, .react-pdf__Page__textContent');
        textLayers.forEach(layer => {
          layer.addEventListener('mouseup', handleTextSelection as EventListener);
          layer.addEventListener('touchend', handleTextSelection as EventListener);
        });
      }
    }, [onTextSelection, handleTextSelection]);

    // Cleanup text selection listeners when component unmounts or page changes
    useEffect(() => {
      return () => {
        const textLayers = document.querySelectorAll('.textLayer, .react-pdf__Page__textContent');
        textLayers.forEach(layer => {
          layer.removeEventListener('mouseup', handleTextSelection as EventListener);
          layer.removeEventListener('touchend', handleTextSelection as EventListener);
        });
        if (contentContainerRef.current) {
          contentContainerRef.current.removeEventListener('mouseup', handleTextSelection as EventListener);
          contentContainerRef.current.removeEventListener('touchend', handleTextSelection as EventListener);
        }
      };
    }, [handleTextSelection, pageNumber]);

    // Robust selection detection across reloads and dynamic layers
    useEffect(() => {
      const onSelChange = () => {
        // slight delay to allow DOM/layout to settle
        window.setTimeout(() => processCurrentSelection(false), 80);
      };
      document.addEventListener('selectionchange', onSelChange);
      return () => {
        document.removeEventListener('selectionchange', onSelChange);
      };
    }, [processCurrentSelection]);

    // PDF.js event handlers
    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setIsLoading(false);
      setError(null);
      // Initialize page input with current page
      setJumpToPage("1");
      toast.success("PDF document loaded successfully!");
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
      console.error('Error loading PDF document:', error);
      setIsLoading(false);
      setError(error.message || 'Failed to load PDF document');
      toast.error(`Failed to load PDF document: ${error.message || 'Unknown error'}`);
    }, []);

    const onPageLoadSuccess = useCallback((pageNum?: number) => {
      console.log('Page loaded successfully', pageNum);
      
      // Set up text selection detection after page loads
      setTimeout(() => {
        setupTextSelectionListeners();
      }, 200);
      
      // Extract full text of current page from text layer(s) and measure page height
      setTimeout(() => {
        try {
          const viewer = containerRef.current;
          if (!viewer) return;
          
          // Measure actual page height from the first rendered page
          if (pageNum === 1) {
            const pageElement = pageRefs.current[1];
            if (pageElement) {
              const pageCanvas = pageElement.querySelector('canvas');
              if (pageCanvas) {
                const actualHeight = pageCanvas.offsetHeight + 40; // Add some padding
                setActualPageHeight(actualHeight);
                console.log('Measured page height:', actualHeight);
              }
            }
          }
          
          const layers = viewer.querySelectorAll('.textLayer, .react-pdf__Page__textContent');
          // Pick last textLayer (current rendered page) or concatenate
          let fullText = '';
          layers.forEach(layer => {
            const t = (layer as HTMLElement).innerText || (layer as HTMLElement).textContent || '';
            if (t) fullText += (fullText ? '\n' : '') + t;
          });
          if (fullText.trim().length > 0) {
            // Normalize whitespace
            fullText = fullText.replace(/\s+/g, ' ').trim();
            setCurrentPageFullText(fullText);
          }
        } catch (e) {
          console.warn('Failed to extract full page text or measure height', e);
        }
      }, 400);
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

    // Calculate which pages should be rendered (virtual scrolling)
    const visiblePageRange = useMemo(() => {
      if (!numPages) return { start: 1, end: 1 };
      
      const pageHeight = ESTIMATED_PAGE_HEIGHT * scale;
      
      // If we haven't scrolled yet or don't have viewport data, show first few pages
      if (scrollTop === 0 || viewportHeight === 0) {
        return { start: 1, end: Math.min(numPages, 5) };
      }
      
      const startPage = Math.max(1, Math.floor(scrollTop / pageHeight) - BUFFER_PAGES + 1);
      const endPage = Math.min(numPages, Math.ceil((scrollTop + viewportHeight) / pageHeight) + BUFFER_PAGES);
      
      // Ensure we always show at least a few pages
      const minPages = 3;
      const actualEndPage = Math.max(endPage, startPage + minPages - 1);
      
      return { start: startPage, end: Math.min(numPages, actualEndPage) };
    }, [scrollTop, viewportHeight, numPages, scale, BUFFER_PAGES, ESTIMATED_PAGE_HEIGHT, actualPageHeight]);

    // Page jump function - optimized for virtual scrolling
    const handlePageJump = useCallback((pageNum: number) => {
      if (pageNum >= 1 && pageNum <= (numPages || 1)) {
        const scrollContainer = containerRef.current?.querySelector('.overflow-auto') as HTMLElement;
        if (scrollContainer) {
          const pageHeight = ESTIMATED_PAGE_HEIGHT * scale;
          const targetScrollTop = (pageNum - 1) * pageHeight;
          console.log('Jumping to page', pageNum, 'scrollTop:', targetScrollTop);
          scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
          setCurrentVisiblePage(pageNum);
          setPageNumber(pageNum);
        }
      }
    }, [numPages, scale, ESTIMATED_PAGE_HEIGHT]);

    // Handle page number input change - instant navigation
    const handlePageInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const pageNum = parseInt(value);
      
      // Always update the display value
      setJumpToPage(value);
      
      // If it's a valid page number, navigate immediately
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= (numPages || 1)) {
        handlePageJump(pageNum);
      }
    }, [numPages, handlePageJump]);

    // Track scroll position and visible page - optimized for virtual scrolling
    useEffect(() => {
      // Find the correct scroll container - it should be the element with overflow-auto
      const scrollContainer = containerRef.current?.querySelector('.overflow-auto') as HTMLElement;
      
      if (!scrollContainer || !numPages) return;

      const handleScroll = () => {
        const currentScrollTop = scrollContainer.scrollTop;
        setScrollTop(currentScrollTop);

        // Calculate current visible page based on scroll position
        const pageHeight = ESTIMATED_PAGE_HEIGHT * scale;
        const newVisiblePage = Math.max(1, Math.min(numPages, Math.ceil((currentScrollTop + viewportHeight / 2) / pageHeight)));

        if (newVisiblePage !== currentVisiblePage) {
          setCurrentVisiblePage(newVisiblePage);
          setPageNumber(newVisiblePage);
          // Update the input to show current page
          setJumpToPage(newVisiblePage.toString());
        }
      };

      // Throttle scroll events for better performance
      let scrollTimeout: NodeJS.Timeout;
      const throttledHandleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
      };

      scrollContainer.addEventListener('scroll', throttledHandleScroll, { passive: true });
      
      // Initial scroll position
      handleScroll();

      return () => {
        scrollContainer.removeEventListener('scroll', throttledHandleScroll);
        if (scrollTimeout) clearTimeout(scrollTimeout);
      };
    }, [numPages, currentVisiblePage, scale, viewportHeight, ESTIMATED_PAGE_HEIGHT]);

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
                Page {currentVisiblePage} of {numPages}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Page Jump Controls */}
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                max={numPages || 1}
                value={jumpToPage}
                onChange={handlePageInputChange}
                className="w-16 h-8 text-xs text-center"
              />
              <span className="text-xs text-muted-foreground">/ {numPages || 1}</span>
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
          <div className="flex justify-center p-2 h-full">
            {isLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center pdf-loading">
                  <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading PDF document...</p>
                </div>
              </div>
            )}
            
            <div ref={contentContainerRef} className="w-full h-full">
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
                {numPages && (
                  <div 
                    className="relative flex flex-col items-center"
                    style={{ 
                      height: numPages * ESTIMATED_PAGE_HEIGHT * scale,
                      minHeight: '100%'
                    }}
                  >
                    {Array.from({ length: visiblePageRange.end - visiblePageRange.start + 1 }, (_, index) => {
                      const pageNum = visiblePageRange.start + index;
                      const pageHeight = ESTIMATED_PAGE_HEIGHT * scale;
                      const topOffset = (pageNum - 1) * pageHeight;
                      
                      return (
                        <div
                          key={pageNum}
                          ref={(el) => (pageRefs.current[pageNum] = el)}
                          className="absolute flex justify-center w-full"
                          style={{ 
                            top: topOffset,
                            height: pageHeight,
                            minHeight: pageHeight
                          }}
                        >
                          <div className="relative" style={{ marginBottom: '1rem' }}>
                            <Page
                              pageNumber={pageNum}
                              width={Math.max(320, Math.floor(containerWidth * scale))}
                              rotate={rotation}
                              onLoadSuccess={() => {
                                onPageLoadSuccess(pageNum);
                              }}
                              onLoadError={onPageLoadError}
                              className="shadow-lg max-w-full"
                              renderTextLayer={true}
                              renderAnnotationLayer={true}
                              loading={
                                <div 
                                  className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded"
                                  style={{ 
                                    width: Math.max(320, Math.floor(containerWidth * scale)),
                                    height: actualPageHeight - 40
                                  }}
                                >
                                  <div className="text-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500">Loading page {pageNum}...</p>
                                  </div>
                                </div>
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Document>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

BeautifulPDFViewer.displayName = 'BeautifulPDFViewer';
