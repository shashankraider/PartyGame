import type { Case, Chapter, Evidence, Round, Suspect, Beat } from "@/engine/types";
import type { SessionRow } from "./supabase";

export type PublicSuspect = Pick<Suspect, "id" | "name" | "shortDescription" | "portraitUrl">;
export type PublicEvidence = Pick<Evidence, "id" | "title" | "category" | "description" | "loreText" | "revealedInRound" | "relatesToSuspectIds" | "printableHtml">;
export type PublicRound = Pick<Round, "number" | "title" | "introNarration">;
export type PublicCase = Pick<Case, "id" | "meta" | "rules"> & {
  sessionId: string;
  victim: { name: string; portraitUrl?: string; publicBackground?: string };
  sceneLocation?: { name: string; imageUrl?: string };
  suspects: PublicSuspect[];
  evidence: PublicEvidence[];
  chapters: Chapter[];
  rounds: PublicRound[];
  ending: Beat[];
  solutionLocations?: { id: string; name: string; imageUrl?: string }[];
  solution?: Pick<Case["solution"], "killerSuspectIds" | "killerRoles" | "timeline"> & { revealNarration: Beat[] };
};

/** Allowlist projection: adding private case fields can never expose them by default. */
export function toPublicCase(source: Case, session: SessionRow): PublicCase {
  const unlocked = new Set(session.unlocked_evidence);
  const activeChapter = source.chapters.find(chapter => chapter.id === session.current_chapter_id);
  const locationId = activeChapter && "locationId" in activeChapter ? activeChapter.locationId : undefined;
  const location = session.status !== "lobby" && locationId ? source.locations.find(item => item.id === locationId) : undefined;
  const chapters: Chapter[] = source.chapters.flatMap((chapter): Chapter[] => {
    const active = chapter.id === session.current_chapter_id;
    const base = { id: chapter.id, title: chapter.title, roundNumber: chapter.roundNumber };
    if (chapter.type === "interview" && (session.phase === "interrogation" || active)) {
      return [{ ...base, type: "interview", suspectId: chapter.suspectId,
        intro: active ? chapter.intro : undefined,
        presentableEvidence: chapter.presentableEvidence?.filter(id => unlocked.has(id)) }];
    }
    if (!active) return [];
    switch (chapter.type) {
      case "narrative": return [{ ...base, type: "narrative", beats: chapter.beats }];
      case "evidence-reveal": return [{ ...base, type: "evidence-reveal", narration: chapter.narration, evidenceIds: chapter.evidenceIds.filter(id => unlocked.has(id)) as [string, ...string[]] }];
      case "phone-hack": return [{ ...base, type: "phone-hack", phoneOwner: chapter.phoneOwner, intro: chapter.intro, messages: chapter.messages, callLog: chapter.callLog, notes: chapter.notes }];
      case "accusation": return [{ ...base, type: "accusation", promptText: chapter.promptText, narration: chapter.narration }];
      case "reveal": return [{ ...base, type: "reveal" }];
      default: return [];
    }
  });
  const ending: Beat[] = [];
  const path = source.endgame.paths.find(p => p.id === session.endgame_path_id);
  if (session.phase === "reveal" && path) {
    ending.push({ speaker: source.suspects.find(s => s.id === path.triggerSuspectId)?.name ?? "Suspect", text: path.scriptedSuspectLine });
    if ((session.reveal_step ?? 0) >= 1) ending.push({ speaker: source.suspects.find(s => s.id === path.followUpSuspectId)?.name ?? "Suspect", text: path.followUpScriptedLine ?? "" });
  }
  const revealed = session.phase === "reveal" && (session.reveal_step ?? 0) >= 2;
  return {
    id: source.id, sessionId: session.id, meta: source.meta,
    rules: source.rules ? { questionsPerDetective: source.rules.questionsPerDetective } : undefined,
    victim: { name: source.victim.name, ...(session.status !== "lobby" ? {
      portraitUrl: source.victim.portraitUrl, publicBackground: source.victim.publicBackground,
    } : {}) },
    ...(location ? { sceneLocation: { name: location.name, imageUrl: location.imageUrl } } : {}),
    suspects: source.suspects.map(({ id, name, shortDescription, portraitUrl }) => ({ id, name, shortDescription, portraitUrl })),
    evidence: source.evidence.filter(e => unlocked.has(e.id)).map(({ id, title, category, description, loreText, revealedInRound, relatesToSuspectIds, printableHtml }) => ({ id, title, category, description, loreText, revealedInRound, relatesToSuspectIds, printableHtml })),
    chapters,
    rounds: source.rounds.map(r => ({ number: r.number, title: r.number === 1 ? r.title : `Round ${r.number}`, introNarration: r.number === 1 && session.status !== "lobby" ? r.introNarration : undefined })),
    ending,
    ...(revealed ? { solutionLocations: source.locations.map(({id, name, imageUrl}) => ({id, name, imageUrl})), solution: { timeline: source.solution.timeline, killerSuspectIds: source.solution.killerSuspectIds, killerRoles: source.solution.killerRoles, revealNarration: source.endgame.finalRevealNarration ?? source.solution.revealNarration } } : {}),
  };
}
