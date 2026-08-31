import type { SqlJsStatic, Database as SqlDb } from 'sql.js';
// sql.js 为 UMD 模块，webpack 5 对其静态分析失败（module has no exports），
// import * as 拿不到命名导出；require 在运行时直接返回真实 module.exports。
// 本文件仅在 web 分支被引用（webpack 环境 require 恒可用），native 分支不受影响。
const sqlJsModule: any =
  (typeof require === 'function' ? require('sql.js') : undefined) ?? {};
// sql.js CJS: module.exports = initSqlJs 函数本身（自引用 .default），三种形态都兜底
const initSqlJs: any =
  typeof sqlJsModule === 'function'
    ? sqlJsModule
    : sqlJsModule.initSqlJs ?? sqlJsModule.default ?? sqlJsModule;
import type { QueryDriver, ExecResult } from './dbDriver.interface';
import { runMigrations } from './dbMigrations';
// TODO: 类型补全：FileSystemSyncAccessHandle 是现代浏览器 WICG OPFS 的 API，DOM lib 未内置
type FSAccessHandle = any;
const DB_FILENAME = 'bodydata.db';
const WRITE_OPS = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|TRUNCATE|BEGIN|COMMIT|ROLLBACK)\b/i;
let SQL: SqlJsStatic | null = null;
let db: SqlDb | null = null;
let accessHandle: FSAccessHandle | null = null;
let initPromise: Promise<void> | null = null;
function isWriteOp(sql: string): boolean {
  return WRITE_OPS.test(sql);
}
async function readFromOPFS(): Promise<Uint8Array> {
  if (!accessHandle) return new Uint8Array(0);
  const size = accessHandle.getSize();
  if (size === 0) return new Uint8Array(0);
  const buf = new Uint8Array(size);
  accessHandle.read(buf, { at: 0 });
  return buf;
}
async function flushToOPFS(): Promise<void> {
  if (!accessHandle || !db) return;
  const data = db.export();
  accessHandle.seek(0);
  accessHandle.write(data, { at: 0 });
  accessHandle.truncate(data.length);
  accessHandle.flush();
}
const webDriver: QueryDriver = {
  async initDb(): Promise<void> {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      if (!SQL) {
        SQL = (await initSqlJs({
          // browser 版 JS 硬编码引用 sql-wasm-browser.wasm，与通用 wasm 内容一致，归一化到已复制的文件
          locateFile: (f: string) => "/" + f.replace(/^sql-wasm-browser\.wasm$/, "sql-wasm.wasm"),
        })) as SqlJsStatic;
      }
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory) {
        try {
          const root = await navigator.storage.getDirectory();
          const fileHandle = await (root as any).getFileHandle(DB_FILENAME, { create: true });
          accessHandle = await (fileHandle as any).createSyncAccessHandle();
        } catch (e) {
          console.warn('[db:web] OPFS access handle unavailable, fallback to in-memory only', e);
          accessHandle = null;
        }
      }
      const existingData = await readFromOPFS();
      db = existingData.length > 0 ? new (SQL as SqlJsStatic).Database(existingData) : new (SQL as SqlJsStatic).Database();
      db.run('PRAGMA foreign_keys = ON;');
      await runMigrations({
        exec: async <T>(sql: string, params?: any[]): Promise<ExecResult<T>> => {
          const rows: T[] = [];
          if (params && params.length > 0) {
            const stmt = db!.prepare(sql);
            stmt.bind(params ?? []);
            while (stmt.step()) {
              rows.push(stmt.getAsObject() as T);
            }
            stmt.free();
          } else {
            // 多语句（migration 拼接 SQL）走 exec；sql.js 的 prepare 仅支持单条
            const results = (db as any).exec(sql);
            for (const r of results) {
              for (const v of r.values) {
                rows.push(Object.fromEntries(r.columns.map((c: any, idx: number) => [c, v[idx]])) as T);
              }
            }
          }
          const changes = (db as any)?.getRowsModified?.() ?? 0;
          const lastId = (db as any)?.exec?.('SELECT last_insert_rowid() AS id')?.[0]?.values?.[0]?.[0] ?? null;
          return {
            rows,
            rowsAffected: changes,
            lastInsertRowId: lastId != null ? Number(lastId) : null,
          };
        },
      });
      await flushToOPFS();
    })();
    return initPromise;
  },
  close(): void {
    if (db) {
      db.close();
      db = null;
    }
    if (accessHandle) {
      try { accessHandle.close(); } catch { /* 忽略关闭错误 */ }
      accessHandle = null;
    }
    initPromise = null;
  },
  async exec<T = any>(sql: string, params?: any[]): Promise<ExecResult<T>> {
    await this.initDb();
    if (!db || !SQL) {
      throw new Error('[db:web] Database not initialized');
    }
    // sql.js 的 prepare 仅支持单条语句；migration 使用多语句拼接，无参数时走 db.exec（支持多语句）
    const rows: T[] = [];
    if (params && params.length > 0) {
      const stmt = db.prepare(sql);
      stmt.bind(params ?? []);
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as T);
      }
      stmt.free();
    } else {
      const results = db.exec(sql);
      for (const r of results) {
        for (const v of r.values) {
          rows.push(Object.fromEntries(r.columns.map((c, idx) => [c, v[idx]])) as T);
        }
      }
    }
    const changes = (db as any)?.getRowsModified?.() ?? 0;
    let lastId: number | null = null;
    if (isWriteOp(sql)) {
      try {
        const idRes = db.exec('SELECT last_insert_rowid() AS id');
        if (idRes && idRes[0] && idRes[0].values && idRes[0].values[0]) {
          lastId = Number(idRes[0].values[0][0]);
        }
      } catch { /* 忽略 last_insert_rowid 查询错误 */ }
    }
    if (isWriteOp(sql)) {
      await flushToOPFS();
    }
    return {
      rows,
      rowsAffected: changes,
      lastInsertRowId: lastId,
    };
  },
  async execMany(sql: string, paramList: any[][]): Promise<void> {
    await this.initDb();
    if (!db) throw new Error('[db:web] Database not initialized');
    for (const params of paramList) {
      db.run(sql, params);
    }
    if (isWriteOp(sql)) {
      await flushToOPFS();
    }
  },
  getRawHandle(): unknown {
    return db;
  },
};
export default webDriver;
