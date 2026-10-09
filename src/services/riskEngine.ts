import { AcademicSettings, RiskBreakdown, RiskCategory, Student, StudyTask, SubjectScore } from '../types';

export const DEFAULT_SETTINGS: AcademicSettings = {
  attendanceWeight: 0.30,
  internalMarksWeight: 0.40,
  trendWeight: 0.15,
  assignmentsWeight: 0.15,
  attendanceCutoff: 75,
  marksPassingThreshold: 40, // 40% = 20/50
  criticalRiskThreshold: 70,
  highRiskThreshold: 50,
  moderateRiskThreshold: 30,
};

export function calculateRisk(
  subjectScores: SubjectScore[],
  overallAttendance: number,
  settings: AcademicSettings = DEFAULT_SETTINGS
): RiskBreakdown {
  if (!subjectScores || subjectScores.length === 0) {
    return {
      marksPenalty: 0,
      attendancePenalty: 0,
      trendPenalty: 0,
      assignmentPenalty: 0,
      totalScore: 0,
      category: 'Low',
      reasons: ['No subject records available.'],
      suggestedAction: 'Awaiting semester examination records.',
    };
  }

  const reasons: string[] = [];

  // 1. Marks Penalty calculation (0 - 100)
  // Max marks per internal is 50. Total = 100.
  let totalInternalPctSum = 0;
  let failingSubjectsCount = 0;
  let lowestSubjectScore = 100;
  let primaryWeakSubject = '';

  subjectScores.forEach((sub) => {
    const totalInternal = sub.internal1 + sub.internal2; // max 100
    const pct = totalInternal; // already % since max is 100
    totalInternalPctSum += pct;

    if (pct < lowestSubjectScore) {
      lowestSubjectScore = pct;
      primaryWeakSubject = sub.subjectName;
    }

    if (sub.internal1 < 20 || sub.internal2 < 20) {
      failingSubjectsCount++;
    }
  });

  const avgMarksPct = totalInternalPctSum / subjectScores.length;
  // Lower marks = higher marks penalty
  // If avgMarksPct is 100%, penalty is 0. If avgMarksPct is 40% or below, penalty reaches 80-100.
  let marksPenalty = Math.max(0, Math.min(100, Math.round((100 - avgMarksPct) * 1.15)));
  if (failingSubjectsCount > 0) {
    marksPenalty = Math.min(100, marksPenalty + failingSubjectsCount * 8);
    reasons.push(
      `Failing or critical scores (<20/50) in ${failingSubjectsCount} subject${
        failingSubjectsCount > 1 ? 's' : ''
      }`
    );
  }
  if (avgMarksPct < settings.marksPassingThreshold) {
    reasons.push(`Aggregate internal score (${avgMarksPct.toFixed(1)}%) is below passing threshold (${settings.marksPassingThreshold}%)`);
  }

  // 2. Attendance Penalty calculation (0 - 100)
  // Cutoff is 75%. If attendance is >= 85%, penalty is 0.
  // If attendance is 75%, penalty is ~25. If attendance is < 65%, penalty jumps to 70+.
  let attendancePenalty = 0;
  if (overallAttendance >= 85) {
    attendancePenalty = 0;
  } else if (overallAttendance >= settings.attendanceCutoff) {
    // 75% to 84% -> mild penalty
    attendancePenalty = Math.round((85 - overallAttendance) * 2.5);
  } else {
    // Below 75% cutoff
    const deficit = settings.attendanceCutoff - overallAttendance;
    attendancePenalty = Math.min(100, Math.round(30 + deficit * 3.5));
    reasons.push(
      `Attendance (${overallAttendance.toFixed(1)}%) is critically below mandatory ${settings.attendanceCutoff}% threshold`
    );
  }

  // Check individual subject attendance dips
  const lowAttendanceSubjects = subjectScores.filter((s) => s.attendance < settings.attendanceCutoff);
  if (lowAttendanceSubjects.length > 0 && !reasons.some(r => r.includes('Attendance'))) {
    reasons.push(
      `Shortage in ${lowAttendanceSubjects.length} subject${
        lowAttendanceSubjects.length > 1 ? 's' : ''
      } (e.g. ${lowAttendanceSubjects[0].subjectName} at ${lowAttendanceSubjects[0].attendance}%)`
    );
    attendancePenalty = Math.min(100, attendancePenalty + 15);
  }

  // 3. Trend Penalty calculation (Internal 2 vs Internal 1)
  let totalDrop = 0;
  let subjectsWithDrop = 0;
  subjectScores.forEach((sub) => {
    const diff = sub.internal2 - sub.internal1;
    if (diff < -5) {
      totalDrop += Math.abs(diff);
      subjectsWithDrop++;
    }
  });

  let trendPenalty = 0;
  if (subjectsWithDrop > 0) {
    // Each 5 point drop is 10%
    trendPenalty = Math.min(100, Math.round((totalDrop / subjectScores.length) * 5 + subjectsWithDrop * 10));
    reasons.push(`Performance decline from Internal 1 to Internal 2 across ${subjectsWithDrop} subject(s)`);
  } else {
    // Positive momentum grants reduction
    trendPenalty = 0;
  }

  // 4. Assignment Penalty calculation (0 - 100)
  // Max assignment mark is 20
  const avgAssignment =
    subjectScores.reduce((acc, curr) => acc + curr.assignment, 0) / subjectScores.length;
  let assignmentPenalty = 0;
  if (avgAssignment < 12) {
    assignmentPenalty = Math.min(100, Math.round(((20 - avgAssignment) / 20) * 100));
    reasons.push(`Pending or low assignment submissions (Average ${avgAssignment.toFixed(1)} / 20)`);
  } else if (avgAssignment < 15) {
    assignmentPenalty = 20;
  }

  // Weighted total score (0 to 100)
  const weightedScore =
    marksPenalty * settings.internalMarksWeight +
    attendancePenalty * settings.attendanceWeight +
    trendPenalty * settings.trendWeight +
    assignmentPenalty * settings.assignmentsWeight;

  const totalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

  // Categorize
  let category: RiskCategory = 'Low';
  if (totalScore >= settings.criticalRiskThreshold || overallAttendance < 60 || failingSubjectsCount >= 3) {
    category = 'Critical';
  } else if (totalScore >= settings.highRiskThreshold || failingSubjectsCount >= 2) {
    category = 'High';
  } else if (totalScore >= settings.moderateRiskThreshold || failingSubjectsCount === 1 || overallAttendance < settings.attendanceCutoff) {
    category = 'Moderate';
  } else {
    category = 'Low';
  }

  if (reasons.length === 0) {
    reasons.push('Consistent academic attendance and satisfactory exam performance.');
  }

  // Suggested Faculty Action
  let suggestedAction = 'Maintain periodic review during semester check-ins.';
  if (category === 'Critical') {
    suggestedAction = 'Urgent 1-on-1 mentoring required; trigger parent notification & remedial tutoring.';
  } else if (category === 'High') {
    suggestedAction = 'Schedule faculty intervention session and assign peer study buddy for weak modules.';
  } else if (category === 'Moderate') {
    suggestedAction = 'Issue academic advisory alert and monitor upcoming assignment submissions.';
  }

  return {
    marksPenalty,
    attendancePenalty,
    trendPenalty,
    assignmentPenalty,
    totalScore,
    category,
    reasons,
    primaryWeakSubject,
    suggestedAction,
  };
}

