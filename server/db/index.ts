// Simple in-memory database for demonstration purposes.
// In a production environment, this would be replaced with a real database connection (e.g., PostgreSQL, Supabase).

interface DbData {
  sources: any[];
  discoveries: any[];
  drafts: any[];
  publishes: any[];
}

const db: DbData = {
  sources: [],
  discoveries: [],
  drafts: [],
  publishes: [],
};

export const getTable = <T extends keyof DbData>(tableName: T): DbData[T] => {
  return db[tableName];
};

export const addItem = <T extends keyof DbData>(tableName: T, item: any) => {
  db[tableName].push(item);
  return item;
};

export const findItemById = <T extends keyof DbData>(tableName: T, id: string): any | undefined => {
  return (db[tableName] as any[]).find(item => item.id === id);
};
