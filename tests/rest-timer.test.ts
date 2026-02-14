import { describe, expect, it } from 'vitest';
import { pauseTimer, resetTimer, startTimer, tickTimer } from '@/lib/rest-timer';

describe('rest timer', () => {
  it('gestisce start/stop/reset', () => {
    const started = startTimer(3);
    expect(started.running).toBe(true);

    const t1 = tickTimer(started);
    expect(t1.remainingSeconds).toBe(2);

    const paused = pauseTimer(t1);
    expect(paused.running).toBe(false);

    const reset = resetTimer(paused);
    expect(reset.running).toBe(false);
    expect(reset.remainingSeconds).toBe(3);
  });
});
