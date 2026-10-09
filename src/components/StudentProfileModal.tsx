import React from 'react';
import { Student } from '../types';
import { X, Award, AlertTriangle, Calendar, BookOpen, Clock, UserCheck, Edit3, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenMarksModal: (student: Student) => void;
  onOpenInterventionModal: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenMarksModal,
  onOpenInterventionModal,
}) => {
  if (!isOpen || !student) return null;

  const getRiskBadge = (category: string) => {
    switch (category) {
      case 'Critical':
        return 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-500/20';
      case 'High':
        return 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-500/20';
      case 'Moderate':
        return 'bg-yellow-50 text-yellow-700 border-yellow-300 ring-yellow-500/20';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-500/20';
    }
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 70) return 'bg-rose-500';
    if (score >= 50) return 'bg-amber-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ring-2 ${getRiskBadge(student.riskCategory)}`}>
                  {student.riskCategory} Risk ({student.riskScore}/100)
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Roll No: <span className="font-mono font-semibold text-slate-700">{student.rollNumber}</span> • {student.department} Engineering • Sem {student.semester} - Section {student.section}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenMarksModal(student);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Update Marks
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenInterventionModal(student);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Log Mentoring
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Overall Attendance</span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1 flex items-baseline gap-1">
                {student.overallAttendance}%
                {student.overallAttendance < 75 && (
                  <span className="text-xs text-rose-600 font-sans font-bold">Deficit</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Early Warning Score</span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                {student.riskScore} <span className="text-xs text-slate-400 font-sans font-normal">/ 100</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Faculty Mentor</span>
              <div className="text-sm font-bold text-slate-800 mt-1 truncate">
                {student.mentorName}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium text-slate-500">Weakest Focus Area</span>
              <div className="text-sm font-bold text-rose-700 mt-1 truncate">
                {student.riskBreakdown.primaryWeakSubject || 'None Identified'}
              </div>
            </div>
          </div>

          {/* Transparent Risk Formula Breakdown */}
          <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Transparent Risk Score Breakdown (Weights Applied)
              </h3>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Formula: (Marks×40%) + (Att×30%) + (Trend×15%) + (Assign×15%)
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Marks Penalty (40%)</div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {student.riskBreakdown.marksPenalty}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-rose-500 h-full" style={{ width: `${student.riskBreakdown.marksPenalty}%` }} />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Attendance Penalty (30%)</div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {student.riskBreakdown.attendancePenalty}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${student.riskBreakdown.attendancePenalty}%` }} />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Trend Penalty (15%)</div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {student.riskBreakdown.trendPenalty}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${student.riskBreakdown.trendPenalty}%` }} />
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500">Assignment Penalty (15%)</div>
                <div className="text-lg font-bold font-mono text-slate-800 mt-1">
                  {student.riskBreakdown.assignmentPenalty}
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-500 h-full" style={{ width: `${student.riskBreakdown.assignmentPenalty}%` }} />
                </div>
              </div>
            </div>

            {/* Identified Factors */}
            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Identified Primary Factors:</span>
              <ul className="mt-2 space-y-1">
                {student.riskBreakdown.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Subject Performance Breakdown Table */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Subject Performance Matrix
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Int 1 (/50)</th>
                    <th className="py-2.5 px-3 text-center">Int 2 (/50)</th>
                    <th className="py-2.5 px-3 text-center">Aggregate (/100)</th>
                    <th className="py-2.5 px-3 text-center">Assign (/20)</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-right">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {student.subjectScores.map((sub) => {
                    const total = sub.internal1 + sub.internal2;
                    const diff = sub.internal2 - sub.internal1;
                    return (
                      <tr key={sub.subjectCode} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{sub.subjectName}</div>
                          <div className="text-xs font-mono text-slate-400">{sub.subjectCode}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          <span className={sub.internal1 < 20 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            {sub.internal1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium">
                          <span className={sub.internal2 < 20 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                            {sub.internal2}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                              total < 40
                                ? 'bg-rose-100 text-rose-800'
                                : total < 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {total}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-700">
                          {sub.assignment}/20
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`font-mono text-xs font-bold ${
                              sub.attendance < 75 ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {sub.attendance}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs">
                          {diff > 0 ? (
                            <span className="text-emerald-600 font-bold">+{diff} (up)</span>
                          ) : diff < 0 ? (
                            <span className="text-rose-600 font-bold">{diff} (drop)</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Study Plan Mini Preview */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Active Study Plan Tasks ({student.studyTasks.filter(t => t.completed).length}/{student.studyTasks.length} Completed)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {student.studyTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-medium text-slate-800">
                    <span className="truncate">{task.subject}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                      {task.dayOfWeek}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1 line-clamp-1">{task.topic}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
