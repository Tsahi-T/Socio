/**
 * Core domain types of the Exercise Engine.
 *
 * The engine knows nothing about specific exercises (SWOT, voting, ...).
 * Each exercise contributes:
 *   - a data shape (member of the ExerciseData union)
 *   - an ExerciseModule implementation registered in the registry
 * Adding a new exercise = new data kind + new module + a flow.config entry.
 */
import type { ComponentType } from 'react';

/** A single user-created text item (association word, SWOT entry, focus topic). */
export interface Item {
  id: string;
  text: string;
  createdAt: number;
}

export type SwotQuadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

export interface VoteOption {
  /** Matches the id of the focus-topic Item it was created from. */
  id: string;
  text: string;
  votes: number;
}

/* ---------- Exercise data shapes (discriminated union on `kind`) ---------- */

export interface OrganizationData {
  kind: 'organization';
  name: string;
}

export interface AssociationsData {
  kind: 'associations';
  items: Item[];
}

export interface SwotData {
  kind: 'swot';
  strengths: Item[];
  weaknesses: Item[];
  opportunities: Item[];
  threats: Item[];
}

export interface FocusData {
  kind: 'focus';
  items: Item[];
}

export interface VotingData {
  kind: 'voting';
  options: VoteOption[];
  votesPerParticipant: number;
}

export type ExerciseData = OrganizationData | AssociationsData | SwotData | FocusData | VotingData;

export type ExerciseDataKind = ExerciseData['kind'];

/* ------------------------------ Exercise ------------------------------ */

/** One exercise instance inside a session (a "step" the facilitator runs). */
export interface Exercise {
  id: string;
  /** Module type key, e.g. 'swot', 'association-sun'. */
  type: string;
  title: string;
  description: string;
  /** Free-form per-instance parameters (e.g. which prompt an association sun shows). */
  params: Record<string, string>;
  data: ExerciseData;
}

/* ------------------------------- Session ------------------------------- */

export const SESSION_VERSION = '1.0';

/** The whole diagnosis process — single source of truth, fully serializable. */
export interface Session {
  version: string;
  organizationName: string;
  exercises: Exercise[];
  /** Index of the exercise currently shown. */
  currentIndex: number;
  updatedAt: number;
}

/* --------------------------- Exercise module --------------------------- */

/** Props every exercise component receives from the engine. */
export interface ExerciseComponentProps<D extends ExerciseData = ExerciseData> {
  exercise: Exercise;
  data: D;
  /**
   * Replace this exercise's data (immutably). Accepts an updater function
   * for changes that must build on the latest state (e.g. rapid vote clicks).
   */
  onChange: (next: D | ((prev: D) => D)) => void;
}

/** Context passed to serializers (e.g. organization name, cross-exercise reads). */
export interface SerializeContext {
  organizationName: string;
  /** Read-only view of the whole session (e.g. voting reads focus topics). */
  session: Session;
}

/**
 * The contract every exercise implements. Registered in the registry;
 * the engine renders/serializes exercises only through this interface.
 */
export interface ExerciseModule<D extends ExerciseData = ExerciseData> {
  type: string;
  Component: ComponentType<ExerciseComponentProps<D>>;
  createInitialData: (params: Record<string, string>) => D;
  /** Render this exercise's data as a human/LLM-readable TXT section body. */
  toTxt: (data: D, ctx: SerializeContext) => string;
  /** Parse a TXT section body back into data. Throws on malformed content. */
  fromTxt: (body: string, params: Record<string, string>) => D;
  /** Whether the exercise has meaningful content (stepper hint, never blocks). */
  isDone: (data: D) => boolean;
}

/* ----------------------------- Flow config ----------------------------- */

/** Declarative definition of one step in the diagnosis flow. */
export interface FlowStep {
  /** Stable id, also used as the TXT section heading for round-trip import. */
  id: string;
  type: string;
  title: string;
  description: string;
  /** Short label for the stepper navigation. */
  navLabel: string;
  params?: Record<string, string>;
}
