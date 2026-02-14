export interface RestTimerState {
  totalSeconds: number;
  remainingSeconds: number;
  running: boolean;
}

export function startTimer(totalSeconds: number): RestTimerState {
  return {
    totalSeconds,
    remainingSeconds: totalSeconds,
    running: true,
  };
}

export function tickTimer(state: RestTimerState): RestTimerState {
  if (!state.running || state.remainingSeconds <= 0) {
    return state;
  }

  const next = state.remainingSeconds - 1;
  return {
    ...state,
    remainingSeconds: next,
    running: next > 0,
  };
}

export function pauseTimer(state: RestTimerState): RestTimerState {
  return { ...state, running: false };
}

export function resetTimer(state: RestTimerState): RestTimerState {
  return {
    ...state,
    remainingSeconds: state.totalSeconds,
    running: false,
  };
}
