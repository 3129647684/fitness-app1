import { Platform } from 'react-native';
import { BodyRecord } from '@/database/types';

export function toCSV<T extends Record<string, any>>(
  rows: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (rows.length === 0 && !columns) {
    return '\uFEFF';
  }

  const keys = columns
    ? columns.map((c) => c.key as string)
    : Object.keys(rows[0]);
  const labels = columns
    ? columns.map((c) => c.label)
    : keys;

  const escapeField = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = labels.map(escapeField).join(',');
  const dataRows = rows.map((row) =>
    keys.map((key) => escapeField((row as any)[key])).join(',')
  );

  return '\uFEFF' + [headerRow, ...dataRows].join('\n');
}

export function parseCSV<T extends Record<string, any>>(csv: string): T[] {
  const content = csv.replace(/^\uFEFF/, '');
  const result: T[] = [];

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          current += char;
          i++;
          continue;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
          continue;
        } else if (char === ',') {
          fields.push(current);
          current = '';
          i++;
          continue;
        } else {
          current += char;
          i++;
          continue;
        }
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
      if (inQuotes && content[i + 1] === '"') {
        currentLine += '""';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') {
        i++;
      }
      if (currentLine.length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const headers = parseLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    if (values.length === 1 && values[0] === '') continue;
    const row: Record<string, any> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    result.push(row as T);
  }

  return result;
}

const isWeb = Platform.OS === 'web';

export async function exportRecordsCsv(
  rows: BodyRecord[],
  filename: string = 'bodydata-records.csv'
): Promise<void> {
  const columns: { key: keyof BodyRecord; label: string }[] = [
    { key: 'record_date', label: 'record_date' },
    { key: 'weight', label: 'weight' },
    { key: 'body_fat', label: 'body_fat' },
    { key: 'muscle_mass', label: 'muscle_mass' },
    { key: 'water_rate', label: 'water_rate' },
    { key: 'bmr', label: 'bmr' },
    { key: 'bmi', label: 'bmi' },
    { key: 'chest', label: 'chest' },
    { key: 'waist', label: 'waist' },
    { key: 'hip', label: 'hip' },
    { key: 'upper_arm', label: 'upper_arm' },
    { key: 'thigh', label: 'thigh' },
    { key: 'calf', label: 'calf' },
    { key: 'neck', label: 'neck' },
    { key: 'heart_rate', label: 'heart_rate' },
    { key: 'steps', label: 'steps' },
    { key: 'water_intake', label: 'water_intake' },
    { key: 'body_temperature', label: 'body_temperature' },
    { key: 'mood', label: 'mood' },
    { key: 'sleep_duration', label: 'sleep_duration' },
    { key: 'sleep_score', label: 'sleep_score' },
    { key: 'is_menstrual', label: 'is_menstrual' },
    { key: 'menstrual_day', label: 'menstrual_day' },
    { key: 'exercise_type', label: 'exercise_type' },
    { key: 'exercise_duration', label: 'exercise_duration' },
    { key: 'exercise_note', label: 'exercise_note' },
    { key: 'body_status', label: 'body_status' },
    { key: 'remark', label: 'remark' },
    { key: 'food_list', label: 'food_list' },
    { key: 'sport_list', label: 'sport_list' },
  ];

  const csvString = toCSV(rows, columns);

  if (isWeb) {
    return new Promise<void>((resolve) => {
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      }, 0);
    });
  } else {
    try {
      const RNFS = require('react-native-fs');
      const Share = require('react-native-share').default;
      const filepath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      await RNFS.writeFile(filepath, csvString, 'utf8');
      await Share.open({
        url: `file://${filepath}`,
        message: '身体数据导出',
        title: filename,
      });
    } catch (e) {
      console.warn('[csv] exportRecordsCsv native failed', e);
    }
  }
}

export async function importRecordsCsv(): Promise<{ rows: BodyRecord[] } | null> {
  if (isWeb) {
    return new Promise<{ rows: BodyRecord[] } | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,text/csv';
      input.style.display = 'none';
      document.body.appendChild(input);

      const cleanup = () => {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      };

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          resolve(null);
          return;
        }
        try {
          const text = await file.text();
          const parsed = parseCSV<BodyRecord>(text);
          cleanup();
          resolve({ rows: parsed });
        } catch (e) {
          console.warn('[csv] importRecordsCsv web parse failed', e);
          cleanup();
          resolve(null);
        }
      };

      input.click();
    });
  } else {
    try {
      const DocumentPicker = require('react-native-document-picker').default;
      const RNFS = require('react-native-fs');
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.csv],
        copyTo: 'documentDirectory',
      });
      const uri = result.uri;
      const content = await RNFS.readFile(uri, 'utf8');
      const parsed = parseCSV<BodyRecord>(content);
      return { rows: parsed };
    } catch (e) {
      console.warn('[csv] importRecordsCsv native failed', e);
      return null;
    }
  }
}

export async function exportRecordsJson(
  snapshot: any,
  filename: string = 'bodydata-snapshot.json'
): Promise<void> {
  const jsonString = JSON.stringify(snapshot, null, 2);

  if (isWeb) {
    return new Promise<void>((resolve) => {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        resolve();
      }, 0);
    });
  } else {
    try {
      const RNFS = require('react-native-fs');
      const Share = require('react-native-share').default;
      const filepath = `${RNFS.DocumentDirectoryPath}/${filename}`;
      await RNFS.writeFile(filepath, jsonString, 'utf8');
      await Share.open({
        url: `file://${filepath}`,
        message: '身体数据 JSON 快照导出',
        title: filename,
      });
    } catch (e) {
      console.warn('[csv] exportRecordsJson native failed', e);
    }
  }
}
