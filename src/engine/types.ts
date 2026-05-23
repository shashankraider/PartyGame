/**
 * AUTO-GENERATED from src/engine/schema/case.schema.json.
 * Do not edit by hand. Regenerate with:
 *   npm run types:generate
 */
/* eslint-disable */
/* tslint:disable */

/**
 * Kebab-case identifier: lowercase letters, digits, and single hyphens.
 */
export type SlugId = string;
export type UnlockCondition =
  | {
      type: "evidence";
      evidenceId: SlugId;
    }
  | {
      type: "chapter";
      chapterId: SlugId;
    }
  | {
      type: "round";
      roundNumber: number;
    }
  | {
      type: "all";
      /**
       * @minItems 1
       */
      conditions: [UnlockCondition, ...UnlockCondition[]];
    }
  | {
      type: "any";
      /**
       * @minItems 1
       */
      conditions: [UnlockCondition, ...UnlockCondition[]];
    };
export type GuiltCategory =
  | "mastermind"
  | "executor"
  | "accomplice"
  | "accessory"
  | "tamperer"
  | "moral-cowardice"
  | "moral-bystander"
  | "innocent";
export type Chapter =
  | NarrativeChapter
  | EvidenceRevealChapter
  | InterviewChapter
  | PhoneHackChapter
  | AccusationChapter
  | RevealChapter;

/**
 * A complete cooperative murder-mystery case for the Mystery Engine. Every case ships as a single case.json file plus assets and printables folders.
 */
