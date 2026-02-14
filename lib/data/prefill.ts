'use client';

import { db } from '@/lib/offline/db';
import { createClient } from '@/lib/supabase/browser';

export interface LastTimeSummary {
  lastSessionDate?: string;
  weight?: number;
  reps?: number;
  text: string;
}

function buildSummary(input: { lastSessionDate?: string; weight?: number; reps?: number }): LastTimeSummary {
  if (!input.lastSessionDate) {
    return { text: 'Nessun dato precedente' };
  }

  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(input.lastSessionDate));

  const text = input.weight && input.reps
    ? `Ultima volta (${formattedDate}): ${input.weight} kg x ${input.reps}`
    : `Ultima volta (${formattedDate})`;

  return {
    lastSessionDate: input.lastSessionDate,
    weight: input.weight,
    reps: input.reps,
    text,
  };
}

export async function getExerciseLastTime(input: {
  userId: string;
  exerciseId: string;
}): Promise<LastTimeSummary> {
  const localRows = await db.workoutExerciseDrafts.where('exerciseId').equals(input.exerciseId).toArray();
  const owned = localRows.filter((item) => item.userId === input.userId);

  if (owned.length > 0) {
    const latest = owned.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const session = await db.workoutSessionDrafts.get(latest.sessionId);
    const sets = await db.setEntryDrafts.where('workoutExerciseId').equals(latest.id).toArray();
    const working = sets.filter((set) => set.setType === 'working' && (set.weight || set.reps));
    const lastSet = working.at(-1);

    if (session) {
      return buildSummary({
        lastSessionDate: session.startedAt,
        weight: lastSet?.weight,
        reps: lastSet?.reps,
      });
    }
  }

  if (navigator.onLine) {
    const supabase = createClient();
    const { data } = await supabase
      .from('workout_exercises')
      .select('id,session_id,workout_sessions!inner(started_at),set_entries(weight,reps,set_type,created_at)')
      .eq('user_id', input.userId)
      .eq('exercise_id', input.exerciseId)
      .order('created_at', { foreignTable: 'set_entries', ascending: true })
      .limit(1);

    const first = data?.[0] as
      | {
          workout_sessions: { started_at: string };
          set_entries: Array<{ weight: number | null; reps: number | null; set_type: string }>;
        }
      | undefined;

    if (first) {
      const working = first.set_entries.filter((item) => item.set_type === 'working');
      const last = working.at(-1);
      return buildSummary({
        lastSessionDate: first.workout_sessions.started_at,
        weight: last?.weight ?? undefined,
        reps: last?.reps ?? undefined,
      });
    }
  }

  return buildSummary({});
}
