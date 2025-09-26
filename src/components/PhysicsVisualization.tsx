import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { P5Runner } from '@/components/P5Runner';
import { PhysicsLoader } from './ui/PhysicsLoader';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { SettingsMenu } from './SettingsMenu';
import type { ModelResult } from '@/lib/animation';

interface PhysicsVisualizationProps {
  concept: string | null;
  isVisible: boolean;
  modelResults: ModelResult[];
  activeModelIndex: number;
  onModelChange: (index: number) => void;
  isLoading?: boolean;
  multiModelMode: boolean;
}

export const PhysicsVisualization: React.FC<PhysicsVisualizationProps> = ({ 
  concept, 
  isVisible,
  modelResults,
  activeModelIndex,
  onModelChange,
  isLoading,
  multiModelMode,
}) => {

  if (!isVisible) {
    return (
      <div className="h-full flex flex-col">
        {/* Header with settings even when no animation is shown */}
        <div className="p-3 border-b border-border bg-card/50">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-foreground">
              Live Simulator
            </h3>
            <div className="flex items-center gap-2">
              <SettingsMenu />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Select text to animate it!
          </p>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-float mb-4">
              <div className="w-24 h-24 mx-auto border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-accent/20 rounded-full animate-physics-pulse"></div>
              </div>
            </div>
            {/* <h3 className="text-lg font-medium text-foreground mb-2">Interactive Physics</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select any text to get a live physics animation."
            </p> */}
          </div>
        </div>
      </div>
    );
  }

  const activeResult = modelResults[activeModelIndex];
  const activeSpec = activeResult?.spec;

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-foreground">
            Live Simulator
          </h3>
          <div className="flex items-center gap-2">
            <SettingsMenu />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {activeSpec?.title || 'Generating animation...'}
        </p>
      </div>

      {/* Model Tabs - Only show in multi-model mode */}
      {multiModelMode && modelResults.length > 0 && (
        <div className="border-b border-border">
          <Tabs value={activeModelIndex.toString()} onValueChange={(value) => onModelChange(parseInt(value))}>
            <TabsList className="grid w-full h-auto p-1" style={{ gridTemplateColumns: `repeat(${Math.min(modelResults.length, 8)}, 1fr)` }}>
              {modelResults.map((result, index) => (
                <TabsTrigger 
                  key={result.modelId} 
                  value={index.toString()}
                  className="flex flex-col items-center gap-1 p-2 text-xs"
                >
                  <div className="flex items-center gap-1">
                    {result.success ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="truncate max-w-[60px]">
                      {result.modelName.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2 w-2" />
                    <span>{result.responseTime}ms</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <div className="flex-1 relative">
        {activeResult?.success ? (
          <P5Runner spec={activeSpec || null} className="w-full h-full" />
        ) : activeResult && !activeResult.success ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h4 className="font-medium text-foreground mb-2">Animation Failed</h4>
              <p className="text-sm text-muted-foreground">
                {activeResult?.error || 'Unknown error occurred'}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-float mb-4">
                <div className="w-24 h-24 mx-auto border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
                  <div className="w-12 h-12 bg-accent/20 rounded-full animate-physics-pulse"></div>
                </div>
              </div>
              {/* <p className="text-sm text-muted-foreground max-w-sm">
                Ready to generate animation
              </p> */}
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
            <PhysicsLoader 
              size="md"
              text={multiModelMode ? "Generating animations from multiple models..." : "Generating physics animation..."}
              className="animate-fade-in-elegant"
            />
          </div>
        )}
      </div>

      {/* Model Details and Concept */}
      {concept && (
        <div className="p-4 border-t border-border bg-card/30 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground">
              Concept: <span className="italic">{concept.substring(0, 100)}{concept.length > 100 ? '...' : ''}</span>
            </h4>
          </div>
          
          {activeSpec?.meta?.hints && activeSpec.meta.hints.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
              {activeSpec.meta.hints.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};