export interface Case {
  /**
   * Relative path to this schema file. Enables IDE autocomplete and inline validation in case authors' editors. Example: '../../src/engine/schema/case.schema.json'.
   */
  $schema?: string;
  /**
   * Unique case identifier, kebab-case, matches the folder name under cases/. Example: 'mussoorie'.
   */
  id: string;
  /**
   * Case content version (semver). Bump when the case itself changes (story, evidence, solution).
   */
  version: string;
  /**
   * Engine version range this case targets (npm-style semver range). The engine refuses to load incompatible cases. Example: '^1.0.0'.
   */
  engineVersion: string;
  meta: CaseMeta;
  victim: Victim;
  /**
   * All interrogatable suspects. Most cases use 6.
   *
   * @minItems 3
   * @maxItems 12
   */
  suspects:
    | [Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect]
    | [Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect, Suspect];
  /**
   * All evidence items in the case. Each item is unlocked by a chapter and can be presented to suspects during interviews.
   *
   * @minItems 1
   */
  evidence: [Evidence, ...Evidence[]];
  /**
   * Ordered list of chapters. The engine walks chapters in order, respecting prerequisites.
   *
   * @minItems 2
   */
  chapters: [Chapter, Chapter, ...Chapter[]];
  /**
   * Round groupings (e.g., 4 rounds for Mussoorie). Chapters and evidence reference these by round number.
   *
   * @minItems 1
   */
  rounds: [Round, ...Round[]];
  /**
   * Named places in the case. Chapters and evidence may reference a location to set the visual backdrop on the TV.
   */
  locations: Location[];
  /**
   * Optional. Events that happened before the game starts (e.g., a cold case). Players uncover these through evidence.
   */
  backstory?: BackstoryEvent[];
  /**
   * Optional. Slow-burn narrative threads woven across multiple chapters (e.g., the Grey Lady).
   */
  atmosphericThreads?: AtmosphericThread[];
  endgame: EndgameDefinition;
  solution: Solution;
  theme?: ThemeOverride;
  llm?: LLMConfig;
  rules?: CaseRules;
}
export interface CaseMeta {
  title: string;
  subtitle?: string;
  /**
   * A one-line pitch for the case picker.
   */
  tagline: string;
  /**
   * Free-text setting summary.
   */
  setting: string;
  /**
   * Time period, e.g., 'present day' or '1970s'.
   */
  era?: string;
  estimatedDurationMinutes: number;
  recommendedPlayers: {
    min: number;
    max: number;
  };
  /**
   * Free-text rating, e.g., '10+', '13+', '18+'.
   */
  ageRating: string;
  /**
   * Disclosure notes about content (e.g., 'references to historical violence, off-screen').
   */
  contentNotes?: string[];
  /**
   * Relative path to the case-picker cover art.
   */
  coverImage?: string;
  /**
   * BCP-47 language tag, e.g., 'en-IN'.
   */
  language: string;
}
export interface Victim {
  id: SlugId;
  name: string;
  portraitUrl?: string;
  /**
   * What players learn about the victim in the briefing.
   */
  publicBackground: string;
  /**
   * Surface-level cause (e.g., 'fall from ravine'). Revealed in the brief or post-mortem evidence.
   */
  causeOfDeath?: string;
}
export interface Suspect {
  id: SlugId;
  name: string;
  /**
   * One-line role descriptor for the suspect board (e.g., 'The Business Partner').
   */
  shortDescription?: string;
  /**
   * Relative path to portrait.
   */
  portraitUrl: string;
  /**
   * Optional. Voice ID for TTS playback of the suspect's lines.
   */
  ttsVoiceId?: string;
  /**
   * Free-text character description for the LLM system prompt.
   */
  persona: string;
  /**
   * Speaking-style guidance for the LLM (sentence length, accent, register).
   */
  voice: string;
  /**
   * Facts the suspect knows and may volunteer.
   */
  knownFacts?: string[];
  /**
   * The story the suspect tells publicly. Always in the prompt.
   */
  publicAlibi: string;
  /**
   * What the suspect actually did during the relevant timeframe. Each beat is gated by an optional UnlockCondition; ungated beats are private until the suspect breaks.
   *
   * @minItems 1
   */
  trueTimeline: [TimelineBeat, ...TimelineBeat[]];
  /**
   * Lies the suspect maintains. The model is told both the lie AND the truth, and instructed to keep the lie.
   */
  lies?: Lie[];
  /**
   * Hidden information unlocked by chapter or evidence conditions.
   */
  secrets?: Secret[];
  /**
   * Evidence/chapter triggers that make the suspect crack and admit something significant. Every suspect needs at least one.
   *
   * @minItems 1
   */
  breakingPoints?: [BreakingPoint, ...BreakingPoint[]];
  /**
   * Explicit topics the suspect must never reveal. The killer's identity is always implicitly added.
   */
  neverReveal: string[];
  guiltCategory: GuiltCategory;
  /**
   * One-to-two sentence summary for the reveal screen's guilt map.
   */
  guiltSummary: string;
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  introducedAtChapter: string;
}
export interface TimelineBeat {
  /**
   * Display time, e.g., '8:00 PM'.
   */
  time: string;
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  locationId?: string;
  /**
   * Free-text location if locationId is not used.
   */
  locationText?: string;
  /**
   * What the suspect did during this beat.
   */
  action: string;
  /**
   * If absent, the beat is private until the suspect's breaking point is hit.
   */
  revealCondition?:
    | {
        type: "evidence";
        evidenceId: SlugId;
      }
    | {
        type: "chapter";
        chapterId: SlugId;
      }
    | {
        type: "round";
        roundNumber: number;
      }
    | {
        type: "all";
        /**
         * @minItems 1
         */
        conditions: [UnlockCondition, ...UnlockCondition[]];
      }
    | {
        type: "any";
        /**
         * @minItems 1
         */
        conditions: [UnlockCondition, ...UnlockCondition[]];
      };
}
export interface Lie {
  id: SlugId;
  topic: string;
  says: string;
  actually: string;
}
export interface Secret {
  id: SlugId;
  topic: string;
  /**
   * Vague tease the suspect may give when pressed before unlock conditions are met.
   */
  hint?: string;
  revealOnlyIf: UnlockCondition;
  /**
   * What the suspect admits when the unlock condition is met.
   */
  revealedText: string;
  unlockBehavior?: UnlockBehavior;
}
/**
 * Optional. How the engine's adjudicator decides whether this secret should unlock during a live interview. If omitted, the secret unlocks only via the legacy revealOnlyIf evidence/chapter conditions.
 */
