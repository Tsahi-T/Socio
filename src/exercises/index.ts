/**
 * Exercise registration — importing this module registers every exercise
 * in the registry. Adding a new exercise = add its module to this list.
 */
import { registerExercise, isExerciseRegistered } from '../engine/registry';
import { organizationNameModule } from './organization-name';
import { associationSunModule } from './association-sun';

// Guard against double registration under HMR / StrictMode re-evaluation.
if (!isExerciseRegistered(organizationNameModule.type)) registerExercise(organizationNameModule);
if (!isExerciseRegistered(associationSunModule.type)) registerExercise(associationSunModule);
