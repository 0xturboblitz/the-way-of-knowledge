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
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const particleSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      {/* Main orbital system */}
      <div className={cn("relative", sizeClasses[size])}>
        {/* Central nucleus */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gradient-to-r from-accent to-primary rounded-full animate-pulse shadow-lg shadow-accent/50" />
        </div>
        
        {/* Orbital rings */}
        <div className="absolute inset-0 border border-accent/40 rounded-full animate-spin-slow" />
        <div className="absolute inset-2 border border-primary/30 rounded-full animate-spin-reverse-slow" />
        <div className="absolute inset-4 border border-muted-foreground/25 rounded-full animate-spin-slower" />
        
        {/* Orbiting electrons */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className={cn(
            "absolute -top-1 left-1/2 transform -translate-x-1/2 bg-accent rounded-full shadow-lg shadow-accent/50",
            particleSizes[size]
          )} />
        </div>
        
        <div className="absolute inset-2 animate-spin-reverse-slow">
          <div className={cn(
            "absolute -top-1 left-1/2 transform -translate-x-1/2 bg-primary rounded-full shadow-lg shadow-primary/40",
            particleSizes[size]
          )} />
        </div>
        
        <div className="absolute inset-4 animate-spin-slower">
          <div className={cn(
            "absolute -top-1 left-1/2 transform -translate-x-1/2 bg-muted-foreground rounded-full shadow-lg shadow-muted-foreground/30",
            particleSizes[size]
          )} />
        </div>
        
        {/* Additional particles for more dynamic effect */}
        <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '0.5s' }}>
          <div className={cn(
            "absolute top-1/2 -right-1 transform -translate-y-1/2 bg-accent/80 rounded-full opacity-70",
            particleSizes[size]
          )} />
        </div>
        
        <div className="absolute inset-2 animate-spin-reverse-slow" style={{ animationDelay: '1s' }}>
          <div className={cn(
            "absolute top-1/2 -right-1 transform -translate-y-1/2 bg-primary/70 rounded-full opacity-70",
            particleSizes[size]
          )} />
        </div>
        
        {/* Electric field lines effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-accent to-transparent transform -translate-x-1/2" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent transform -translate-y-1/2" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-primary/15 to-transparent transform rotate-45" />
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-transparent via-primary/15 to-transparent transform -rotate-45" />
        </div>
        
        {/* Electromagnetic wave ripples */}
        <div className="absolute inset-0 animate-ping-slow opacity-15">
          <div className="w-full h-full border-2 border-accent rounded-full" />
        </div>
        <div className="absolute inset-0 animate-ping-slower opacity-10" style={{ animationDelay: '1s' }}>
          <div className="w-full h-full border-2 border-primary rounded-full" />
        </div>
      </div>
      
      {/* Loading text with physics-themed animation */}
      {/* <div className="mt-6 text-center">
        <p className="text-sm font-medium text-foreground mb-1 animate-pulse">
          {text}
        </p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1 h-1 bg-accent rounded-full animate-bounce" />
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div> */}
    </div>
  );
};
