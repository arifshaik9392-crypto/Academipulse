export type Department = 'CSE' | 'ECE' | 'MECH' | 'IT' | 'EEE';
export type RiskCategory = 'Low' | 'Moderate' | 'High' | 'Critical';
export type UserRole = 'admin' | 'faculty' | 'student';

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  department: Department;
  facultyName: string;
}

export interface SubjectScore {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  internal1: number; // max 50
  internal2: number; // max 50
  assignment: number; // max 20
  attendance: number; // 0-100%
  weakTopics?: string[];
}

export interface RiskBreakdown {
  marksPenalty: number;
  attendancePenalty: number;
  trendPenalty: number;
  assignmentPenalty: number;
  totalScore: number; // 0 - 100
  category: RiskCategory;
  reasons: string[];
  primaryWeakSubject?: string;
  suggestedAction: string;
}

export interface StudyTask {
  id: string;
  subject: string;
  topic: string;
  estimatedHours: number;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  dayOfWeek: string;
  resourceLink?: string;
  notes?: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department: Department;
  semester: number;
  section: string;
  mentorFacultyId: string;
  mentorName: string;
  overallAttendance: number; // %
  subjectScores: SubjectScore[];
  riskCategory: RiskCategory;
  riskScore: number; // 0-100
  riskBreakdown: RiskBreakdown;
  previousRiskScore: number;
  studyTasks: StudyTask[];
  academicYear: string;
  phone?: string;
  lastUpdated: string;
}

export type InterventionStatus = 'Scheduled' | 'In Progress' | 'Resolved' | 'Escalated';

export interface Intervention {
  id: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  studentDept: Department;
  facultyId: string;
  facultyName: string;
  date: string;
  category: 'Academic Weakness' | 'Attendance Deficit' | 'Exam Failure' | 'Emotional / Stress' | 'Assignment Backlog';
  discussionNotes: string;
  actionItems: string;
  followUpDate: string;
  status: InterventionStatus;
  preRiskScore: number;
  postRiskScore?: number;
  parentNotified: boolean;
}

export interface AcademicSettings {
  attendanceWeight: number; // e.g. 0.30
  internalMarksWeight: number; // e.g. 0.40
  trendWeight: number; // e.g. 0.15
  assignmentsWeight: number; // e.g. 0.15
  attendanceCutoff: number; // e.g. 75%
  marksPassingThreshold: number; // e.g. 40% (20 out of 50)
  criticalRiskThreshold: number; // e.g. 70
  highRiskThreshold: number; // e.g. 50
  moderateRiskThreshold: number; // e.g. 30
}

export interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department: Department;
  designation: string;
  subjectsTaught: string[];
}
