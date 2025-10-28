import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { PhysicsVisualization } from './PhysicsVisualization';
import { BeautifulPDFViewer } from './BeautifulPDFViewer';
import { toast } from 'sonner';
import { requestAnimationStreaming, type ModelResult } from '@/lib/animation';
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
    
    // Create placeholder results for all enabled models
    const placeholderResults: ModelResult[] = enabledModels.map(model => ({
      modelId: model.id,
      modelName: model.name,
      success: false,
      error: null,
      responseTime: 0,
      spec: null,
      isLoading: true // Add loading flag
    } as ModelResult & { isLoading?: boolean }));
    
    // Set placeholder results immediately to show tabs
    setModelResults(placeholderResults);
    setActiveModelIndex(-1); // No active model initially
    
    let firstSuccessfulResult = false;
    let totalResults = 0;
    let successCount = 0;
    
    requestAnimationStreaming({ 
      selectionText, 
      pageContext, 
      pageNumber, 
      multiModelMode,
      enabledModels: enabledModels.map(m => ({ id: m.id, enabled: m.enabled })),
      signal: controller.signal,
      onResult: (result: ModelResult) => {
        if (controller.signal.aborted) return;
        
        // Update the specific model result
        setModelResults(prev => {
          const newResults = prev.map(r => 
            r.modelId === result.modelId 
              ? { ...result, isLoading: false }
              : r
          );
          
          // If this is the first successful result and we haven't set an active model yet
          if (result.success && !firstSuccessfulResult) {
            firstSuccessfulResult = true;
            const resultIndex = newResults.findIndex(r => r.modelId === result.modelId);
            setActiveModelIndex(resultIndex);
            setLoading(false); // Stop global loading when first result arrives
          }
          
          return newResults;
        });
        
        totalResults++;
        if (result.success) {
          successCount++;
        }
      }
    })
      .then(allResults => {
        if (controller.signal.aborted) return;
        
        // Show final toast message
        if (multiModelMode) {
          toast.success(`Generated ${successCount} animations from ${totalResults} models`);
        } else {
          toast.success(successCount > 0 ? 'Animation generated successfully!' : 'Animation generation failed');
        }
        
        // If no successful results were found during streaming, set active to first result
        if (!firstSuccessfulResult && allResults.length > 0) {
          setActiveModelIndex(0);
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
