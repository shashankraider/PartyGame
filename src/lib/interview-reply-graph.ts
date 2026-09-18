import { END, START, StateGraph, StateSchema } from '@langchain/langgraph';
import { z } from 'zod';

// Dependencies are explicit so the control flow can be tested without a provider.
export type ReplyGraphSteps = {
  draft: () => Promise<string>;
  validate: (candidate: string) => Promise<boolean>;
  repair: (candidate: string) => Promise<string>;
  fallback: () => string;
};

const ReplyState = new StateSchema({
  draft: z.string().default(''),
  candidate: z.string().default(''),
  valid: z.boolean().default(false),
  reply: z.string().default(''),
  repairAttempted: z.boolean().default(false),
  trace: z.array(z.string()).default(() => []),
});

/** One draft, at most one repair, and a finite fallback branch. No storage or retries. */
export function createReplyGraph(steps: ReplyGraphSteps) {
  return new StateGraph(ReplyState)
    .addNode('draft_answer', async state => {
      const draft = await steps.draft();
      return { draft, candidate: draft, trace: [...state.trace, 'draft_answer'] };
    })
    .addNode('validate_answer', async state => ({
      valid: await steps.validate(state.candidate), trace: [...state.trace, 'validate_answer'],
    }))
    .addNode('repair_answer', async state => {
      // If the extra repair call fails, use the same deterministic fallback as a rejection.
      let candidate = '';
      try { candidate = await steps.repair(state.candidate); } catch { /* fallback branch */ }
      return { candidate, valid: false, repairAttempted: true, trace: [...state.trace, 'repair_answer'] };
    })
    .addNode('deliver_answer', state => ({ reply: state.candidate, trace: [...state.trace, 'deliver_answer'] }))
    .addNode('fallback_answer', state => ({ reply: steps.fallback(), valid: false, trace: [...state.trace, 'fallback_answer'] }))
    .addEdge(START, 'draft_answer')
    .addEdge('draft_answer', 'validate_answer')
    .addConditionalEdges('validate_answer', state => state.valid ? 'deliver_answer' : state.repairAttempted ? 'fallback_answer' : 'repair_answer', ['deliver_answer', 'fallback_answer', 'repair_answer'])
    .addConditionalEdges('repair_answer', state => state.candidate ? 'validate_answer' : 'fallback_answer', ['validate_answer', 'fallback_answer'])
    .addEdge('deliver_answer', END)
    .addEdge('fallback_answer', END)
    .compile();
}
