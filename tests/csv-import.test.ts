import { describe, expect, it } from 'vitest';
import { parseCsv, validateProgressionRows } from '@/lib/import/csv';

describe('csv parser e validazione', () => {
  it('parsa intestazioni e righe', () => {
    const csv = `program_block_name,week,day,exercise_name,target_sets,target_reps\nBlocco A,1,1,Squat,4,8-10`;
    const parsed = parseCsv(csv);

    expect(parsed.headers).toEqual([
      'program_block_name',
      'week',
      'day',
      'exercise_name',
      'target_sets',
      'target_reps',
    ]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].exercise_name).toBe('Squat');
  });

  it('riporta errori per campi mancanti e numeri invalidi', () => {
    const { issues, validRows } = validateProgressionRows([
      {
        program_block_name: '',
        week: 'a',
        day: '0',
        exercise_name: '',
        target_sets: '-1',
        target_reps: '',
      },
    ]);

    expect(validRows).toHaveLength(0);
    expect(issues.length).toBeGreaterThanOrEqual(6);
  });
});
