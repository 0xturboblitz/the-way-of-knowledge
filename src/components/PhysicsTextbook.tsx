import React, { useState, useEffect, useRef } from 'react';
import { PhysicsVisualization } from './PhysicsVisualization';
import { BeautifulPDFViewer } from './BeautifulPDFViewer';
import { toast } from 'sonner';

interface PhysicsTextbookProps {
  pdfUrl: string;
}

export const PhysicsTextbook: React.FC<PhysicsTextbookProps> = ({ pdfUrl }) => {
  const [activeConcept, setActiveConcept] = useState<string | null>(null);

  const handleTextSelection = (text: string, context: string) => {
    if (text.length > 10) { // Only process meaningful text segments
      setActiveConcept(text);
    }
  };

  return (
    <div className="flex h-full min-h-[800px]">
      {/* PDF Viewer */}
      <div className="flex-1 min-w-0">
        <BeautifulPDFViewer 
          pdfUrl={pdfUrl}
          onTextSelection={handleTextSelection}
          className="h-full"
        />
      </div>

      {/* Physics Visualization Panel */}
      <div className="w-[40%] min-w-[460px] border-l border-border physics-animation-container">
        <PhysicsVisualization 
          concept={activeConcept}
          isVisible={!!activeConcept}
        />
      </div>
    </div>
  );
};
