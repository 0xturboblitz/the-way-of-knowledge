import React from 'react';
import { Settings, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { useSettings } from '@/contexts/SettingsContext';

interface SettingsMenuProps {
  className?: string;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ className }) => {
  const { models, updateModel, getEnabledModels, isMultiModelMode } = useSettings();

  const enabledCount = getEnabledModels().length;
  const multiModelMode = isMultiModelMode();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>AI Model Selection</DialogTitle>
          <DialogDescription>
            Choose which AI models to use for generating physics animations.
            {multiModelMode && " Multiple models will run in parallel for comparison."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Info */}
          {multiModelMode && (
            <div className="p-3 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs">
                  {enabledCount} model{enabledCount !== 1 ? 's' : ''} enabled
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare response times and animation quality across different AI models.
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-3">
            <div>
              <Label className="font-medium">Available Models</Label>
              <p className="text-sm text-muted-foreground">
                Select one or more models to generate animations
              </p>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between p-2 rounded-md border bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {model.enabled ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-medium">{model.name}</span>
                    </div>
                  </div>
                  <Switch
                    checked={model.enabled}
                    onCheckedChange={(enabled) => updateModel(model.id, enabled)}
                    disabled={model.enabled && enabledCount === 1}
                  />
                </div>
              ))}
            </div>
                        
            {enabledCount === 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-xs text-red-800 dark:text-red-200">
                  At least one model must be enabled to generate animations.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
