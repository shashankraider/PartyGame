import test from 'node:test';
import assert from 'node:assert/strict';
import { interviewTime, formatInterviewTime } from '../src/lib/interview-clock.ts';
const now = Date.parse('2026-09-18T12:00:00Z');
const session = { status: 'in_progress', current_scene: 'interview', current_interview_suspect_id: 'rhea', interview_clocks: { rhea: 480 }, microphone_seconds: 90, interview_clock_anchor: new Date(now).toISOString() };
test('reading and follow-up time counts down; expiry never goes negative', () => {
 assert.equal(interviewTime(session, now + 30000).remaining,450);
 assert.equal(interviewTime(session, now + 30000).microphone,60);
 assert.equal(interviewTime(session, now + 600000).remaining,0);
});
test('AI lease pauses clocks then resumes if the request disappears', () => {
 const waiting = {...session, interview_clock_anchor:new Date(now+120000).toISOString()};
 assert.equal(interviewTime(waiting,now+60000).remaining,480);
 assert.equal(interviewTime(waiting,now+121000).remaining,479);
});
test('host pause, case file reading, and saved suspect budgets', () => {
 assert.equal(interviewTime({...session,status:'paused'},now+600000).remaining,480);
 assert.equal(interviewTime({...session,current_scene:'case_board'},now+600000).remaining,480);
 assert.equal(interviewTime({...session,interview_clocks:{rhea:35}},now+5000).remaining,30);
 assert.equal(formatInterviewTime(89.1),'1:30');
 assert.equal(formatInterviewTime(-3),'0:00');
});
