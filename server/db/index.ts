// server/db/index.ts
// In-memory DB (persist later if needed)

export interface AutomationLog {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
}

export interface WatermarkSettings {
  type: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  opacity: number;
  position: string;
}

export interface Settings {
  profileName: string;
  defaultNiche: string;
  twitterHandle: string;
  automationInterval: number;
  watermarkDefaults: WatermarkSettings;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
}

// -------------------------------
// Default Settings
// -------------------------------
const defaultSettings: Settings = {
  profileName: "AI Content Creator",
  defaultNiche: "AI Technology",
  twitterHandle: "",
  automationInterval: 3600000,
  watermarkDefaults: {
    type: "text",
    text: "Clip-Yube",
    font: "Oswald",
    fontSize: 48,
    color: "#ffffff",
    opacity: 0.7,
    position: "bottom-right",
  },
};

// -------------------------------
// DB Shape
// -------------------------------
interface DbData {
  sources: any[];
  discoveries: any[];
  drafts: any[];
  publishes: any[];
  thumbnails: any[];
  blogPosts: BlogPost[];
  automation: {
    isRunning: boolean;
    logs: AutomationLog[];
  };
  settings: Settings;
}

const db: DbData = {
  sources: [],
  discoveries: [],
  drafts: [],
  publishes: [],
  thumbnails: [],
  blogPosts: [],
  automation: { isRunning: false, logs: [] },
  settings: defaultSettings,
};

// -------------------------------
// Table Accessors
// -------------------------------
export const getTable = <T extends keyof DbData>(
  tableName: T
): DbData[T] => db[tableName];

export const addItem = <T extends keyof DbData>(
  tableName: T,
  item: any
) => {
  if (Array.isArray(db[tableName])) {
    (db[tableName] as any[]).push(item);
  }
  return item;
};

export const findItemById = (
  tableName: keyof DbData,
  id: string
) => {
  const table = db[tableName];
  if (!Array.isArray(table)) return undefined;
  return table.find((i) => i.id === id);
};

export const updateItem = (
  tableName: keyof DbData,
  id: string,
  updatedItem: any
) => {
  const table = db[tableName];
  if (!Array.isArray(table)) return undefined;

  const idx = table.findIndex((i) => i.id === id);
  if (idx >= 0) {
    table[idx] = updatedItem;
    return updatedItem;
  }

  return undefined;
};

// -------------------------------
// Automation State
// -------------------------------
export const getAutomationState = () => db.automation;

export const setAutomationRunning = (isRunning: boolean) => {
  db.automation.isRunning = isRunning;
};

export const addAutomationLog = (
  message: string,
  type: "info" | "success" | "error" = "info"
) => {
  db.automation.logs.unshift({
    timestamp: new Date().toISOString(),
    message,
    type,
  });

  if (db.automation.logs.length > 200) {
    db.automation.logs.pop();
  }
};

// -------------------------------
// Settings
// -------------------------------
export const getSettings = () => db.settings;

export const updateSettings = (newSettings: Partial<Settings>) => {
  db.settings = {
    ...db.settings,
    ...newSettings,
    watermarkDefaults: {
      ...db.settings.watermarkDefaults,
      ...(newSettings.watermarkDefaults || {}),
    },
  };
  return db.settings;
};
