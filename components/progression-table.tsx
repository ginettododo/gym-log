'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { listExercises } from '@/lib/data/exercises';
import {
  addProgressionActual,
  listProgressionActuals,
  listProgressionRows,
  updateProgressionRow,
} from '@/lib/data/programs';
import type { Exercise, ProgressionActual, ProgressionRow } from '@/lib/types';

interface Props {
  userId: string;
  programBlockId: string;
}

export function ProgressionTable({ userId, programBlockId }: Props) {
  const [rows, setRows] = useState<ProgressionRow[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [actuals, setActuals] = useState<ProgressionActual[]>([]);
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [muscleFilter, setMuscleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'done'>('all');

  const refresh = useCallback(async () => {
    const [nextRows, nextExercises] = await Promise.all([
      listProgressionRows({ userId, programBlockId }),
      listExercises(userId),
    ]);

    setRows(nextRows);
    setExercises(nextExercises);

    const nextActuals = await listProgressionActuals(
      userId,
      nextRows.map((item) => item.id),
    );
    setActuals(nextActuals);
  }, [programBlockId, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const exerciseMap = useMemo(() => new Map(exercises.map((item) => [item.id, item])), [exercises]);
  const actualByRow = useMemo(() => {
    const map = new Map<string, ProgressionActual[]>();
    actuals.forEach((item) => {
      const list = map.get(item.progressionRowId) ?? [];
      list.push(item);
      map.set(item.progressionRowId, list);
    });
    return map;
  }, [actuals]);

  const muscleOptions = useMemo(() => {
    const set = new Set<string>();
    exercises.forEach((item) => item.muscleGroups.forEach((group) => set.add(group)));
    return Array.from(set).sort();
  }, [exercises]);

  const filteredRows = rows.filter((row) => {
    const exercise = exerciseMap.get(row.exerciseId);
    const hasDone = (actualByRow.get(row.id)?.length ?? 0) > 0;

    if (weekFilter !== 'all' && row.week !== Number(weekFilter)) {
      return false;
    }

    if (muscleFilter !== 'all' && !exercise?.muscleGroups.includes(muscleFilter)) {
      return false;
    }

    if (statusFilter === 'done' && !hasDone) {
      return false;
    }

    if (statusFilter === 'planned' && hasDone) {
      return false;
    }

    return true;
  });

  const weeks = Array.from(new Set(rows.map((row) => row.week))).sort((a, b) => a - b);
  const days = Array.from(new Set(filteredRows.map((row) => row.day))).sort((a, b) => a - b);

  return (
    <div className="card">
      <h2>Tabella Progressione</h2>
      <div className="filtersRow">
        <label>
          Settimana
          <select value={weekFilter} onChange={(event) => setWeekFilter(event.target.value)}>
            <option value="all">Tutte</option>
            {weeks.map((week) => (
              <option key={week} value={String(week)}>
                {week}
              </option>
            ))}
          </select>
        </label>
        <label>
          Gruppo muscolare
          <select value={muscleFilter} onChange={(event) => setMuscleFilter(event.target.value)}>
            <option value="all">Tutti</option>
            {muscleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stato
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | 'planned' | 'done')}>
            <option value="all">Tutti</option>
            <option value="planned">Solo pianificati</option>
            <option value="done">Solo completati</option>
          </select>
        </label>
      </div>

      <div className="tableWrap">
        <table className="progressionTable">
          <thead>
            <tr>
              <th>Settimana</th>
              {days.map((day) => (
                <th key={day}>Giorno {day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(new Set(filteredRows.map((row) => row.week)))
              .sort((a, b) => a - b)
              .map((week) => (
                <tr key={week}>
                  <td>{week}</td>
                  {days.map((day) => {
                    const dayRows = filteredRows.filter((row) => row.week === week && row.day === day);
                    return (
                      <td key={`${week}-${day}`}>
                        {dayRows.length === 0 && <span className="muted">-</span>}
                        {dayRows.map((row) => {
                          const exercise = exerciseMap.get(row.exerciseId);
                          const doneCount = actualByRow.get(row.id)?.length ?? 0;
                          return (
                            <div className="cellCard" key={row.id}>
                              <strong>{exercise?.name ?? 'Esercizio'}</strong>
                              <label>
                                Set
                                <input
                                  value={row.targetSets}
                                  onChange={(event) =>
                                    void updateProgressionRow({
                                      id: row.id,
                                      userId,
                                      targetSets: Number(event.target.value || '0'),
                                    }).then(refresh)
                                  }
                                />
                              </label>
                              <label>
                                Ripetizioni
                                <input
                                  value={row.targetReps}
                                  onChange={(event) =>
                                    void updateProgressionRow({
                                      id: row.id,
                                      userId,
                                      targetReps: event.target.value,
                                    }).then(refresh)
                                  }
                                />
                              </label>
                              <button
                                onClick={async () => {
                                  await addProgressionActual({
                                    userId,
                                    progressionRowId: row.id,
                                    date: new Date().toISOString(),
                                    actualReps: Number(row.targetReps.split('-')[0]) || undefined,
                                    actualWeight: row.targetLoad,
                                    actualRpe: row.targetRpe,
                                  });
                                  await refresh();
                                }}
                              >
                                Segna completato
                              </button>
                              <small>Completamenti: {doneCount}</small>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
