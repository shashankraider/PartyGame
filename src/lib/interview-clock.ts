import type { SessionRow } from './supabase';

export function interviewTime(session: SessionRow, now = Date.now()) {
  const suspect = session.current_interview_suspect_id;
  const anchor = session.interview_clock_anchor ? Date.parse(session.interview_clock_anchor) : now;
  const running = session.status === 'in_progress' && session.current_scene === 'interview';
  const elapsed = running ? Math.max(0, (now - anchor) / 1000) : 0;
  return {
    remaining: Math.max(0, (suspect ? session.interview_clocks?.[suspect] ?? 480 : 480) - elapsed),
    microphone: Math.max(0, (session.microphone_seconds ?? 90) - elapsed),
    waiting: running && anchor > now,
  };
}
export function formatInterviewTime(seconds: number) {
  const value = Math.ceil(Math.max(0, seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
