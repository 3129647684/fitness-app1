import type { QueryDriver } from './dbDriver.interface';

const dummyDriver: QueryDriver = {
  async initDb(): Promise<void> {
    throw new Error('Fallback driver: platform driver not loaded. Check metro/webpack platform extensions (.native/.web).');
  },
  close(): void {},
  async exec(): Promise<any> {
    throw new Error('Fallback driver: platform driver not loaded.');
  },
  async execMany(): Promise<void> {
    throw new Error('Fallback driver: platform driver not loaded.');
  },
  getRawHandle(): unknown {
    return null;
  },
};

export default dummyDriver;
