import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { PhysicsVisualization } from './PhysicsVisualization';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PhysicsTextbookProps {
  pdfUrl: string;
}

export const PhysicsTextbook: React.FC<PhysicsTextbookProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    toast.success("Griffiths' Electrodynamics loaded successfully!");
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setIsLoading(false);
    toast.error("Failed to load the textbook. Please check the URL.");
  };

  // Handle text layer interaction
  useEffect(() => {
    const handleTextHover = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('textLayer')) return;
      
      // Find the closest text element
      const textElement = target.closest('[data-span]') as HTMLElement;
      if (textElement) {
        const text = textElement.textContent || '';
        if (text.length > 10) { // Only process meaningful text segments
          setHoveredText(text);
          setActiveConcept(text);
        }
      }
    };

    const handleTextLeave = () => {
      setHoveredText(null);
      // Keep the visualization active for a moment to allow interaction
      setTimeout(() => {
        setActiveConcept(null);
      }, 500);
    };

    const textLayer = textLayerRef.current;
    if (textLayer) {
      textLayer.addEventListener('mouseover', handleTextHover);
      textLayer.addEventListener('mouseleave', handleTextLeave);
      
      return () => {
        textLayer.removeEventListener('mouseover', handleTextHover);
        textLayer.removeEventListener('mouseleave', handleTextLeave);
      };
    }
  }, [pageNumber]);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(2.5, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  return (
    <div className="flex h-full">
      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Controls */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageNumber} of {numPages || '?'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= (numPages || 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto">
          <div className="flex justify-center p-4">
            {isLoading && (
              <div className="flex items-center justify-center h-96">
                <div className="animate-physics-pulse text-center">
                  <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading Griffiths' Electrodynamics...</p>
                </div>
              </div>
            )}
            
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="max-w-full"
            >
              <div ref={textLayerRef} className="relative">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  className="shadow-elegant"
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </div>
            </Document>
          </div>
        </div>
      </div>

      {/* Physics Visualization Panel */}
      <div className="w-1/2 border-l border-border physics-animation-container">
        <PhysicsVisualization 
          concept={activeConcept}
          isVisible={!!activeConcept}
        />
      </div>
    </div>
  );
};