export interface UnlockBehavior {
  /**
   * Difficulty profile. cooperation: suspect wants to help, fires on the right kind of question (Naina). evidence: suspect deflects until a specific artifact is presented (Rhea). pressure: suspect breaks after pressureThreshold adjacent attempts (Devraj). compound: needs evidenceIds AND pressureThreshold (Bisht).
   */
  tier: "cooperation" | "evidence" | "pressure" | "compound";
  /**
   * Natural-language description of the conversational state the adjudicator should look for. Required for cooperation and compound tiers; ignored for pure evidence tier. Write so the cue includes 'what counts' AND 'what does not count' (e.g., hostile cross-examination should not fire cooperation).
   */
  cooperationCue?: string;
  /**
   * Evidence IDs the interviewer must have presented during this conversation. Required for evidence and compound tiers.
   */
  evidenceIds?: SlugId[];
  /**
   * How many adjacent-but-not-quite attempts the suspect endures before cracking. Used by pressure and compound tiers.
   */
  pressureThreshold?: number;
  /**
   * After this many turns without firing, the host TV view is prompted with a 'Reveal? [Reveal] [Wait]' notification. If omitted, no host fallback for this condition.
   */
  hostFallbackAfterTurns?: number;
}
export interface BreakingPoint {
  id: SlugId;
  trigger: UnlockCondition;
  /**
   * What the suspect says or does when the trigger is met (becomes part of the LLM context).
   */
  reaction: string;
  unlockBehavior?: UnlockBehavior1;
}
/**
 * Optional. How the engine's adjudicator decides whether this breaking point fires during a live interview.
 */
export interface UnlockBehavior1 {
  /**
   * Difficulty profile. cooperation: suspect wants to help, fires on the right kind of question (Naina). evidence: suspect deflects until a specific artifact is presented (Rhea). pressure: suspect breaks after pressureThreshold adjacent attempts (Devraj). compound: needs evidenceIds AND pressureThreshold (Bisht).
   */
  tier: "cooperation" | "evidence" | "pressure" | "compound";
  /**
   * Natural-language description of the conversational state the adjudicator should look for. Required for cooperation and compound tiers; ignored for pure evidence tier. Write so the cue includes 'what counts' AND 'what does not count' (e.g., hostile cross-examination should not fire cooperation).
   */
  cooperationCue?: string;
  /**
   * Evidence IDs the interviewer must have presented during this conversation. Required for evidence and compound tiers.
   */
  evidenceIds?: SlugId[];
  /**
   * How many adjacent-but-not-quite attempts the suspect endures before cracking. Used by pressure and compound tiers.
   */
  pressureThreshold?: number;
  /**
   * After this many turns without firing, the host TV view is prompted with a 'Reveal? [Reveal] [Wait]' notification. If omitted, no host fallback for this condition.
   */
  hostFallbackAfterTurns?: number;
}
export interface Evidence {
  id: SlugId;
  title: string;
  category: "document" | "photo" | "object" | "digital" | "testimony" | "letter";
  thumbnailUrl?: string;
  fullViewUrl?: string;
  pdfUrl?: string;
  /**
   * Basename only: HTML file under the case printables/ folder. Mobile locker opens this file at #evidenceId.
   */
  printableHtml?: string;
  /**
   * Short label that appears on the evidence card on the TV.
   */
  description: string;
  /**
   * Longer description fed to the LLM when this evidence is presented in an interview.
   */
  loreText: string;
  /**
   * Round in which this evidence becomes available.
   */
  revealedInRound: number;
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  unlockedAtChapter: string;
  /**
   * Optional natural-language condition the AI host uses to decide when this evidence should arrive during Interrogation.
   */
  arrivesWhen?: string;
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  locationId?: string;
  /**
   * Suspect IDs implicated or referenced by this evidence; the UI may highlight these on the suspect board.
   */
  relatesToSuspectIds?: SlugId[];
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  triggersChapter?: string;
  unlockBehavior?: UnlockBehavior2;
}
/**
 * Optional. How the Phase 2g adjudicator decides whether this evidence should unlock dynamically during a live interview. If omitted, this evidence is unlocked only when its unlockedAtChapter completes (current default behavior).
 */
