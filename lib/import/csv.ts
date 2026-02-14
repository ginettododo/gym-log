import type { CsvProgressionRowInput } from '@/lib/types';

export interface CsvValidationIssue {
  row: number;
  message: string;
}

export interface ParsedCsvResult {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ValidatedProgressionRow {
  rowNumber: number;
  data: CsvProgressionRowInput;
}

export function parseCsv(content: string): ParsedCsvResult {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((header) => header.toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });

  return { headers, rows };
}

export function validateProgressionRows(rows: Record<string, string>[]): {
  validRows: ValidatedProgressionRow[];
  issues: CsvValidationIssue[];
} {
  const validRows: ValidatedProgressionRow[] = [];
  const issues: CsvValidationIssue[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const requiredFields = [
      'program_block_name',
      'week',
      'day',
      'exercise_name',
      'target_sets',
      'target_reps',
    ] as const;

    for (const field of requiredFields) {
      if (!row[field] || row[field].trim().length === 0) {
        issues.push({ row: rowNumber, message: `Campo obbligatorio mancante: ${field}` });
      }
    }

    const week = Number(row.week);
    const day = Number(row.day);
    const targetSets = Number(row.target_sets);

    if (!Number.isInteger(week) || week < 1) {
      issues.push({ row: rowNumber, message: 'week deve essere un intero positivo' });
    }

    if (!Number.isInteger(day) || day < 1) {
      issues.push({ row: rowNumber, message: 'day deve essere un intero positivo' });
    }

    if (!Number.isInteger(targetSets) || targetSets < 1) {
      issues.push({ row: rowNumber, message: 'target_sets deve essere un intero positivo' });
    }

    if (row.target_load && Number.isNaN(Number(row.target_load))) {
      issues.push({ row: rowNumber, message: 'target_load deve essere numerico' });
    }

    if (row.target_rpe && Number.isNaN(Number(row.target_rpe))) {
      issues.push({ row: rowNumber, message: 'target_rpe deve essere numerico' });
    }

    if (!issues.find((issue) => issue.row === rowNumber)) {
      validRows.push({
        rowNumber,
        data: {
          program_block_name: row.program_block_name.trim(),
          week: row.week.trim(),
          day: row.day.trim(),
          exercise_name: row.exercise_name.trim(),
          target_sets: row.target_sets.trim(),
          target_reps: row.target_reps.trim(),
          target_load: row.target_load?.trim(),
          target_rpe: row.target_rpe?.trim(),
          notes: row.notes?.trim(),
        },
      });
    }
  });

  return { validRows, issues };
}
