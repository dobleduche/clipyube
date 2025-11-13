import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type WatermarkSettings = {
    type: 'text' | 'image';
    text: string;
    font: string;
    fontSize: number;
    color: string;
    opacity: number;
    scale: number;
    position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

interface Settings {
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
    updateSettings: (newSettings: Partial<Settings>) => void;
    saveSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_KEY = 'clipyube-user-settings';

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                // Merge saved settings with defaults to ensure new properties are not missing
                return { ...defaultSettings, ...JSON.parse(savedSettings) };
            }
        } catch (e) {
            console.error("Failed to load settings from localStorage", e);
        }
        return defaultSettings;
    });

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const saveSettings = () => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Failed to save settings to localStorage", e);
        }
    };
    
    // Auto-save on change
    useEffect(() => {
        const debounceTimeout = setTimeout(() => {
            saveSettings();
        }, 500);
        return () => clearTimeout(debounceTimeout);
    }, [settings]);


    const value = { settings, updateSettings, saveSettings };

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