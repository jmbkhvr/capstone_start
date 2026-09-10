// ============================================================================
// SYSTEM-WIDE GRADE LEVEL DEFINITIONS
// ============================================================================
// The system supports elementary grade levels (Grade 1 through Grade 6).
// Grade 3 is fully supported as one of the valid grades, but the platform
// is generic and grade-level agnostic across all modules.
// ============================================================================

export const SUPPORTED_GRADE_LEVELS = [
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
] as const;

export type SupportedGradeLevel = (typeof SUPPORTED_GRADE_LEVELS)[number];

// Helper: Verify if a given string is an officially supported grade level.
export function isValidGradeLevel(grade: string): grade is SupportedGradeLevel {
  return SUPPORTED_GRADE_LEVELS.includes(grade as SupportedGradeLevel);
}
