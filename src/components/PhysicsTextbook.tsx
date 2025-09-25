import React, { useState, useEffect, useRef } from 'react';
import { PhysicsVisualization } from './PhysicsVisualization';
import { BeautifulPDFViewer } from './BeautifulPDFViewer';
import { toast } from 'sonner';
import { requestAnimation, type P5SketchSpec } from '@/lib/animation';

interface PhysicsTextbookProps {
  pdfUrl: string;
}

export const PhysicsTextbook: React.FC<PhysicsTextbookProps> = ({ pdfUrl }) => {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [spec, setSpec] = useState<P5SketchSpec | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const requestAnim = (selectionText: string, pageContext: string, pageNumber: number | null) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    requestAnimation({ selectionText, pageContext, pageNumber, signal: controller.signal })
      .then(result => {
        setSpec(result);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error(err);
        toast.error('Animation request failed');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  };

  const handleTextSelection = (text: string, context: string, pageNumber: number, fullPageText: string) => {
    const meaningful = (text || '').trim();
    if (meaningful.length <= 3) return;
    setActiveConcept(meaningful);
    const fullContext = fullPageText && fullPageText.length > context.length ? fullPageText : context;

    // Debounce a few seconds to avoid multiple requests during progressive selections
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      console.log('handleTextSelection');
      console.log('text:', text);
      console.log('context:', context);
      console.log('pageNumber:', pageNumber);
      console.log('fullPageText:', fullPageText);
      toast.success(`Selected: "${meaningful.substring(0, 50)}${meaningful.length > 50 ? '...' : ''}"`);
      requestAnim(meaningful, fullContext, pageNumber);
    }, 1800);
  };

  return (
    <div className="flex h-full">
      {/* PDF Viewer */}
      <div className="flex-1 min-w-0">
        <BeautifulPDFViewer 
          pdfUrl={pdfUrl}
          onTextSelection={handleTextSelection}
          className="h-full"
        />
      </div>

      {/* Physics Visualization Panel */}
      <div className="w-[40%] min-w-[400px] border-l border-border physics-animation-container">
        <PhysicsVisualization 
          concept={activeConcept}
          isVisible={!!activeConcept}
          sketchSpec={spec}
          isLoading={loading}
        />
      </div>
    </div>
  );
};
