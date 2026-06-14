/**
 * Phase 2j (Swing #1) — Briefing beat enumeration.
 *
 * Pure helpers shared between the engine (advanceSessionBeat, chapter-vs-beat
 * routing) and the TV renderer (BriefingBeatPlayer).
 *
 * Beat enumeration rules:
 *
 * - Narrative chapters: one BriefingBeat per authored `beats[]` entry.
 * - Evidence-reveal chapters: optional narration paragraph becomes beat 0
 *   (skipped when `narration` is missing). Each `evidenceIds[]` entry becomes
 *   its own beat (one dramatic slide-in per exhibit).
 *
 * Backdrop resolution is performed by callers via the case-level location map
 * (chapter.locationId → case.locations[locId].imageUrl). The helper only
 * propagates `imageUrl` from the authored Beat.imageUrl field.
 */

import type { Case, Chapter } from "@/engine/types";

export type BriefingBeat =
  | {
      kind: "narration";
      speaker?: string;
      text: string;
      imageUrl?: string;
      musicCue?: string;
      pauseAfterMs?: number;
    }
  | {
      kind: "exhibit";
      evidenceId: string;
      musicCue?: string;
    };

export function enumerateBriefingBeats(chapter: Chapter): BriefingBeat[] {
  if (chapter.type === "narrative") {
    return chapter.beats.map((beat) => ({
      kind: "narration",
      speaker: beat.speaker,
      text: beat.text,
      imageUrl: beat.imageUrl,
      musicCue: beat.musicCue,
      pauseAfterMs: beat.pauseAfterMs,
    }));
  }

  if (chapter.type === "evidence-reveal") {
    const beats: BriefingBeat[] = [];
    if (chapter.narration && chapter.narration.trim().length > 0) {
      beats.push({
        kind: "narration",
        text: chapter.narration,
        musicCue: chapter.musicCue,
      });
    }
    for (const evidenceId of chapter.evidenceIds) {
      beats.push({ kind: "exhibit", evidenceId });
    }
    return beats;
  }

  // Other chapter types (interview, accusation, reveal, phone-hack) aren't
  // Briefing-phase; callers should not invoke this for them. Return empty so
  // safety guards in advanceSessionBeat treat as "no beats".
  return [];
}

export function getBriefingBeatCount(chapter: Chapter): number {
  return enumerateBriefingBeats(chapter).length;
}

/**
 * Predicate used by the engine to decide whether a chapter participates in the
 * beat-by-beat advance flow. Today: round-1 narrative + evidence-reveal
 * chapters. Round-2 evidence-reveal (e.g., `r2-evidence-drop`) intentionally
 * stays on the legacy case_board path.
 */
export function isBriefingBeatChapter(chapter: Chapter): boolean {
  return (
    chapter.roundNumber === 1 &&
    (chapter.type === "narrative" || chapter.type === "evidence-reveal")
  );
}

/**
 * Look up the backdrop asset for a beat. Resolution chain:
 *   1. authored beat.imageUrl (if set)
 *   2. chapter.locationId → case.locations[locId].imageUrl
 *   3. case-level hero fallback (caller decides; this helper returns null)
 *
 * Returns the relative asset path (e.g., "assets/locations/police-station.png")
 * so callers can wrap it with the asset URL builder. Null means "use hero".
 */
export function resolveBeatBackdrop(
  beat: BriefingBeat,
  chapter: Chapter,
  caseData: Pick<Case, "locations">,
): string | null {
  if (beat.kind === "narration" && beat.imageUrl) return beat.imageUrl;
  const locationId = "locationId" in chapter ? chapter.locationId : undefined;
  if (!locationId) return null;
  const location = caseData.locations.find((loc) => loc.id === locationId);
  return location?.imageUrl ?? null;
}
