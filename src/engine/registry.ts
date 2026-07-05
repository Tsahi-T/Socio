/**
 * Exercise registry — maps a type key to its module implementation.
 * Exercises self-register at startup (see exercises/index.ts).
 * The engine and UI resolve modules only through this registry,
 * keeping the core fully decoupled from specific exercises.
 */
import type { ExerciseData, ExerciseModule } from './types';

const modules = new Map<string, ExerciseModule>();

export function registerExercise<D extends ExerciseData>(module: ExerciseModule<D>): void {
  if (modules.has(module.type)) {
    throw new Error(`Exercise type "${module.type}" is already registered`);
  }
  // Modules are stored under the widened ExerciseData union; the engine only
  // interacts with them through this interface, never with concrete kinds.
  modules.set(module.type, module as unknown as ExerciseModule);
}

export function getExerciseModule(type: string): ExerciseModule {
  const module = modules.get(type);
  if (!module) {
    throw new Error(`Exercise type "${type}" is not registered`);
  }
  return module;
}

export function isExerciseRegistered(type: string): boolean {
  return modules.has(type);
}
