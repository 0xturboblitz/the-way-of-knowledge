import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { ElectricFieldVisualization } from './visualizations/ElectricFieldVisualization';
import { MagneticFieldVisualization } from './visualizations/MagneticFieldVisualization';
import { WaveVisualization } from './visualizations/WaveVisualization';
import { Button } from './ui/button';
import { RotateCcw, Play, Pause } from 'lucide-react';

interface PhysicsVisualizationProps {
  concept: string | null;
  isVisible: boolean;
}

export const PhysicsVisualization: React.FC<PhysicsVisualizationProps> = ({ 
  concept, 
  isVisible 
}) => {
  const [visualizationType, setVisualizationType] = useState<string>('default');
  const [isAnimating, setIsAnimating] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<string>('');

  // Analyze the concept and determine visualization type
  useEffect(() => {
    if (!concept) {
      setVisualizationType('default');
      setAnalysisResult('');
      return;
    }

    // Simple keyword-based analysis for demo
    const text = concept.toLowerCase();
    
    if (text.includes('electric') || text.includes('charge') || text.includes('coulomb')) {
      setVisualizationType('electric');
      setAnalysisResult('Electric field visualization showing field lines and charges');
    } else if (text.includes('magnetic') || text.includes('current') || text.includes('flux')) {
      setVisualizationType('magnetic');
      setAnalysisResult('Magnetic field visualization with field lines and current loops');
    } else if (text.includes('wave') || text.includes('frequency') || text.includes('oscillat')) {
      setVisualizationType('wave');
      setAnalysisResult('Electromagnetic wave propagation and oscillations');
    } else if (text.includes('potential') || text.includes('energy')) {
      setVisualizationType('potential');
      setAnalysisResult('Potential energy landscapes and equipotential surfaces');
    } else {
      setVisualizationType('generic');
      setAnalysisResult('General physics concept visualization');
    }
  }, [concept]);

  const renderVisualization = () => {
    switch (visualizationType) {
      case 'electric':
        return <ElectricFieldVisualization isAnimating={isAnimating} />;
      case 'magnetic':
        return <MagneticFieldVisualization isAnimating={isAnimating} />;
      case 'wave':
        return <WaveVisualization isAnimating={isAnimating} />;
      default:
        return (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="hsl(var(--accent))" opacity={0.7} transparent />
            <Text
              position={[0, 2, 0]}
              fontSize={0.5}
              color="hsl(var(--foreground))"
            >
              Hover over physics concepts
            </Text>
          </mesh>
        );
    }
  };

  if (!isVisible) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-float mb-4">
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full animate-physics-pulse"></div>
            </div>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Interactive Physics Visualizations</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Hover over any paragraph in Griffiths' textbook to see live physics simulations 
            that illustrate the concepts being discussed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Analysis Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-foreground">Live Physics Simulation</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAnimating(!isAnimating)}
            >
              {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{analysisResult}</p>
      </div>

      {/* 3D Visualization */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [5, 5, 5], fov: 60 }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <pointLight position={[-10, -10, -10]} />
          
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="hsl(var(--muted))" />
            </mesh>
          }>
            {renderVisualization()}
          </Suspense>
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
          />
        </Canvas>

        {/* Overlay instructions */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground">
            Click and drag to rotate • Scroll to zoom • Right-click to pan
          </p>
        </div>
      </div>

      {/* Concept Details */}
      {concept && (
        <div className="p-4 border-t border-border bg-card/30 max-h-32 overflow-y-auto">
          <h4 className="text-sm font-medium text-foreground mb-2">Highlighted Concept:</h4>
          <p className="text-xs text-muted-foreground italic">
            "{concept.substring(0, 200)}{concept.length > 200 ? '...' : ''}"
          </p>
        </div>
      )}
    </div>
  );
};