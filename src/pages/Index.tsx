import React from 'react';
import { PhysicsTextbook } from '@/components/PhysicsTextbook';

const Index = () => {
  const pdfUrl = "https://www.hlevkin.com/hlevkin/90MathPhysBioBooks/Physics/Physics/Electrodynamics/David%20J.%20Griffiths%20-%20Introduction%20to%20Electrodynamics-Prentice%20Hall%20(1999).pdf";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="way-of-physics-title text-4xl md:text-6xl mb-4 animate-fade-in-elegant">
              The Way of Physics
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground mb-6 italic">
              Interactive Electrodynamics
            </h2>
            <p className="text-foreground leading-relaxed max-w-2xl mx-auto">
              Experience Griffiths' <em>Introduction to Electrodynamics</em> like never before. 
              Hover over any paragraph to unveil live physics simulations that bring the concepts to life.
              Each visualization is crafted in real-time to illuminate the elegant mathematics of electromagnetic fields.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-200px)]">
        <PhysicsTextbook pdfUrl={pdfUrl} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 p-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Inspired by <em>The Way of Code</em> • Physics visualizations powered by Three.js • 
            Textbook: <em>Introduction to Electrodynamics</em> by David J. Griffiths
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;