import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDB, getRecords, getUserProfile, getAllTags } from '@/database/db';
import { BodyRecord } from '@/database/types';
import { getTodayString } from './date';

const RECORD_FIELDS: (keyof BodyRecord)[] = [
  'record_date', 'weight', 'body_fat', 'muscle_mass', 'water_rate', 'bmr', 'bmi',
  'chest', 'waist', 'hip', 'upper_arm', 'thigh', 'calf',
  'neck', 'heart_rate', 'steps', 'water_intake', 'body_temperature', 'mood',
  'sleep_duration', 'sleep_score', 'is_menstrual', 'menstrual_day',
  'exercise_type', 'exercise_duration', 'exercise_note', 'body_status', 'remark',
  'food_list', 'sport_list'
];

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportToCSV(): Promise<string> {
  const records = await getRecords();
  const profile = await getUserProfile();
  const tags = await getAllTags();

  const header = RECORD_FIELDS.join(',');
  const rows = records.map(r => {
    return RECORD_FIELDS.map(f => escapeCSV((r as any)[f])).join(',');
  });

  const profileSection = `# 用户档案\n# 身高,${profile?.height ?? ''}\n# 性别,${profile?.gender ?? ''}\n# 年龄,${profile?.age ?? ''}\n# 目标体重,${profile?.target_weight ?? ''}\n# 目标腰围,${profile?.target_waist ?? ''}\n`;
  const tagsSection = `# 标签\n${tags.map(t => `#${t.tag_name}`).join('\n')}\n`;
  const csv = `${profileSection}\n${tagsSection}\n${header}\n${rows.join('\n')}\n`;

  const fileName = `bodydata_backup_${getTodayString()}.csv`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(filePath, '\uFEFF' + csv, { encoding: FileSystem.EncodingType.UTF8 });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'text/csv',
      dialogTitle: '导出身体数据备份',
    });
  }

  return filePath;
}

export async function importFromCSV(fileUri: string): Promise<{ imported: number; skipped: number }> {
  const content = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
  const lines = content.replace(/^\uFEFF/, '').split('\n');

  let imported = 0;
  let skipped = 0;
  let dataStarted = false;

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    if (line.trim() === '') continue;
    if (!dataStarted) {
      if (line.startsWith('record_date')) {
        dataStarted = true;
      }
      continue;
    }

    const values = parseCSVLine(line);
    if (values.length < RECORD_FIELDS.length) {
      skipped++;
      continue;
    }

    const record: Partial<BodyRecord> = {};
    RECORD_FIELDS.forEach((field, i) => {
      const val = values[i]?.trim();
      if (val === '' || val === undefined) {
        (record as any)[field] = null;
      } else if (field === 'record_date' || field === 'exercise_type' || field === 'exercise_note' || field === 'body_status' || field === 'remark') {
        (record as any)[field] = val;
      } else if (field === 'is_menstrual' || field === 'sleep_score' || field === 'exercise_duration' || field === 'menstrual_day' || field === 'heart_rate' || field === 'steps' || field === 'mood') {
        (record as any)[field] = parseInt(val, 10) || 0;
      } else {
        (record as any)[field] = parseFloat(val) || null;
      }
    });

    if (!record.record_date) {
      skipped++;
      continue;
    }

    try {
      const db = await getDB();
      const existing = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM body_record WHERE record_date = ?',
        record.record_date
      );
      if (existing) {
        skipped++;
      } else {
        await db.runAsync(
          `INSERT INTO body_record (${RECORD_FIELDS.join(', ')}) VALUES (${RECORD_FIELDS.map(() => '?').join(', ')})`,
          ...RECORD_FIELDS.map(f => (record as any)[f] ?? null)
        );
        imported++;
      }
    } catch (e) {
      skipped++;
    }
  }

  return { imported, skipped };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
