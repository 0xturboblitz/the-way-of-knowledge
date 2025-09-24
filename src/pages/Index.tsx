import React from 'react';
import { PhysicsTextbook } from '@/components/PhysicsTextbook';

const Index = () => {
  // Local PDF file - using full-size PDF for reliability
  const pdfUrl = "/electrodynamics-high-res.pdf";
  
  // Alternative PDF URLs (commented out)
  // const pdfUrl = "https://www.hlevkin.com/hlevkin/90MathPhysBioBooks/Physics/Physics/Electrodynamics/David%20J.%20Griffiths%20-%20Introduction%20to%20Electrodynamics-Prentice%20Hall%20(1999).pdf";
  // const pdfUrl = "https://www.phys.ufl.edu/~pjh/teaching/phy2048/griffiths_electrodynamics.pdf";
  // const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header - More compact */}
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="way-of-physics-title text-2xl md:text-3xl mb-2 animate-fade-in-elegant">
              The Way of Electrodynamics
            </h1>
            {/* <h2 className="text-lg md:text-xl text-muted-foreground mb-3 italic">
              Interactive Physics
            </h2> */}
            <p className="text-sm text-foreground leading-relaxed max-w-2xl mx-auto">
              Experience Griffiths' <em>Introduction to Electrodynamics</em> like never before.
              Select text to see live physics simulations.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Uses remaining height */}
      <main className="flex-1 min-h-0 overflow-hidden">
        <PhysicsTextbook pdfUrl={pdfUrl} />
      </main>

      {/* Footer - Compact */}
      <footer className="border-t border-border bg-card/50 py-2 px-4 flex-shrink-0">
        <div className="container mx-auto text-center">
          <p className="text-xs text-muted-foreground">
            Inspired by <em>The Way of Code</em> • Live physics animations powered by p5.js
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;