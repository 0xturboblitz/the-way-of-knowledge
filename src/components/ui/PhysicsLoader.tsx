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
  const containerSizes = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36'
  };

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      {/* Futuristic particle cloud */}
      <div className={cn("relative", containerSizes[size])}>
        
        {/* Central cluster - inner ring */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent rounded-full shadow-sm shadow-accent/50",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(12px, 0px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full shadow-sm shadow-primary/50",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-12px, 0px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/80 rounded-full shadow-sm shadow-accent/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(0px, 12px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/80 rounded-full shadow-sm shadow-primary/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(0px, -12px)' }} />
        </div>

        {/* Middle ring */}
        <div className="absolute inset-0 animate-spin-reverse-slow">
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/70 rounded-full shadow-sm shadow-accent/40",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(20px, 8px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/70 rounded-full shadow-sm shadow-primary/40",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-20px, -8px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/80 rounded-full shadow-sm shadow-muted-foreground/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(8px, -20px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/60 rounded-full shadow-sm shadow-accent/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-8px, 20px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/60 rounded-full shadow-sm shadow-primary/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(16px, -12px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/70 rounded-full shadow-sm shadow-muted-foreground/25",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-16px, 12px)' }} />
        </div>

        {/* Outer floating particles */}
        <div className="absolute inset-0 animate-spin-slower">
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/50 rounded-full shadow-sm shadow-accent/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(28px, 4px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/50 rounded-full shadow-sm shadow-primary/30",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-28px, -4px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/60 rounded-full shadow-sm shadow-muted-foreground/20",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(4px, -28px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/40 rounded-full shadow-sm shadow-accent/25",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-4px, 28px)' }} />
        </div>

        {/* Floating independent particles with different animations */}
        <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '2s' }}>
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/40 rounded-full shadow-sm shadow-accent/20",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(24px, 16px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/40 rounded-full shadow-sm shadow-primary/20",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-24px, -16px)' }} />
        </div>

        <div className="absolute inset-0 animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-muted-foreground/50 rounded-full shadow-sm shadow-muted-foreground/20",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(16px, -24px)' }} />
          <div className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-accent/35 rounded-full shadow-sm shadow-accent/15",
            dotSizes[size]
          )} style={{ transform: 'translate(-50%, -50%) translate(-16px, 24px)' }} />
        </div>

        {/* Subtle expanding rings for depth */}
        <div className="absolute inset-0 animate-ping opacity-5" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full border border-accent/20 rounded-full" />
        </div>
        <div className="absolute inset-2 animate-ping opacity-3" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <div className="w-full h-full border border-primary/15 rounded-full" />
        </div>

        {/* Central glow dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "bg-gradient-to-r from-accent/60 to-primary/60 rounded-full animate-pulse shadow-lg",
            dotSizes[size]
          )} style={{ 
            boxShadow: '0 0 8px rgba(var(--accent), 0.3), 0 0 16px rgba(var(--primary), 0.2)',
            animationDuration: '1.5s'
          }} />
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
