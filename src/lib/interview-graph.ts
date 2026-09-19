import { END, START, StateGraph, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';
import type { Case, Suspect } from '@/engine/types';
import type { InterviewUnlockStateRow, MessageRow, SessionRow } from './supabase';
import { knownRevelations, planUnlocks } from './interview-planner';
import { generateInterviewReply, type ApprovedContext } from './interview-safety';

type InterviewGraphInput = {
  context: {
    caseData: Case; suspect: Suspect;
    session: Pick<SessionRow, 'id' | 'unlocked_evidence'>;
    messages: Pick<MessageRow, 'role' | 'content' | 'presented_evidence_id'>[];
  };
  question: string;
  presentedEvidenceId: string | null;
  states: InterviewUnlockStateRow[];
};
type Plan = Awaited<ReturnType<typeof planUnlocks>>;
type Answer = Awaited<ReturnType<typeof generateInterviewReply>>;

const InterviewState = new StateSchema({
  input: z.custom<InterviewGraphInput>(),
  updates: z.custom<Plan['updates']>().default(() => []),
  presented: z.array(z.string()).default(() => []),
  updatedStates: z.custom<InterviewUnlockStateRow[]>().default(() => []),
  safetyContext: z.custom<ApprovedContext>().optional(),
  newlyRevealed: z.array(z.string()).default(() => []),
  answer: z.custom<Answer>().optional(),
  trace: z.array(z.string()).default(() => []),
});

const interviewGraph = new StateGraph(InterviewState)
  .addNode('evaluate_unlocks', async state => {
    const { context, question, presentedEvidenceId, states } = state.input;
    const { updates, presented } = await planUnlocks(context, question, presentedEvidenceId, states);
    const updatedStates = states.filter(s => !updates.some(u => u.state.suspect_id === s.suspect_id && u.state.condition_id === s.condition_id)).concat(updates.map(u => u.state));
    return { updates, presented: [...presented], updatedStates, trace: [...state.trace, 'evaluate_unlocks'] };
  })
  .addNode('prepare_approved_facts', state => {
    const { caseData, suspect, session } = state.input.context;
    return {
      safetyContext: { caseData, suspect,
        presentedEvidenceIds: state.presented,
        revelations: knownRevelations(caseData, suspect, session, state.updatedStates),
        evidence: caseData.evidence.filter(e => state.presented.includes(e.id)).map(e => `${e.title}: ${e.loreText}`),
      },
      newlyRevealed: state.updates.filter(u => u.outcome.fired && u.condition.subject !== 'evidence').map(u => u.condition.revealedText),
      trace: [...state.trace, 'prepare_approved_facts'],
    };
  })
  .addNode('answer_interview', async state => {
    if (!state.safetyContext) throw new Error('Interview graph has no approved facts');
    const { caseData, messages } = state.input.context;
    const model = caseData.llm?.modelOverride ?? process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
    const answer = await generateInterviewReply({
      context: state.safetyContext, question: state.input.question,
      recentConversation: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
      newlyRevealed: state.newlyRevealed, model,
      validatorModel: caseData.llm?.validatorModelOverride ?? model,
      temperature: caseData.llm?.temperature ?? 0.7,
    });
    return { answer, trace: [...state.trace, ...answer.trace] };
  })
  .addEdge(START, 'evaluate_unlocks')
  .addEdge('evaluate_unlocks', 'prepare_approved_facts')
  .addEdge('prepare_approved_facts', 'answer_interview')
  .addEdge('answer_interview', END)
  .compile();

/** Server-side turn planning only. The caller owns the lease and atomic database commit. */
export async function runInterviewGraph(input: InterviewGraphInput) {
  const state = await interviewGraph.invoke({ input }, { recursionLimit: 12 });
  if (!state.answer) throw new Error('Interview graph finished without an answer');
  // Do not expose graph state (including private case facts) through an API response.
  return { updates: state.updates, updatedStates: state.updatedStates, answer: state.answer, trace: state.trace };
}
