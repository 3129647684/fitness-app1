import { open } from '@op-engineering/op-sqlite';
import type { QueryDriver, ExecResult } from './dbDriver.interface';
import { runMigrations } from './dbMigrations';

const DB_NAME = 'bodydata.db';

let db: any | null = null;
let initPromise: Promise<void> | null = null;

function getDb(): any {
  if (!db) {
    db = open({ name: DB_NAME });
  }
  return db;
}

const nativeDriver: QueryDriver = {
  async initDb(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const instance = getDb();
      instance.execute('PRAGMA foreign_keys = ON;');
      await runMigrations({
        exec: async <T>(sql: string, params?: any[]): Promise<ExecResult<T>> => {
          const result = instance.execute(sql, params ?? []);
          return {
            rows: (result.rows?._array ?? []) as T[],
            rowsAffected: result.changes ?? 0,
            lastInsertRowId: result.lastInsertRowId ?? null,
          };
        },
      });
    })();
    return initPromise;
  },

  close(): void {
    if (db) {
      db.close();
      db = null;
      initPromise = null;
    }
  },

  async exec<T = any>(sql: string, params?: any[]): Promise<ExecResult<T>> {
    await this.initDb();
    const instance = getDb();
    const result = instance.execute(sql, params ?? []);
    return {
      rows: (result.rows?._array ?? []) as T[],
      rowsAffected: result.changes ?? 0,
      lastInsertRowId: result.lastInsertRowId ?? null,
    };
  },

  async execMany(sql: string, paramList: any[][]): Promise<void> {
    await this.initDb();
    const instance = getDb();
    for (const params of paramList) {
      instance.execute(sql, params);
    }
  },

  getRawHandle(): unknown {
    return db;
  },
};

export default nativeDriver;
