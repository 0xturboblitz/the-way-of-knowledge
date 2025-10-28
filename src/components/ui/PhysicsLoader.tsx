import React from 'react';
import { cn } from '@/lib/utils';

interface PhysicsLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const PhysicsLoader: React.FC<PhysicsLoaderProps> = ({ 
  className, 
  size = 'md',
  text = 'Generating animation...'
}) => {
  const loaderSizes = {
    sm: { width: '45px', height: '19px' },
    md: { width: '60px', height: '25px' },
    lg: { width: '75px', height: '31px' }
  };

  const borderWidths = {
    sm: '1.5px',
    md: '2px',
    lg: '2.5px'
  };

  const loaderStyle = {
    width: loaderSizes[size].width,
    height: loaderSizes[size].height,
    border: `${borderWidths[size]} solid`,
    borderColor: 'hsl(var(--accent))',
    boxSizing: 'border-box' as const,
    borderRadius: '50%',
    display: 'grid',
    animation: 'physicsLoader 2s infinite linear',
    position: 'relative' as const,
  };

  const pseudoElementStyle = {
    content: '""',
    gridArea: '1/1',
    border: 'inherit',
    borderRadius: '50%',
    animation: 'inherit',
    animationDuration: '3s',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      <style>
        {`
          @keyframes physicsLoader {
            100% { transform: rotate(1turn); }
          }
          @keyframes physicsLoaderReverse {
            100% { transform: rotate(-1turn); }
          }
        `}
      </style>
      
      <div style={loaderStyle}>
        {/* First pseudo-element (clockwise) */}
        <div 
          style={{
            ...pseudoElementStyle,
            borderColor: 'hsl(var(--primary))',
          }}
        />
        {/* Second pseudo-element (counter-clockwise) */}
        <div 
          style={{
            ...pseudoElementStyle,
            borderColor: 'hsl(var(--muted-foreground))',
            animation: 'physicsLoaderReverse 3s infinite linear',
          }}
        />
      </div>
    </div>
  );
};
