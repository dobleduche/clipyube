
// server/db/index.ts
// Simple in-memory database for demonstration purposes.

import { type Settings } from '../../types/settings.js';
import { type BlogPost } from '../../types/blog.js';
import { initialBlogPosts } from '../../data/blogData.js';

// Default settings that can be overridden by user
const defaultSettings: Settings = {
    profileName: 'AI Content Creator',
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
    userTier: 'free',
    billing: {
        plan: 'Free Plan',
        nextBillingDate: '',
    },
    newsletter: {
        email: true,
        inApp: true,
    },
};

interface DbData {
  sources: any[];
  discoveries: any[];
  drafts: any[];
  publishes: any[];
  thumbnails: any[];
  blogPosts: BlogPost[];
  // Application State
  automation: {
    isRunning: boolean;
    logs: { timestamp: string; message: string; type: 'info' | 'success' | 'error' }[];
  };
  settings: Settings;
}

const db: DbData = {
  sources: [],
  discoveries: [],
  drafts: [],
  publishes: [],
  thumbnails: [],
  blogPosts: initialBlogPosts,
  automation: {
    isRunning: false,
    logs: [],
  },
  settings: defaultSettings,
};

export const getTable = <T extends keyof DbData>(tableName: T): DbData[T] => {
  return db[tableName];
};

export const addItem = <T extends keyof (Omit<DbData, 'automation' | 'settings'>)>(tableName: T, item: any) => {
  (db[tableName] as any[]).push(item);
  return item;
};

export const findItemById = <T extends keyof DbData>(tableName: T, id: string): any | undefined => {
  return (db[tableName] as any[]).find(item => item.id === id);
};

// FIX: Implement the missing updateItem function.
export const updateItem = <T extends keyof (Omit<DbData, 'automation' | 'settings'>)>(tableName: T, id: string, updatedItem: any) => {
  const table = (db[tableName] as any[]);
  const itemIndex = table.findIndex(item => item.id === id);
  if (itemIndex > -1) {
    table[itemIndex] = updatedItem;
    return updatedItem;
  }
  return undefined;
};

// State management functions
export const getAutomationState = () => db.automation;
export const setAutomationRunning = (isRunning: boolean) => {
  db.automation.isRunning = isRunning;
};
export const addAutomationLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newLog = { timestamp: new Date().toISOString(), message, type };
    db.automation.logs.unshift(newLog); // Add to the top
    if (db.automation.logs.length > 200) { // Keep logs from growing indefinitely
        db.automation.logs.pop();
    }
};

export const getSettings = () => db.settings;
export const updateSettings = (newSettings: Partial<Settings>) => {
    db.settings = { ...db.settings, ...newSettings };
    // In a real app, you might merge nested objects like watermarkDefaults more carefully
    if (newSettings.watermarkDefaults) {
        db.settings.watermarkDefaults = { ...db.settings.watermarkDefaults, ...newSettings.watermarkDefaults };
    }
    return db.settings;
};
