export interface ExecResult<T = any> {
  rows: T[];
  rowsAffected: number;
  lastInsertRowId: number | null;
}

export interface QueryDriver {
  initDb(): Promise<void>;
  close(): void;
  exec<T = any>(sql: string, params?: any[]): Promise<ExecResult<T>>;
  execMany(sql: string, paramList: any[][]): Promise<void>;
  getRawHandle(): unknown;
}
