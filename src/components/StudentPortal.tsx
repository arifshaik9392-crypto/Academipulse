import React, { useState } from 'react';
import { Student } from '../types';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { StudyPlanner } from './StudyPlanner';

interface StudentPortalProps {
  student: Student;
  allStudents: Student[];
  onOpenMarksModal: (student: Student) => void;
  onRequestMeeting: (student: Student) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  student,
  allStudents,
  onOpenMarksModal,
  onRequestMeeting,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'planner'>('overview');
  const [meetingRequested, setMeetingRequested] = useState(false);

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  const completedTasks = student.studyTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      
      {/* Student Welcome Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-md">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
            Student Academic Support Portal
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Welcome, {student.name}!
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            Roll No: <span className="font-mono font-semibold text-white">{student.rollNumber}</span> • {student.department} Engineering Sem {student.semester} - Section {student.section}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {meetingRequested ? (
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Meeting Request Sent to {student.mentorName}
            </div>
          ) : (
            <button
              onClick={() => {
                onRequestMeeting(student);
                setMeetingRequested(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-indigo-600" />
              Request 1-on-1 Mentor Meeting
            </button>
          )}

          <button
            onClick={() => onOpenMarksModal(student)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2"
          >
            Simulate Marks Improvement
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Academic Progress & Diagnostics
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'planner'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          My Weekly Study Planner ({completedTasks}/{student.studyTasks.length} Done)
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* Transparent Academic Status & Early Warning Explanation */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                  Current Academic Health Status
                </span>
                <div className="mt-1 flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadge(student.riskCategory)}`}>
                    {student.riskCategory} Support Priority
                  </span>
                  <span className="text-sm font-bold font-mono text-slate-700">
                    Calculated Score: {student.riskScore} / 100
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Faculty Mentor Assigned</span>
                <span className="text-sm font-bold text-slate-800">{student.mentorName}</span>
              </div>
            </div>

            {/* Empathetic Transparent Explanation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Why are you seeing this alert? (Transparent Factors)
              </h4>
              <ul className="space-y-1.5">
                {student.riskBreakdown.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs text-indigo-900 font-medium">
                💡 <strong>Advice for you:</strong> {student.riskBreakdown.suggestedAction}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Attendance</span>
              <div className="text-2xl font-black font-mono text-slate-900 mt-2 flex items-baseline gap-2">
                {student.overallAttendance}%
                {student.overallAttendance < 75 && (
                  <span className="text-xs font-bold text-rose-600 font-sans">Shortage</span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                College mandatory requirement is 75% for exam hall ticket eligibility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Weakest Focus Area</span>
              <div className="text-xl font-bold text-rose-600 mt-2 truncate">
                {student.riskBreakdown.primaryWeakSubject || 'None Identified'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Allocating 30 mins daily practice here will provide the quickest rebound.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Study Tasks Progress</span>
              <div className="text-2xl font-black font-mono text-indigo-600 mt-2">
                {completedTasks} / {student.studyTasks.length} Completed
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Switch to the "Study Planner" tab to tick off today's study goals.
              </p>
            </div>
          </div>

          {/* Subject-Wise Performance Cards */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              My Subject Scores & Progress
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {student.subjectScores.map((sub) => {
                const totalInternal = sub.internal1 + sub.internal2;
                const diff = sub.internal2 - sub.internal1;

                return (
                  <div
                    key={sub.subjectCode}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{sub.subjectName}</h4>
                        <span className="text-[11px] font-mono text-slate-400">{sub.subjectCode}</span>
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          totalInternal < 40
                            ? 'bg-rose-100 text-rose-800'
                            : totalInternal < 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {totalInternal}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-100">
                      <div className="p-1.5 rounded-lg bg-slate-50">
                        <span className="text-[10px] text-slate-400 block">Int 1</span>
                        <span className="font-mono font-bold text-slate-800">{sub.internal1}/50</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50">
                        <span className="text-[10px] text-slate-400 block">Int 2</span>
                        <span className="font-mono font-bold text-slate-800">{sub.internal2}/50</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50">
                        <span className="text-[10px] text-slate-400 block">Attendance</span>
                        <span
                          className={`font-mono font-bold ${
                            sub.attendance < 75 ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {sub.attendance}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Assignments: {sub.assignment}/20</span>
                      {diff < 0 ? (
                        <span className="text-rose-600 font-bold flex items-center">
                          <TrendingDown className="w-3 h-3 mr-0.5" /> Dropped {diff}
                        </span>
                      ) : diff > 0 ? (
                        <span className="text-emerald-600 font-bold flex items-center">
                          <TrendingUp className="w-3 h-3 mr-0.5" /> Gained +{diff}
                        </span>
                      ) : (
                        <span className="text-slate-400">Stable</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Study Planner View */
        <StudyPlanner
          students={allStudents}
          selectedStudentId={student.id}
          onSelectStudentId={() => {}}
          isStudentRole={true}
        />
      )}

    </div>
  );
};
