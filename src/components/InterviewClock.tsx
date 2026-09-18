'use client';
import { useEffect, useState } from 'react';
import type { SessionRow } from '@/lib/supabase';
import { interviewTime, formatInterviewTime } from '@/lib/interview-clock';

export function useInterviewClock(session: SessionRow) {
  const [tick, setTick] = useState<{ session: SessionRow; elapsed: number } | null>(null);
  useEffect(() => {
    const start = performance.now();
    const timer = setInterval(() => setTick({ session, elapsed: performance.now() - start }), 250);
    return () => clearInterval(timer);
  }, [session]);
  const observed = Date.parse(session.clock_observed_at ?? session.updated_at);
  return interviewTime(session, observed + (tick?.session === session ? tick.elapsed : 0));
}

export function InterviewClock({ session, multiplayer, onExtend, busy }: {
  session: SessionRow; multiplayer: boolean; onExtend?: () => void; busy?: boolean;
}) {
  const time = useInterviewClock(session);
  if (session.current_scene !== 'interview') return null;
  return <div className="my-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c8a46a]/30 px-4 py-3 text-sm">
    <div><span className="text-[#bcb6a9]">Interview </span><strong className="tabular-nums">{formatInterviewTime(time.remaining)}</strong>
      {multiplayer && time.remaining > 0 ? <span className="ml-4 text-[#bcb6a9]">Microphone <strong className="text-[#e6bd77] tabular-nums">{formatInterviewTime(time.microphone)}</strong></span> : null}
      <p className="mt-1 text-xs text-[#bcb6a9]">{time.remaining <= 0 ? 'Time is up. Switch suspects or ask the host for more time.' : session.status === 'paused' ? 'Paused' : time.waiting ? 'Clocks paused while the suspect answers' : 'Read, discuss, and follow up. Answers pause the clocks.'}</p>
    </div>
    {onExtend ? <button type="button" disabled={busy} onClick={onExtend} className="rounded-full border border-[#c8a46a]/50 px-3 py-2 text-[#e6bd77] disabled:opacity-50">+2 minutes</button> : null}
  </div>;
}
