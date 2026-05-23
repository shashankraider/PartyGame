import type { Case } from "@/engine/types";

export type RoundRobinPlayer = {
  id: string;
  seat_number: number;
  is_observer: boolean;
  name?: string;
};

export type StretchMessage = {
  role: string;
  asked_by_player_id?: string | null;
  suspect_id?: string;
};

/** Default 3 when case.rules.questionsPerDetective is omitted. */
export function getQuestionsPerDetective(caseData: Pick<Case, "rules">): number {
  const value = caseData.rules?.questionsPerDetective;
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) {
    return value;
  }
  return 3;
}

export function listRotatingDetectives(players: RoundRobinPlayer[]): RoundRobinPlayer[] {
  return [...players]
    .filter((player) => !player.is_observer)
    .sort((a, b) => a.seat_number - b.seat_number);
}

/**
 * Picks the next interviewer seat in seat-number order with wrap-around.
 * Observers are excluded. With one detective, returns that detective's id.
 * With zero detectives, returns null.
 */
export function pickNextInterviewer(
  players: RoundRobinPlayer[],
  currentInterviewerId: string | null,
  rotationStepIndex = 1,
): string | null {
  const detectives = listRotatingDetectives(players);
  if (detectives.length === 0) {
    return null;
  }
  if (detectives.length === 1) {
    return detectives[0]!.id;
  }

  const step = Math.max(1, Math.floor(rotationStepIndex));
  const currentIndex = currentInterviewerId
    ? detectives.findIndex((detective) => detective.id === currentInterviewerId)
    : -1;
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (startIndex + step) % detectives.length;
  return detectives[nextIndex]!.id;
}

/**
 * Counts consecutive user questions from the current interviewer at the tail of
 * this suspect's transcript. Resets when another detective's question appears
 * (manual pass / take control) or when the mic auto-rotates.
 */
export function countQuestionsInCurrentStretch(
  messages: StretchMessage[],
  suspectId: string,
  interviewerId: string,
): number {
  const userForSuspect = messages.filter(
    (message) => message.suspect_id === suspectId && message.role === "user",
  );

  let count = 0;
  for (let index = userForSuspect.length - 1; index >= 0; index -= 1) {
    const message = userForSuspect[index]!;
    if (message.asked_by_player_id === interviewerId) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

export function shouldRotateAfterQuestion(
  questionsInStretch: number,
  questionsPerDetective: number,
  detectiveCount: number,
): boolean {
  if (detectiveCount <= 1) {
    return false;
  }
  return questionsInStretch >= questionsPerDetective;
}

export function questionsUntilRotation(
  questionsInStretch: number,
  questionsPerDetective: number,
): number {
  return Math.max(0, questionsPerDetective - questionsInStretch);
}

export function getNextInterviewerName(
  players: RoundRobinPlayer[],
  currentInterviewerId: string,
): string | null {
  const nextId = pickNextInterviewer(players, currentInterviewerId, 1);
  if (!nextId || nextId === currentInterviewerId) {
    return null;
  }
  return players.find((player) => player.id === nextId)?.name ?? null;
}
