import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { getSettingsRequest, saveSettingsRequest } from '../api/client';
import { type Settings } from '../types/settings';

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
    userTier: 'free', // Default to free to demonstrate locked features
    billing: {
        plan: 'Free Plan',
        nextBillingDate: '',
    },
    newsletter: {
        email: true,
        inApp: true,
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
                // Merge server settings with defaults to ensure new fields exist
                setSettings(prev => ({ ...prev, ...serverSettings }));
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
            // Deep merge logic for nested objects would be ideal, but simple spread works for now
            // provided we handle nested updates in the update call (e.g. newsletter object)
            let updated = { ...prev, ...newSettings };

            // Handle specific nested updates if passed partially
            if (newSettings.newsletter) {
                updated.newsletter = { ...prev.newsletter, ...newSettings.newsletter };
            }

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
