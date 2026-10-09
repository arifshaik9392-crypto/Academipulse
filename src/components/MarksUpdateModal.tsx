import React, { useState, useEffect } from 'react';
import { Student, SubjectScore, RiskBreakdown, AcademicSettings } from '../types';
import { calculateRisk, DEFAULT_SETTINGS } from '../services/riskEngine';
import { loadSettings, updateSingleStudentMarks } from '../services/storage';
import { X, CheckCircle, AlertTriangle, ArrowRight, Sparkles, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface MarksUpdateModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Student) => void;
}

export const MarksUpdateModal: React.FC<MarksUpdateModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !student) return null;

  const [settings, setSettings] = useState<AcademicSettings>(DEFAULT_SETTINGS);
  const [overallAttendance, setOverallAttendance] = useState<number>(student.overallAttendance);
  const [scores, setScores] = useState<SubjectScore[]>([]);
  const [liveBreakdown, setLiveBreakdown] = useState<RiskBreakdown>(student.riskBreakdown);

  useEffect(() => {
    setSettings(loadSettings());
    setOverallAttendance(student.overallAttendance);
    setScores(JSON.parse(JSON.stringify(student.subjectScores)));
  }, [student]);

  // Recalculate risk on any field change
  useEffect(() => {
    if (scores.length > 0) {
      const computed = calculateRisk(scores, overallAttendance, settings);
      setLiveBreakdown(computed);
    }
  }, [scores, overallAttendance, settings]);

  const handleScoreChange = (
    index: number,
    field: 'internal1' | 'internal2' | 'assignment' | 'attendance',
    value: number
  ) => {
    setScores((prev) => {
      const updated = [...prev];
      const maxVal = field === 'internal1' || field === 'internal2' ? 50 : field === 'assignment' ? 20 : 100;
      const cleanVal = Math.max(0, Math.min(maxVal, isNaN(value) ? 0 : value));
      updated[index] = {
        ...updated[index],
        [field]: cleanVal,
      };
      return updated;
    });
  };

  const handleSave = () => {
    const updated = updateSingleStudentMarks(student.id, scores, overallAttendance);
    if (updated) {
      onSuccess(updated);
      onClose();
    }
  };

  const getCategoryBadgeClass = (category: string) => {
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

  const scoreDiff = liveBreakdown.totalScore - student.riskScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                Live Simulator
              </span>
              <h2 className="text-xl font-bold text-slate-900">Update Marks & Attendance</h2>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Editing for <strong className="text-slate-800">{student.name}</strong> ({student.rollNumber}) • {student.department} Sem {student.semester} - Sec {student.section}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Impact Preview Header Banner */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Previous Risk</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getCategoryBadgeClass(student.riskCategory)}`}>
                  {student.riskCategory}
                </span>
                <span className="text-lg font-bold font-mono text-slate-200">{student.riskScore}</span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0" />

            <div>
              <span className="text-xs uppercase tracking-wider text-indigo-200 font-semibold">Live Calculated Risk</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${getCategoryBadgeClass(liveBreakdown.category)}`}>
                  {liveBreakdown.category}
                </span>
                <span className="text-2xl font-black font-mono text-white">{liveBreakdown.totalScore}</span>
                {scoreDiff !== 0 && (
                  <span
                    className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                      scoreDiff < 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {scoreDiff < 0 ? <TrendingDown className="w-3.5 h-3.5 mr-1" /> : <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                    {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-indigo-300 block">Recommended Intervention:</span>
            <span className="text-xs font-medium text-slate-200 max-w-sm block text-left sm:text-right line-clamp-1">
              {liveBreakdown.suggestedAction}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Overall Attendance Slider */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                Overall Attendance Percentage
                {overallAttendance < settings.attendanceCutoff ? (
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Below {settings.attendanceCutoff}% Cutoff
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Meets Mandatory Requirement
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={overallAttendance}
                  onChange={(e) => setOverallAttendance(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-16 px-2 py-1 text-right font-mono font-bold text-slate-800 border border-slate-300 rounded-lg text-sm"
                />
                <span className="text-sm font-bold text-slate-600">%</span>
              </div>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              step="0.5"
              value={overallAttendance}
              onChange={(e) => setOverallAttendance(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
              <span>30%</span>
              <span className="font-semibold text-rose-500">{settings.attendanceCutoff}% (Cutoff)</span>
              <span>100%</span>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Subject Performance (Internal 1, Internal 2 & Assignments)
              </h3>
              <span className="text-xs text-slate-500">Max marks: Int 1 (50) • Int 2 (50) • Assign (20)</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 w-28">Internal 1 (/50)</th>
                    <th className="py-2.5 px-3 w-28">Internal 2 (/50)</th>
                    <th className="py-2.5 px-3 w-28">Assign (/20)</th>
                    <th className="py-2.5 px-3 w-28">Subj Att (%)</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {scores.map((sub, idx) => {
                    const total = sub.internal1 + sub.internal2;
                    const isFailing = sub.internal1 < 20 || sub.internal2 < 20;
                    const isDropping = sub.internal2 < sub.internal1 - 4;

                    return (
                      <tr key={sub.subjectCode} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{sub.subjectName}</div>
                          <div className="text-xs font-mono text-slate-400">{sub.subjectCode}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sub.internal1}
                            onChange={(e) => handleScoreChange(idx, 'internal1', Number(e.target.value))}
                            className={`w-20 px-2 py-1 text-center font-mono font-semibold border rounded-lg text-sm ${
                              sub.internal1 < 20 ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-300 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={sub.internal2}
                            onChange={(e) => handleScoreChange(idx, 'internal2', Number(e.target.value))}
                            className={`w-20 px-2 py-1 text-center font-mono font-semibold border rounded-lg text-sm ${
                              sub.internal2 < 20 ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-300 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={sub.assignment}
                            onChange={(e) => handleScoreChange(idx, 'assignment', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-center font-mono font-semibold border border-slate-300 rounded-lg text-sm text-slate-800"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={sub.attendance}
                            onChange={(e) => handleScoreChange(idx, 'attendance', Number(e.target.value))}
                            className={`w-20 px-2 py-1 text-center font-mono font-semibold border rounded-lg text-sm ${
                              sub.attendance < 75 ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-300 text-slate-800'
                            }`}
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isFailing && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                                Backlog Risk
                              </span>
                            )}
                            {isDropping && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
                                Sharp Drop
                              </span>
                            )}
                            {!isFailing && !isDropping && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                                Good ({total}%)
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Early Warning Factors */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Live Identified Risk Factors & Early Warning Drivers
            </h4>
            <ul className="space-y-1">
              {liveBreakdown.reasons.map((r, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Changes will immediately update student profile, dashboard analytics & study plan.
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 rounded-xl flex items-center gap-2 transition-transform active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              Apply & Recalculate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
