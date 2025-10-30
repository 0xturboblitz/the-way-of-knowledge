import { useState, useRef } from 'react';
import { PhysicsTextbook } from '@/components/PhysicsTextbook';

const Index = () => {
  // const [pdfUrl, setPdfUrl] = useState("/rlpr.pdf");
  const [pdfUrl, setPdfUrl] = useState("/electrodynamics-high-res.pdf");
  const [title, setTitle] = useState("The Way of Electrodynamics");
  const [subtitle, setSubtitle] = useState("Experience Griffiths' Introduction to Electrodynamics like never before.");
  const pdfViewerRef = useRef<{ triggerUpload: () => void }>(null);

  const handlePdfUpload = (url: string, newTitle: string, newSubtitle: string) => {
    setPdfUrl(url);
    setTitle(newTitle);
    setSubtitle(newSubtitle);
  };

  const handleUploadClick = () => {
    pdfViewerRef.current?.triggerUpload();
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header - More compact */}
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="way-of-physics-title text-2xl md:text-3xl mb-2 animate-fade-in-elegant">
              {title}
            </h1>
            <p className="text-sm text-foreground leading-relaxed max-w-2xl mx-auto">
              {subtitle} Or{' '}
              <button 
                onClick={handleUploadClick}
                className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors cursor-pointer font-medium"
              >
                upload your own PDF
              </button>
              .
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Uses remaining height */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <PhysicsTextbook pdfUrl={pdfUrl} onPdfUpload={handlePdfUpload} ref={pdfViewerRef} />
      </main>

      {/* Footer - Compact */}
      {/* <footer className="border-t border-border bg-card/50 py-2 px-4 flex-shrink-0">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            Inspired by <em>The Way of Code</em> • Live physics animations powered by p5.js
          </p>
        </div>
      </footer> */}
    </div>
  );
};

export default Index;