export interface UnlockBehavior2 {
  /**
   * Difficulty profile. cooperation: suspect wants to help, fires on the right kind of question (Naina). evidence: suspect deflects until a specific artifact is presented (Rhea). pressure: suspect breaks after pressureThreshold adjacent attempts (Devraj). compound: needs evidenceIds AND pressureThreshold (Bisht).
   */
  tier: "cooperation" | "evidence" | "pressure" | "compound";
  /**
   * Natural-language description of the conversational state the adjudicator should look for. Required for cooperation and compound tiers; ignored for pure evidence tier. Write so the cue includes 'what counts' AND 'what does not count' (e.g., hostile cross-examination should not fire cooperation).
   */
  cooperationCue?: string;
  /**
   * Evidence IDs the interviewer must have presented during this conversation. Required for evidence and compound tiers.
   */
  evidenceIds?: SlugId[];
  /**
   * How many adjacent-but-not-quite attempts the suspect endures before cracking. Used by pressure and compound tiers.
   */
  pressureThreshold?: number;
  /**
   * After this many turns without firing, the host TV view is prompted with a 'Reveal? [Reveal] [Wait]' notification. If omitted, no host fallback for this condition.
   */
  hostFallbackAfterTurns?: number;
}
export interface NarrativeChapter {
  type: "narrative";
  id: SlugId;
  title: string;
  roundNumber: number;
  prerequisites?: SlugId[];
  locationId?: SlugId;
  musicCue?: string;
  /**
   * @minItems 1
   */
  beats: [Beat, ...Beat[]];
}
export interface Beat {
  /**
   * Display label for the speaker, e.g., 'Narrator' or 'CBI Officer'.
   */
  speaker?: string;
  text: string;
  musicCue?: string;
  /**
   * Optional image shown alongside the beat on the TV.
   */
  imageUrl?: string;
  pauseAfterMs?: number;
}
export interface EvidenceRevealChapter {
  type: "evidence-reveal";
  id: SlugId;
  title: string;
  roundNumber: number;
  prerequisites?: SlugId[];
  locationId?: SlugId;
  musicCue?: string;
  /**
   * @minItems 1
   */
  evidenceIds: [SlugId, ...SlugId[]];
  /**
   * Voiced narration shown on the TV when the evidence is revealed.
   */
  narration?: string;
  /**
   * Instruction to host like 'Open Case File 3 now.'
   */
  printablePrompt?: string;
}
export interface InterviewChapter {
  type: "interview";
  id: SlugId;
  title: string;
  roundNumber: number;
  prerequisites?: SlugId[];
  locationId?: SlugId;
  musicCue?: string;
  suspectId: SlugId;
  /**
   * Narration shown on the TV before the chat starts.
   */
  intro?: string;
  /**
   * Narration shown when the interview ends.
   */
  outro?: string;
  /**
   * Evidence ids the interviewer can present during this interview. Defaults to all unlocked evidence if omitted.
   */
  presentableEvidence?: SlugId[];
  /**
   * Optional soft time limit for the interview.
   */
  softTimeMinutes?: number;
}
export interface PhoneHackChapter {
  type: "phone-hack";
  id: SlugId;
  title: string;
  roundNumber: number;
  prerequisites?: SlugId[];
  locationId?: SlugId;
  musicCue?: string;
  /**
   * Whose phone is being hacked (free text for the UI).
   */
  phoneOwner: string;
  intro?: string;
  messages?: PhoneMessage[];
  callLog?: PhoneCall[];
  notes?: PhoneNote[];
  /**
   * Evidence ids that are unlocked by the player when this minigame completes.
   */
  keyClueIds?: SlugId[];
}
export interface PhoneMessage {
  /**
   * Display name of the sender.
   */
  from: string;
  to?: string;
  text: string;
  /**
   * Display timestamp, e.g., '8:13 PM, Mar 4'.
   */
  timestamp: string;
  /**
   * Marks this as a notable message for the UI.
   */
  highlight?: boolean;
}
export interface PhoneCall {
  with: string;
  direction: "incoming" | "outgoing" | "missed";
  timestamp: string;
  durationSeconds?: number;
  highlight?: boolean;
}
export interface PhoneNote {
  title: string;
  body: string;
  lastEditedDisplay?: string;
}
export interface AccusationChapter {
  type: "accusation";
  id: SlugId;
  title: string;
  roundNumber: number;
  prerequisites?: SlugId[];
  locationId?: SlugId;
  musicCue?: string;
  narration?: string;
  /**
   * What the TV asks the group, e.g., 'Who is responsible for Vikram Singh's death?'
   */
  promptText?: string;
}
export interface RevealChapter {
  type: "reveal";
  id: SlugId;
  title: string;
  roundNumber: number;
  prerequisites?: SlugId[];
  locationId?: SlugId;
  musicCue?: string;
}
export interface Round {
  number: number;
  title: string;
  tagline?: string;
  introNarration?: Beat[];
  outroNarration?: Beat[];
}
export interface Location {
  id: SlugId;
  name: string;
  description: string;
  imageUrl?: string;
}
export interface BackstoryEvent {
  id: SlugId;
  title: string;
  /**
   * Display-only time reference, e.g., 'December 2011' or '15 years ago'.
   */
  whenText?: string;
  /**
   * One-paragraph public account.
   */
  summary: string;
  /**
   * Spoilery details. Only revealed via the LLM when guilty suspects break, or in the final reveal.
   */
  fullDescription?: string;
  revealedByEvidence?: SlugId[];
  characters?: BackstoryCharacter[];
}
export interface BackstoryCharacter {
  id: SlugId;
  name: string;
  /**
   * E.g., 'Brigadier (deceased)', 'father of Mr Bisht (deceased)'.
   */
  role?: string;
  portraitUrl?: string;
  summary: string;
}
export interface AtmosphericThread {
  id: SlugId;
  title: string;
  /**
   * Evidence ids that contribute to the thread.
   */
  clueIds?: SlugId[];
  introducedInRound: number;
  resolvedByEvidence?: SlugId;
  resolvedByChapter?: SlugId;
  /**
   * Text shown when the thread closes (e.g., the Grey Lady revealed as Anya).
   */
  resolutionText: string;
}
export interface EndgameDefinition {
  branchOn: "firstConfronted";
  /**
   * @minItems 1
   */
  paths: [EndgamePath, ...EndgamePath[]];
  /**
   * Common reveal narration shown after both endgame paths.
   */
  finalRevealNarration: Beat[];
}
export interface EndgamePath {
  id: SlugId;
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  triggerSuspectId: string;
  /**
   * Canonical opening line the LLM should anchor on for this confrontation.
   */
  scriptedSuspectLine: string;
  /**
   * Kebab-case identifier: lowercase letters, digits, and single hyphens.
   */
  followUpSuspectId?: string;
  /**
   * Canonical reaction line for the follow-up suspect.
   */
  followUpScriptedLine?: string;
}
export interface Solution {
  /**
   * All suspects responsible for the murder. May include mastermind + executor pairs.
   *
   * @minItems 1
   */
  killerSuspectIds: [SlugId, ...SlugId[]];
  /**
   * Map of suspect id -> role (e.g., 'mastermind', 'executor'). Drives the reveal screen.
   */
  killerRoles?: {
    [k: string]: ("mastermind" | "executor" | "accomplice") | undefined;
  };
  motive: string;
  meansAndMethod: string;
  /**
   * Global event timeline shown during the reveal.
   */
  timeline?: TimelineEvent[];
  /**
   * @minItems 1
   */
  revealNarration: [Beat, ...Beat[]];
  redHerrings?: {
    suspectId: SlugId;
    explanation: string;
  }[];
  /**
   * Moral discussion prompt shown to the group after the reveal.
   */
  closingQuestion: string;
}
export interface TimelineEvent {
  time: string;
  description: string;
  actors?: SlugId[];
  locationId?: SlugId;
}
export interface ThemeOverride {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  fontHeading?: string;
  fontBody?: string;
}
export interface LLMConfig {
  /**
   * OpenRouter model slug, e.g., 'openai/gpt-4o-mini'. Overrides OPENROUTER_MODEL env var for this case.
   */
  modelOverride?: string;
  validatorModelOverride?: string;
  temperature?: number;
}
export interface CaseRules {
  /**
   * During a live interview, each detective may ask this many questions before the mic auto-rotates to the next seat. Manual Take Control / Pass Control resets the stretch for the new interviewer.
   */
  questionsPerDetective?: number;
}
