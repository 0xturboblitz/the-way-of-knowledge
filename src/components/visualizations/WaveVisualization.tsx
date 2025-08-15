import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface WaveVisualizationProps {
  isAnimating: boolean;
}

export const WaveVisualization: React.FC<WaveVisualizationProps> = ({ 
  isAnimating 
}) => {
  const electricFieldRef = useRef<THREE.Mesh>(null);
  const magneticFieldRef = useRef<THREE.Mesh>(null);
  const waveGroupRef = useRef<THREE.Group>(null);

  // Create wave geometry
  const waveGeometry = useMemo(() => {
    const points = [];
    const length = 8;
    const segments = 100;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * length - length / 2;
      points.push(new THREE.Vector3(x, 0, 0));
    }
    
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Create wave vectors
  const waveVectors = useMemo(() => {
    const vectors = [];
    const numVectors = 16;
    const length = 8;
    
    for (let i = 0; i < numVectors; i++) {
      const x = (i / (numVectors - 1)) * length - length / 2;
      vectors.push({ x, phase: (i / numVectors) * Math.PI * 2 });
    }
    
    return vectors;
  }, []);

  useFrame(({ clock }) => {
    if (!isAnimating) return;
    
    const time = clock.getElapsedTime();
    
    // Animate the entire wave group
    if (waveGroupRef.current) {
      // Update wave positions
      waveGroupRef.current.children.forEach((child, index) => {
        if (child.name === 'electric-vector') {
          const vectorIndex = Math.floor(index / 2);
          const vector = waveVectors[vectorIndex];
          if (vector) {
            const amplitude = Math.sin(vector.phase + time * 3) * 1.5;
            child.position.y = amplitude;
            child.scale.y = Math.abs(amplitude) + 0.1;
          }
        } else if (child.name === 'magnetic-vector') {
          const vectorIndex = Math.floor((index - 1) / 2);
          const vector = waveVectors[vectorIndex];
          if (vector) {
            const amplitude = Math.cos(vector.phase + time * 3) * 1.5;
            child.position.z = amplitude;
            child.scale.z = Math.abs(amplitude) + 0.1;
          }
        }
      });
    }
  });

  return (
    <group>
      {/* Propagation direction */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 8, 8]} />
        <meshStandardMaterial color="hsl(var(--muted-foreground))" />
      </mesh>
      
      <mesh position={[4.2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="hsl(var(--muted-foreground))" />
      </mesh>

      {/* Wave vectors */}
      <group ref={waveGroupRef}>
        {waveVectors.map((vector, index) => (
          <React.Fragment key={index}>
            {/* Electric field vector (vertical) */}
            <group position={[vector.x, 0, 0]}>
              <mesh name="electric-vector">
                <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
                <meshStandardMaterial color="hsl(var(--physics-danger))" />
              </mesh>
              <mesh position={[0, 0.6, 0]}>
                <coneGeometry args={[0.05, 0.15, 8]} />
                <meshStandardMaterial color="hsl(var(--physics-danger))" />
              </mesh>
            </group>

            {/* Magnetic field vector (horizontal) */}
            <group position={[vector.x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <mesh name="magnetic-vector">
                <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
                <meshStandardMaterial color="hsl(var(--physics-primary))" />
              </mesh>
              <mesh position={[0, 0.6, 0]}>
                <coneGeometry args={[0.05, 0.15, 8]} />
                <meshStandardMaterial color="hsl(var(--physics-primary))" />
              </mesh>
            </group>
          </React.Fragment>
        ))}
      </group>

      {/* Field labels */}
      <Text
        position={[-3, 2, 0]}
        fontSize={0.3}
        color="hsl(var(--physics-danger))"
      >
        E-field
      </Text>

      <Text
        position={[-3, 0, 2]}
        fontSize={0.3}
        color="hsl(var(--physics-primary))"
      >
        B-field
      </Text>

      <Text
        position={[3, 0, -2]}
        fontSize={0.3}
        color="hsl(var(--muted-foreground))"
      >
        k
      </Text>

      {/* Main label */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.4}
        color="hsl(var(--foreground))"
        anchorX="center"
      >
        Electromagnetic Wave Propagation
      </Text>
    </group>
  );
};