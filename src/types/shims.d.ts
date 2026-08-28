// 模块类型声明文件 - 用于解决缺少类型定义的第三方模块
declare module 'react-native-linear-gradient' {
  import { Component } from 'react';
  import { ViewProps, StyleProp, ViewStyle } from 'react-native';
  interface LinearGradientProps extends ViewProps {
    colors: string[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    locations?: number[];
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
  }
  export default class LinearGradient extends Component<LinearGradientProps> {}
}

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps, StyleProp, TextStyle } from 'react-native';
  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }
  export default class Icon extends Component<IconProps> {}
  export function createIconSet(glyphMap: any, fontFamily: string, fontFile: string): any;
}

declare module '@op-engineering/op-sqlite' {
  export interface SQLiteDatabase {
    execute(sql: string, params?: any[]): any;
    executeAsync(sql: string, params?: any[]): Promise<any>;
    close(): void;
  }
  export function open(options: { name: string }): SQLiteDatabase;
  export function close(db: SQLiteDatabase): void;
}

// zustand 类型使用宽松的 any 声明，避免复杂的泛型推断导致类型错误
declare module 'zustand' {
  export function create<T extends object = any>(stateCreator?: any): any;
  export type StoreApi<T = any> = any;
  export type UseBoundStore<S = any> = any;
}

declare module 'zustand/middleware' {
  export function persist<T extends object = any>(config: any, options: any): any;
  export function createJSONStorage(getStorage: () => any): any;
  export type StateStorage = any;
  export type StateCreator<T = any> = any;
}

declare module 'zustand/vanilla' {
  export interface StoreApi<T extends object = any> {
    setState: any;
    getState: () => T;
    subscribe: any;
    getInitialState: () => T;
  }
  export type UseBoundStore<S extends StoreApi<any>> = any;
  export function createStore<T extends object = any>(stateCreator: any): StoreApi<T>;
}

declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }
  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }
  export interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    getAsObject(): any;
    get(params?: any[]): any[];
    free(): boolean;
  }
  export interface QueryExecResult {
    columns: string[];
    values: any[][];
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
  export function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
