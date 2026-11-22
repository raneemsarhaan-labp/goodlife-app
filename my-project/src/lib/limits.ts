/**
 * Field limits shared by forms (browser) and validation (server), kept free of Zod so client
 * components can import them without shipping the validation library (spec 002 JS budget).
 */
export const REFLECTION_MAX = 500; // data-model.md (spec 003) reflections.text
export const DESIRED_STATE_MAX = 2000; // data-model.md (spec 003) plans.desired_state
export const MAX_SESSIONS = 52; // data-model.md (spec 003) activity_sessions per activity