export function generateDefaultStudyPlan(student: Partial<Student>): StudyTask[] {
  const weakSubjects = student.subjectScores
    ? [...student.subjectScores].sort((a, b) => (a.internal1 + a.internal2) - (b.internal1 + b.internal2))
    : [];

  const primarySub = weakSubjects[0] ? weakSubjects[0].subjectName : 'Core Subject';
  const secondarySub = weakSubjects[1] ? weakSubjects[1].subjectName : 'Engineering Elective';

  const defaultTasks: StudyTask[] = [
    {
      id: 'task-1',
      subject: primarySub,
      topic: 'Foundations & Core Conceptual Revision',
      estimatedHours: 2.5,
      priority: 'High',
      completed: false,
      dayOfWeek: 'Monday',
      resourceLink: 'https://nptel.ac.in',
      notes: 'Review lecture notes & solved university question papers from previous 3 years.',
    },
    {
      id: 'task-2',
      subject: primarySub,
      topic: 'Problem Solving & Numerical Exercises',
      estimatedHours: 3.0,
      priority: 'High',
      completed: false,
      dayOfWeek: 'Tuesday',
      notes: 'Practice standard proofs, algorithms, and step-by-step problem sets.',
    },
    {
      id: 'task-3',
      subject: secondarySub,
      topic: 'Topic Deep Dive & Unit II Remedial Notes',
      estimatedHours: 2.0,
      priority: 'Medium',
      completed: false,
      dayOfWeek: 'Wednesday',
      notes: 'Consult faculty office hours for clarity on ambiguous theorems.',
    },
    {
      id: 'task-4',
      subject: 'Lab & Practical Applications',
      topic: 'Complete Backlog Lab Experiments & Viva Prep',
      estimatedHours: 2.0,
      priority: 'Medium',
      completed: false,
      dayOfWeek: 'Thursday',
      notes: 'Ensure code compilation / circuit diagrams are verified and signed by lab in-charge.',
    },
    {
      id: 'task-5',
      subject: primarySub,
      topic: 'Timed Mock Quiz & Self-Assessment',
      estimatedHours: 1.5,
      priority: 'High',
      completed: false,
      dayOfWeek: 'Friday',
      notes: 'Attempt 30-minute timed section test without reference book.',
    },
    {
      id: 'task-6',
      subject: 'Weekly Review',
      topic: 'Mentor Session Preparation & Progress Sync',
      estimatedHours: 1.0,
      priority: 'Low',
      completed: false,
      dayOfWeek: 'Saturday',
      notes: 'Summarize doubts to discuss during weekly mentoring appointment.',
    },
  ];

  return defaultTasks;
}
