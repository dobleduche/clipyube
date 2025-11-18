import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { getSettingsRequest, saveSettingsRequest } from '../api/client';

export type WatermarkSettings = {
  type: 'text' | 'image';
  text: string;
  font: string;
  fontSize: number;
  color: string;
  opacity: number;
  scale: number;
  position:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'center-left'
    | 'center'
    | 'center-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
};

export interface Settings {
  profileName: string;
  defaultNiche: string;
  twitterHandle: string;
  automationInterval: number; // in milliseconds
  watermarkDefaults: Partial<WatermarkSettings>;
}

const defaultSettings: Settings = {
  profileName: '',
  defaultNiche: 'AI Technology',
  twitterHandle: '',
  automationInterval: 3600000, // 1 hour
  watermarkDefaults: {
    type: 'text',
    text: 'Clip-Yube',
    font: 'Oswald',
    fontSize: 48,
    color: '#ffffff',
    opacity: 0.7,
    scale: 1,
    position: 'bottom-right',
  },
};

interface SettingsContextType {
  settings: Settings;
  isLoaded: boolean;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

// Shallow merge for Settings + deep merge for watermarkDefaults
function mergeSettings(base: Settings, incoming: Partial<Settings>): Settings {
  const merged: Settings = {
    ...base,
    ...incoming,
    watermarkDefaults: {
      ...base.watermarkDefaults,
      ...(incoming.watermarkDefaults || {}),
    },
  };

  // Ensure some sane defaults if backend missed them
  if (!merged.watermarkDefaults.type) merged.watermarkDefaults.type = 'text';
  if (!merged.watermarkDefaults.text) merged.watermarkDefaults.text = 'Clip-Yube';
  if (!merged.watermarkDefaults.font) merged.watermarkDefaults.font = 'Oswald';
  if (!merged.watermarkDefaults.fontSize) merged.watermarkDefaults.fontSize = 48;
  if (!merged.watermarkDefaults.color) merged.watermarkDefaults.color = '#ffffff';
  if (merged.watermarkDefaults.opacity === undefined)
    merged.watermarkDefaults.opacity = 0.7;
  if (merged.watermarkDefaults.scale === undefined)
    merged.watermarkDefaults.scale = 1;
  if (!merged.watermarkDefaults.position)
    merged.watermarkDefaults.position = 'bottom-right';

  return merged;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch initial settings from the backend
  useEffect(() => {
    let cancelled = false;

    const fetchSettings = async () => {
      try {
        const serverSettings = await getSettingsRequest();

        if (cancelled || !serverSettings) return;

        const merged = mergeSettings(defaultSettings, serverSettings);
        setSettings(merged);
      } catch (error) {
        console.error('Failed to fetch settings from server:', error);
        // Fall back to defaultSettings if fetch fails
        setSettings(defaultSettings);
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    };

    fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const debouncedSaveSettings = useDebouncedCallback(
    async (newSettings: Settings) => {
      try {
        await saveSettingsRequest(newSettings);
      } catch (error) {
        console.error('Failed to save settings to server:', error);
      }
    },
    500
  );

  const updateSettings = useCallback(
    (newSettings: Partial<Settings>) => {
      setSettings((prev) => {
        const updated = mergeSettings(prev, newSettings);
        debouncedSaveSettings(updated);
        return updated;
      });
    },
    [debouncedSaveSettings]
  );

  const value: SettingsContextType = { settings, isLoaded, updateSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
