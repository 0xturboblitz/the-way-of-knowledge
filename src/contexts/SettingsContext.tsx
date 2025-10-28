import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ModelConfig {
  id: string;
  name: string;
  model: string;
  enabled: boolean;
}

export interface SettingsContextType {
  models: ModelConfig[];
  updateModel: (id: string, enabled: boolean) => void;
  getEnabledModels: () => ModelConfig[];
  isMultiModelMode: () => boolean;
}

const defaultModels: ModelConfig[] = [
  { id: "claude-3.5-haiku", name: "Claude 3.5 Haiku", model: "anthropic/claude-3.5-haiku", enabled: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", model: "openai/gpt-4o-mini", enabled: true },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", model: "openai/gpt-4.1-mini", enabled: true },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", model: "google/gemini-2.5-flash", enabled: true },
  { id: "gemini-2.0-flash-001", name: "Gemini 2.0 Flash", model: "google/gemini-2.0-flash-001", enabled: true },
  { id: "grok-code-fast-1", name: "Grok Code Fast", model: "x-ai/grok-code-fast-1", enabled: true },
];

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [models, setModels] = useState<ModelConfig[]>(defaultModels);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('physics-animation-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (Array.isArray(parsed.models)) {
          // Merge saved settings with default models to handle new models
          const mergedModels = defaultModels.map(defaultModel => {
            const savedModel = parsed.models.find((m: ModelConfig) => m.id === defaultModel.id);
            return savedModel ? { ...defaultModel, enabled: savedModel.enabled } : defaultModel;
          });
          setModels(mergedModels);
        }
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      models
    };
    localStorage.setItem('physics-animation-settings', JSON.stringify(settings));
  }, [models]);

  const updateModel = (id: string, enabled: boolean) => {
    setModels(prev => prev.map(model => 
      model.id === id ? { ...model, enabled } : model
    ));
  };

  const getEnabledModels = () => {
    return models.filter(model => model.enabled);
  };

  const isMultiModelMode = () => {
    return getEnabledModels().length > 1;
  };

  const value: SettingsContextType = {
    models,
    updateModel,
    getEnabledModels,
    isMultiModelMode
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
