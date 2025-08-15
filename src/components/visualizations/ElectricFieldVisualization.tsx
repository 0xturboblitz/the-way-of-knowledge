import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface ElectricFieldVisualizationProps {
  isAnimating: boolean;
}

export const ElectricFieldVisualization: React.FC<ElectricFieldVisualizationProps> = ({ 
  isAnimating 
}) => {
  const positiveChargeRef = useRef<THREE.Mesh>(null);
  const negativeChargeRef = useRef<THREE.Mesh>(null);
  const fieldLinesRef = useRef<THREE.Group>(null);

  // Create field lines
  const fieldLines = useMemo(() => {
    const lines = [];
    const numLines = 16;
    
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      const points = [];
      
      // Create curved field lines from positive to negative charge
      for (let t = 0; t <= 1; t += 0.1) {
        const x = -2 + 4 * t + Math.cos(angle) * (1 - t) * 0.5;
        const y = Math.sin(angle) * (1 - t) * 0.5;
        const z = Math.sin(t * Math.PI) * 0.3;
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geometry);
    }
    
    return lines;
  }, []);

  useFrame(({ clock }) => {
    if (!isAnimating) return;
    
    const time = clock.getElapsedTime();
    
    // Animate charges
    if (positiveChargeRef.current) {
      positiveChargeRef.current.position.x = -2 + Math.sin(time * 0.5) * 0.2;
      positiveChargeRef.current.rotation.y = time;
    }
    
    if (negativeChargeRef.current) {
      negativeChargeRef.current.position.x = 2 + Math.cos(time * 0.5) * 0.2;
      negativeChargeRef.current.rotation.y = -time;
    }

    // Animate field lines
    if (fieldLinesRef.current) {
      fieldLinesRef.current.children.forEach((line, index) => {
        if ('material' in line && line.material) {
          const material = line.material as THREE.LineBasicMaterial;
          material.opacity = 0.6 + 0.4 * Math.sin(time + index * 0.5);
        }
      });
    }
  });

  return (
    <group>
      {/* Positive Charge */}
      <mesh ref={positiveChargeRef} position={[-2, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="hsl(var(--physics-danger))" />
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.3}
          color="hsl(var(--physics-danger))"
        >
          +
        </Text>
      </mesh>

      {/* Negative Charge */}
      <mesh ref={negativeChargeRef} position={[2, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="hsl(var(--physics-primary))" />
        <Text
          position={[0, 0.6, 0]}
          fontSize={0.3}
          color="hsl(var(--physics-primary))"
        >
          -
        </Text>
      </mesh>

      {/* Electric Field Lines */}
      <group ref={fieldLinesRef}>
        {fieldLines.map((geometry, index) => (
          <primitive key={index} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
            color: new THREE.Color('hsl(220, 80%, 50%)'),
            transparent: true,
            opacity: 0.6 
          }))} />
        ))}
      </group>

      {/* Field Vectors */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 1.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <group key={i} position={[x, y, 0]}>
            <mesh>
              <coneGeometry args={[0.1, 0.3, 8]} />
              <meshStandardMaterial color="hsl(var(--physics-secondary))" />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
              <meshStandardMaterial color="hsl(var(--physics-secondary))" />
            </mesh>
          </group>
        );
      })}

      {/* Labels */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.4}
        color="hsl(var(--foreground))"
        anchorX="center"
      >
        Electric Field Between Charges
      </Text>
    </group>
  );
};