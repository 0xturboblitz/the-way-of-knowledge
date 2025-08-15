import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface MagneticFieldVisualizationProps {
  isAnimating: boolean;
}

export const MagneticFieldVisualization: React.FC<MagneticFieldVisualizationProps> = ({ 
  isAnimating 
}) => {
  const currentLoopRef = useRef<THREE.Mesh>(null);
  const fieldLinesRef = useRef<THREE.Group>(null);
  const currentParticlesRef = useRef<THREE.Group>(null);

  // Create magnetic field lines around a current loop
  const fieldLines = useMemo(() => {
    const lines = [];
    const numLoops = 8;
    
    for (let i = 0; i < numLoops; i++) {
      const radius = 1 + i * 0.5;
      const points = [];
      
      // Create circular field lines
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.2) {
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = Math.sin(angle * 2) * 0.1 * i; // Slight 3D effect
        points.push(new THREE.Vector3(x, y, z));
      }
      
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      lines.push(geometry);
    }
    
    return lines;
  }, []);

  // Create current flow particles
  const currentParticles = useMemo(() => {
    const particles = [];
    const numParticles = 12;
    
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2;
      particles.push({
        initialAngle: angle,
        radius: 0.8,
      });
    }
    
    return particles;
  }, []);

  useFrame(({ clock }) => {
    if (!isAnimating) return;
    
    const time = clock.getElapsedTime();
    
    // Animate current loop
    if (currentLoopRef.current) {
      currentLoopRef.current.rotation.z = time * 0.2;
    }

    // Animate field lines
    if (fieldLinesRef.current) {
      fieldLinesRef.current.children.forEach((line, index) => {
        if ('material' in line && line.material) {
          const material = line.material as THREE.LineBasicMaterial;
          material.opacity = 0.5 + 0.3 * Math.sin(time * 2 + index * 0.8);
        }
      });
    }

    // Animate current particles
    if (currentParticlesRef.current) {
      currentParticlesRef.current.children.forEach((particle, index) => {
        const data = currentParticles[index];
        const angle = data.initialAngle + time * 2;
        particle.position.x = Math.cos(angle) * data.radius;
        particle.position.y = Math.sin(angle) * data.radius;
      });
    }
  });

  return (
    <group>
      {/* Current Loop */}
      <mesh ref={currentLoopRef}>
        <torusGeometry args={[0.8, 0.1, 8, 24]} />
        <meshStandardMaterial color="hsl(var(--physics-accent))" />
      </mesh>

      {/* Magnetic Field Lines */}
      <group ref={fieldLinesRef}>
        {fieldLines.map((geometry, index) => (
          <primitive key={index} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ 
            color: new THREE.Color('hsl(220, 80%, 50%)'),
            transparent: true,
            opacity: 0.5 
          }))} />
        ))}
      </group>

      {/* Current Flow Particles */}
      <group ref={currentParticlesRef}>
        {currentParticles.map((data, index) => (
          <mesh key={index}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="hsl(var(--physics-danger))" />
          </mesh>
        ))}
      </group>

      {/* Magnetic Field Vectors */}
      {Array.from({ length: 6 }, (_, i) => {
        const z = -1.5 + (i / 5) * 3;
        
        return (
          <group key={i} position={[0, 0, z]}>
            <mesh>
              <coneGeometry args={[0.08, 0.2, 8]} />
              <meshStandardMaterial color="hsl(var(--physics-secondary))" />
            </mesh>
            <mesh position={[0, -0.15, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
              <meshStandardMaterial color="hsl(var(--physics-secondary))" />
            </mesh>
          </group>
        );
      })}

      {/* Current Direction Indicator */}
      <Text
        position={[1.2, 0, 0]}
        fontSize={0.3}
        color="hsl(var(--physics-accent))"
      >
        I
      </Text>

      {/* Labels */}
      <Text
        position={[0, -3, 0]}
        fontSize={0.4}
        color="hsl(var(--foreground))"
        anchorX="center"
      >
        Magnetic Field Around Current Loop
      </Text>
    </group>
  );
};