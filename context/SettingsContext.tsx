import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
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
    position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
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
        position: 'bottom-right',
    },
};

interface SettingsContextType {
    settings: Settings;
    isLoaded: boolean;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch initial settings from the backend
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const serverSettings = await getSettingsRequest();
                setSettings(serverSettings);
            } catch (error) {
                console.error("Failed to fetch settings from server:", error);
            } finally {
                setIsLoaded(true);
            }
        };
        fetchSettings();
    }, []);
    
    const debouncedSaveSettings = useDebouncedCallback(async (newSettings: Settings) => {
        try {
            await saveSettingsRequest(newSettings);
        } catch (error) {
            console.error("Failed to save settings to server:", error);
        }
    }, 500);

    const updateSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            debouncedSaveSettings(updated);
            return updated;
        });
    }, [debouncedSaveSettings]);

    const value = { settings, isLoaded, updateSettings };

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
