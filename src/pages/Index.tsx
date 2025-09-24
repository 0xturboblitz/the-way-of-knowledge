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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="way-of-physics-title text-4xl md:text-6xl mb-4 animate-fade-in-elegant">
              The Way of Electrodynamics
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground mb-6 italic">
              Interactive Physics
            </h2>
            <p className="text-foreground leading-relaxed max-w-2xl mx-auto">
              Experience Griffiths' <em>Introduction to Electrodynamics</em> like never before.
              Hover over any paragraph to unveil live physics simulations that bring the concepts to life.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 min-h-[700px]">
        <PhysicsTextbook pdfUrl={pdfUrl} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 p-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Inspired by <em>The Way of Code</em> • Live physics animations powered by p5.js • 
            Textbook: <em>Introduction to Electrodynamics</em> (Chapters 1-5) by David J. Griffiths
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;