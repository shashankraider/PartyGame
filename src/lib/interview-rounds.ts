import type { Case } from '@/engine/types';

/** An answered question counts; opening a suspect card or ordering host help does not. */
export function firstInterviewRound(caseData: Pick<Case, 'suspects' | 'chapters'>, answeredSuspectIds: Iterable<string>) {
  const interviewable = new Set(caseData.chapters.flatMap(c => c.type === 'interview' ? [c.suspectId] : []));
  const answered = new Set(answeredSuspectIds);
  const remaining = caseData.suspects.filter(s => interviewable.has(s.id) && !answered.has(s.id));
  return { answered, remaining };
}

export function firstRoundRecallBlock(
  caseData: Pick<Case, 'suspects' | 'chapters'>,
  session: { current_scene: string; current_interview_suspect_id: string | null },
  suspectId: string,
  answeredSuspectIds: Iterable<string>,
): string | null {
  if (session.current_scene === 'interview' && session.current_interview_suspect_id === suspectId) return null;
  const { answered, remaining } = firstInterviewRound(caseData, answeredSuspectIds);
  if (!answered.has(suspectId) || remaining.length === 0) return null;
  return `Interview every suspect once before calling anyone again. Still waiting: ${remaining.map(s => s.name).join(', ')}.`;
}
