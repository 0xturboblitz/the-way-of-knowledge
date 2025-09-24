import React from 'react';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';
import { P5Runner } from '@/components/P5Runner';
import { PhysicsLoader } from './ui/PhysicsLoader';
import type { P5SketchSpec } from '@/lib/claude';

interface PhysicsVisualizationProps {
  concept: string | null;
  isVisible: boolean;
  sketchSpec: P5SketchSpec | null;
  isLoading?: boolean;
}

export const PhysicsVisualization: React.FC<PhysicsVisualizationProps> = ({ 
  concept, 
  isVisible,
  sketchSpec,
  isLoading,
}) => {

  if (!isVisible) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-float mb-4">
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full animate-physics-pulse"></div>
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Interactive Physics</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Select any text to get a live animation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-foreground">Live Physics Simulation</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {sketchSpec?.title || 'Generating animation...'}
        </p>
      </div>

      <div className="flex-1 relative">
        <P5Runner spec={sketchSpec || null} className="w-full h-full" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <PhysicsLoader 
              size="md"
              text="Generating physics animation..."
              className="animate-fade-in-elegant"
            />
          </div>
        )}
      </div>

      {concept && (
        <div className="p-4 border-t border-border bg-card/30 max-h-32 overflow-y-auto">
          <h4 className="text-sm font-medium text-foreground mb-2">Highlighted Concept: <span className="italic">{concept.substring(0, 200)}{concept.length > 200 ? '...' : ''}</span></h4>
          {sketchSpec?.meta?.hints && sketchSpec.meta.hints.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
              {sketchSpec.meta.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};