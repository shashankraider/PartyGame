"use client";

/**
 * Phase 2j (Swing #1) — TV-side Briefing renderer.
 *
 * Walks a chapter's beats one at a time. Each beat plays as:
 *   - Typewriter narration (JS-driven, 22ms/char, faster on sentence breaks)
 *   - Speaker chyron pill (color-coded, 200ms fade-in lead)
 *   - Ambient backdrop (beat.imageUrl → chapter.locationId → hero gradient)
 *   - For evidence-reveal exhibit beats: printable HTML iframe slides in
 *
 * The component is fully controlled by the parent (it doesn't fetch state).
 * Continue/Previous clicks land via the parent's hostControlAction. To skip a
 * mid-typewriter beat, the parent passes `requestAdvanceRef` — the component
 * intercepts the first Continue (fills the rest of the text) and only bubbles
 * subsequent ones.
 */

import Image from "next/image";
import { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import type { RefObject } from "react";

import type { Case, Chapter } from "@/engine/types";
import { enumerateBriefingBeats, resolveBeatBackdrop } from "@/lib/briefing-beats";
import { getEvidencePrintableUrl } from "@/lib/printables";

const TYPE_TICK_MS = 22;
const TYPE_TICK_FAST_MS = 8;
const CROSSFADE_MS = 300;

type SpeakerKey = "narrator" | "officer" | "default";

const SPEAKER_STYLES: Record<SpeakerKey, { bg: string; text: string }> = {
  narrator: { bg: "bg-[#f6f0e4]/15", text: "text-[#f6f0e4]" },
  officer: { bg: "bg-[#d4ad67]/15", text: "text-[#edc77d]" },
  default: { bg: "bg-white/10", text: "text-[#cfc8ba]" },
};

function classifySpeaker(speaker: string | undefined): SpeakerKey {
  if (!speaker) return "default";
  const lower = speaker.toLowerCase();
  if (lower.includes("narrator")) return "narrator";
  if (lower.includes("cbi") || lower.includes("officer")) return "officer";
  return "default";
}

function getCaseAssetUrl(caseData: Case, assetPath: string | null | undefined): string | null {
  if (!assetPath?.startsWith("assets/")) return null;
  return `/api/cases/${encodeURIComponent(caseData.id)}/assets/${assetPath
    .slice("assets/".length)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export type BriefingBeatPlayerHandle = {
  /**
   * Returns true if the click was absorbed (typewriter skipped to end).
   * False means the parent should advance.
   */
  fastForward: () => boolean;
};

export function BriefingBeatPlayer({
  caseData,
  chapter,
  beatIndex,
  isPaused = false,
  handleRef,
}: {
  caseData: Case;
  chapter: Chapter;
  beatIndex: number;
  isPaused?: boolean;
  handleRef?: RefObject<BriefingBeatPlayerHandle | null>;
}) {
  const beats = useMemo(() => enumerateBriefingBeats(chapter), [chapter]);
  const clampedIndex = Math.max(0, Math.min(beats.length - 1, beatIndex));
  const beat = beats[clampedIndex];
  const totalBeats = beats.length;

  // Per-beat full text (narration only; exhibits handle their own layout).
  const fullText = beat?.kind === "narration" ? beat.text : "";
  const beatKey = `${chapter.id}:${clampedIndex}`;
  // Detect beat changes during render — reset typewriter and chyron without an
  // effect (avoids the react-hooks/set-state-in-effect lint).
  const [lastBeatKey, setLastBeatKey] = useState(beatKey);
  const [charCount, setCharCount] = useState(0);
  const [chyronVisible, setChyronVisible] = useState(false);
  if (lastBeatKey !== beatKey) {
    setLastBeatKey(beatKey);
    setCharCount(0);
    setChyronVisible(false);
  }

  // Chyron fade-in is a 200ms delay after the new beat lands.
  useEffect(() => {
    if (beat?.kind !== "narration") return;
    const timer = window.setTimeout(() => setChyronVisible(true), 200);
    return () => window.clearTimeout(timer);
  }, [beatKey, beat?.kind]);

  // Typewriter ticker (paused while session is paused).
  useEffect(() => {
    if (beat?.kind !== "narration") return;
    if (isPaused) return;
    if (charCount >= fullText.length) return;
    const remaining = fullText.length - charCount;
    if (remaining <= 0) return;

    const nextChar = fullText[charCount];
    const prevChar = charCount > 0 ? fullText[charCount - 1] : "";
    const fast = /[.!?]/.test(prevChar) && /\s/.test(nextChar ?? "");
    const interval = fast ? TYPE_TICK_FAST_MS : TYPE_TICK_MS;

    const timer = window.setTimeout(() => {
      setCharCount((current) => Math.min(current + 1, fullText.length));
    }, interval);
    return () => window.clearTimeout(timer);
  }, [beat?.kind, charCount, fullText, isPaused]);

  const fastForward = useCallback(() => {
    if (beat?.kind === "narration" && charCount < fullText.length) {
      setCharCount(fullText.length);
      return true;
    }
    return false;
  }, [beat?.kind, charCount, fullText.length]);

  useImperativeHandle(handleRef, () => ({ fastForward }), [fastForward]);

  if (!beat) {
    // Empty chapter — render a soft fallback.
    return (
      <div className="rounded-[2rem] border border-white/10 bg-[#090a0a] p-10 text-center text-[#a6a29a]">
        Nothing to display.
      </div>
    );
  }

  const backdropPath = resolveBeatBackdrop(beat, chapter, caseData);
  const backdropUrl = getCaseAssetUrl(caseData, backdropPath);
  const heroFallback = `/api/cases/${encodeURIComponent(caseData.id)}/hero`;
  const evidence =
    beat.kind === "exhibit"
      ? caseData.evidence.find((item) => item.id === beat.evidenceId) ?? null
      : null;
  const printableUrl = evidence ? getEvidencePrintableUrl(caseData.id, evidence) : null;

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#050505] shadow-2xl shadow-black/40"
      key={beatKey}
      style={{ animation: `briefingFade ${CROSSFADE_MS}ms ease-out` }}
    >
      {/* Backdrop layer */}
      <div className="absolute inset-0">
        <Image
          src={backdropUrl ?? heroFallback}
          alt=""
          fill
          sizes="(min-width: 1024px) 1180px, 100vw"
          className="scale-[1.05] object-cover opacity-70"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,5,5,0.92)_0%,rgba(5,5,5,0.65)_45%,rgba(5,5,5,0.35)_100%)]" />
      </div>

      {/* Frame */}
      <div className="relative z-10 flex min-h-[34rem] flex-col p-7 sm:p-10">
        {/* Top bar: chapter + beat progress */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.34em] text-[#d4ad67]">
              {chapter.title}
            </p>
            <p className="mt-1 text-xs text-[#a6a29a]">
              Beat {clampedIndex + 1} of {totalBeats}
            </p>
          </div>
          <div className="flex gap-1.5" aria-label={`Beat ${clampedIndex + 1} of ${totalBeats}`}>
            {Array.from({ length: totalBeats }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i < clampedIndex
                    ? "bg-[#d4ad67]"
                    : i === clampedIndex
                      ? "bg-[#edc77d]"
                      : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>

        {beat.kind === "narration" ? (
          <NarrationBeat
            text={fullText}
            charCount={charCount}
            speaker={beat.speaker}
            chyronVisible={chyronVisible}
            isPaused={isPaused}
          />
        ) : (
          <ExhibitBeat
            chapterTitle={chapter.title}
            evidenceTitle={evidence?.title ?? beat.evidenceId}
            evidenceCategory={evidence?.category ?? null}
            printableUrl={printableUrl}
          />
        )}
      </div>

      {/* Crossfade keyframes — scoped via Tailwind-style style tag */}
      <style jsx>{`
        @keyframes briefingFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function NarrationBeat({
  text,
  charCount,
  speaker,
  chyronVisible,
  isPaused,
}: {
  text: string;
  charCount: number;
  speaker: string | undefined;
  chyronVisible: boolean;
  isPaused: boolean;
}) {
  const visibleText = text.slice(0, charCount);
  const isTyping = charCount < text.length;
  const speakerKey = classifySpeaker(speaker);
  const styles = SPEAKER_STYLES[speakerKey];

  return (
    <div className="mt-auto flex flex-col gap-5">
      {speaker ? (
        <div
          className={`inline-flex w-fit items-center rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.32em] ${styles.bg} ${styles.text} transition-opacity duration-300`}
          style={{ opacity: chyronVisible ? 1 : 0 }}
        >
          {speaker}
        </div>
      ) : null}
      <p className="max-w-[70ch] text-3xl leading-[1.45] text-[#f6f0e4] sm:text-4xl">
        {visibleText}
        {isTyping ? (
          <span
            className="ml-1 inline-block h-7 w-[3px] translate-y-1 align-middle bg-[#d4ad67]"
            style={{ animation: isPaused ? "none" : "briefingCursor 1s steps(2) infinite" }}
            aria-hidden
          />
        ) : null}
      </p>
      <style jsx>{`
        @keyframes briefingCursor {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function ExhibitBeat({
  chapterTitle,
  evidenceTitle,
  evidenceCategory,
  printableUrl,
}: {
  chapterTitle: string;
  evidenceTitle: string;
  evidenceCategory: string | null;
  printableUrl: string | null;
}) {
  return (
    <div className="mt-auto flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#d4ad67]">
            {chapterTitle}
          </p>
          <h3 className="mt-1 text-3xl font-semibold text-[#f6f0e4]">{evidenceTitle}</h3>
          {evidenceCategory ? (
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#a6a29a]">
              {evidenceCategory}
            </p>
          ) : null}
        </div>
      </div>
      {printableUrl ? (
        <div
          className="overflow-hidden rounded-2xl border border-[#d4ad67]/30 bg-white shadow-2xl shadow-black/40"
          style={{ animation: "exhibitSlideIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <iframe
            src={printableUrl}
            title={evidenceTitle}
            className="h-[min(56vh,520px)] w-full"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      ) : (
        <p className="rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-base text-[#cfc8ba]">
          (No printable available for this exhibit.)
        </p>
      )}
      <style jsx>{`
        @keyframes exhibitSlideIn {
          from {
            opacity: 0;
            transform: translateX(40px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
