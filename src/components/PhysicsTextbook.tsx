import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { PhysicsVisualization } from './PhysicsVisualization';
import { BeautifulPDFViewer } from './BeautifulPDFViewer';
import { toast } from 'sonner';
import { requestAnimation, type ModelResult } from '@/lib/animation';
import { useSettings } from '@/contexts/SettingsContext';

interface PhysicsTextbookProps {
  pdfUrl: string;
  onPdfUpload?: (url: string, title: string, subtitle: string) => void;
}

export const PhysicsTextbook = forwardRef<{ triggerUpload: () => void }, PhysicsTextbookProps>(({ pdfUrl, onPdfUpload }, ref) => {
  const { getEnabledModels, isMultiModelMode } = useSettings();
  const [activeConcept, setActiveConcept] = useState<string | null>(null);
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [activeModelIndex, setActiveModelIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const pdfViewerRef = useRef<{ triggerUpload: () => void }>(null);

  // Expose triggerUpload method to parent component
  useImperativeHandle(ref, () => ({
    triggerUpload: () => {
      pdfViewerRef.current?.triggerUpload();
    }
  }));

  const requestAnim = (selectionText: string, pageContext: string, pageNumber: number | null) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    
    const enabledModels = getEnabledModels();
    const multiModelMode = isMultiModelMode();
    
    requestAnimation({ 
      selectionText, 
      pageContext, 
      pageNumber, 
      multiModelMode,
      enabledModels: enabledModels.map(m => ({ id: m.id, enabled: m.enabled })),
      signal: controller.signal 
    })
      .then(response => {
        setModelResults(response.results);
        // Set active model to the first successful one
        const firstSuccessIndex = response.results.findIndex(r => r.success);
        setActiveModelIndex(firstSuccessIndex >= 0 ? firstSuccessIndex : 0);
        
        const successCount = response.results.filter(r => r.success).length;
        if (multiModelMode) {
          toast.success(`Generated ${successCount} animations from ${response.results.length} models`);
        } else {
          toast.success(successCount > 0 ? 'Animation generated successfully!' : 'Animation generation failed');
        }
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
    }, 500);
  };

  return (
    <div className="flex h-full">
      {/* PDF Viewer */}
      <div className="flex-1 min-w-0">
        <BeautifulPDFViewer 
          pdfUrl={pdfUrl}
          onTextSelection={handleTextSelection}
          onPdfUpload={onPdfUpload}
          ref={pdfViewerRef}
          className="h-full"
        />
      </div>

      {/* Physics Visualization Panel */}
      <div className="w-[40%] min-w-[400px] border-l border-border physics-animation-container">
        <PhysicsVisualization 
          concept={activeConcept}
          isVisible={!!activeConcept}
          modelResults={modelResults}
          activeModelIndex={activeModelIndex}
          onModelChange={setActiveModelIndex}
          isLoading={loading}
          multiModelMode={isMultiModelMode()}
        />
      </div>
    </div>
  );
});
