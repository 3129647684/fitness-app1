import { Platform } from 'react-native';
import { BodyRecord } from '@/database/types';

// 精简后的导出字段：5 个核心指标
const EXPORT_COLUMNS: { key: keyof BodyRecord; label: string }[] = [
  { key: 'record_date', label: 'record_date' },
  { key: 'weight', label: 'weight' },
  { key: 'bmi', label: 'bmi' },
  { key: 'body_fat', label: 'body_fat' },
  { key: 'waist', label: 'waist' },
  { key: 'sleep_duration', label: 'sleep_duration' },
];

export function toCSV<T extends Record<string, any>>(
  rows: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (rows.length === 0 && !columns) return '\uFEFF';
  const keys = columns ? columns.map((c) => c.key as string) : Object.keys(rows[0]);
  const labels = columns ? columns.map((c) => c.label) : keys;

  const escapeField = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = labels.map(escapeField).join(',');
  const dataRows = rows.map((row) => keys.map((key) => escapeField((row as any)[key])).join(','));
  return '\uFEFF' + [headerRow, ...dataRows].join('\n');
}

export function parseCSV<T extends Record<string, any>>(csv: string): T[] {
  const content = csv.replace(/^\uFEFF/, '');
  const result: T[] = [];

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') { current += '"'; i++; continue; }
          inQuotes = false; continue;
        }
        current += char;
      } else {
        if (char === '"') { inQuotes = true; continue; }
        if (char === ',') { fields.push(current); current = ''; continue; }
        current += char;
      }
    }
    fields.push(current);
    return fields;
  };

  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') { currentLine += '""'; i++; }
      else inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      if (currentLine.length > 0) lines.push(currentLine);
      currentLine = '';
    } else currentLine += char;
  }
  if (currentLine.length > 0) lines.push(currentLine);
  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 1 && values[0] === '') continue;
    const row: Record<string, any> = {};
    headers.forEach((header, idx) => { row[header] = values[idx] ?? ''; });
    result.push(row as T);
  }
  return result;
}

const isWeb = Platform.OS === 'web';

export async function exportRecordsCsv(
  rows: BodyRecord[],
  filename: string = 'bodydata-records.csv'
): Promise<void> {
  const csvString = toCSV(rows, EXPORT_COLUMNS);
  if (isWeb) {
    return new Promise<void>((resolve) => {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); resolve(); }, 0);
    });
  } else {
    try {
      const RNFS = require('react-native-fs');
      const Share = require('react-native-share').default;
      const filepath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      await RNFS.writeFile(filepath, csvString, 'utf8');
      await Share.open({ url: `file://${filepath}`, message: '身体数据导出', title: filename });
    } catch (e) { console.warn('[csv] export failed', e); }
  }
}

export async function importRecordsCsv(): Promise<{ rows: BodyRecord[] } | null> {
  if (isWeb) {
    return new Promise<{ rows: BodyRecord[] } | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.csv,text/csv'; input.style.display = 'none';
      document.body.appendChild(input);
      const cleanup = () => { if (input.parentNode) input.parentNode.removeChild(input); };
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) { cleanup(); resolve(null); return; }
        try {
          const text = await file.text();
          const parsed = parseCSV<BodyRecord>(text);
          cleanup(); resolve({ rows: parsed });
        } catch (e) { console.warn('[csv] import parse failed', e); cleanup(); resolve(null); }
      };
      input.click();
    });
  } else {
    try {
      const DocumentPicker = require('react-native-document-picker').default;
      const RNFS = require('react-native-fs');
      const result = await DocumentPicker.pickSingle({ type: [DocumentPicker.types.csv], copyTo: 'documentDirectory' });
      const content = await RNFS.readFile(result.uri, 'utf8');
      return { rows: parseCSV<BodyRecord>(content) };
    } catch (e) { console.warn('[csv] import failed', e); return null; }
  }
}
