import { AcademicSettings, FacultyMember, Intervention, Student } from '../types';
import { buildInitialStudents, INITIAL_FACULTY, INITIAL_INTERVENTIONS } from '../data/mockData';
import { calculateRisk, DEFAULT_SETTINGS } from './riskEngine';

const STORAGE_KEYS = {
  STUDENTS: 'edupulse_students_v1',
  SETTINGS: 'edupulse_settings_v1',
  INTERVENTIONS: 'edupulse_interventions_v1',
  FACULTY: 'edupulse_faculty_v1',
  ACTIVE_ROLE: 'edupulse_active_role_v1',
  ACTIVE_STUDENT_ID: 'edupulse_active_student_id_v1',
  SUPABASE_CONFIG: 'edupulse_supabase_config_v1',
};

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export function loadSettings(): AcademicSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: AcademicSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('edupulse-settings-changed', { detail: settings }));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading students from localStorage', e);
  }
  const initial = buildInitialStudents();
  saveStudents(initial);
  return initial;
}

export function saveStudents(students: Student[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    window.dispatchEvent(new CustomEvent('edupulse-students-changed', { detail: students }));
  } catch (e) {
    console.error('Error saving students to localStorage', e);
  }
}

export function loadInterventions(): Intervention[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading interventions', e);
  }
  const initial = [...INITIAL_INTERVENTIONS];
  saveInterventions(initial);
  return initial;
}

export function saveInterventions(interventions: Intervention[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    window.dispatchEvent(new CustomEvent('edupulse-interventions-changed', { detail: interventions }));
  } catch (e) {
    console.error('Error saving interventions', e);
  }
}

export function loadFaculty(): FacultyMember[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FACULTY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading faculty', e);
  }
  return INITIAL_FACULTY;
}

export function resetAllDataToDefault(): { students: Student[]; settings: AcademicSettings; interventions: Intervention[] } {
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.INTERVENTIONS);

  const settings = { ...DEFAULT_SETTINGS };
  const students = buildInitialStudents();
  const interventions = [...INITIAL_INTERVENTIONS];

  saveSettings(settings);
  saveStudents(students);
  saveInterventions(interventions);

  return { students, settings, interventions };
}

export function updateSingleStudentMarks(
  studentId: string,
  updatedSubjectScores: Student['subjectScores'],
  updatedAttendance: number
): Student | null {
  const students = loadStudents();
  const settings = loadSettings();
  const index = students.findIndex((s) => s.id === studentId);
  if (index === -1) return null;

  const current = students[index];
  const oldScore = current.riskScore;

  const newBreakdown = calculateRisk(updatedSubjectScores, updatedAttendance, settings);

  const updatedStudent: Student = {
    ...current,
    overallAttendance: updatedAttendance,
    subjectScores: updatedSubjectScores,
    riskScore: newBreakdown.totalScore,
    riskCategory: newBreakdown.category,
    riskBreakdown: newBreakdown,
    previousRiskScore: oldScore,
    lastUpdated: new Date().toISOString(),
  };

  students[index] = updatedStudent;
  saveStudents(students);
  return updatedStudent;
}

export function loadSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    url: '',
    anonKey: '',
    enabled: false,
  };
}

export function saveSupabaseConfig(cfg: SupabaseConfig): void {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify(cfg));
}
