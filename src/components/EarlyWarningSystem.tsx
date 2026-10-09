import React, { useState } from 'react';
import { Student, AcademicSettings, RiskCategory } from '../types';
import { calculateRisk } from '../services/riskEngine';
import { saveSettings, saveStudents } from '../services/storage';
import {
  ShieldAlert,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  TrendingDown,
  RefreshCw,
  UserCheck,
  Edit3,
  BookOpen,
} from 'lucide-react';

interface EarlyWarningSystemProps {
  students: Student[];
  settings: AcademicSettings;
  onSettingsUpdated: (newSettings: AcademicSettings) => void;
  onStudentsUpdated: (updatedStudents: Student[]) => void;
  onOpenMarksModal: (student: Student) => void;
  onOpenProfileModal: (student: Student) => void;
  onOpenInterventionModal: (student: Student) => void;
}

export const EarlyWarningSystem: React.FC<EarlyWarningSystemProps> = ({
  students,
  settings,
  onSettingsUpdated,
  onStudentsUpdated,
  onOpenMarksModal,
  onOpenProfileModal,
  onOpenInterventionModal,
}) => {
  // Configurable weights state
  const [marksWeight, setMarksWeight] = useState(Math.round(settings.internalMarksWeight * 100));
  const [attWeight, setAttWeight] = useState(Math.round(settings.attendanceWeight * 100));
  const [trendWeight, setTrendWeight] = useState(Math.round(settings.trendWeight * 100));
  const [assignWeight, setAssignWeight] = useState(Math.round(settings.assignmentsWeight * 100));
  const [attCutoff, setAttCutoff] = useState(settings.attendanceCutoff);
  const [saveToast, setSaveToast] = useState(false);

  // Simulator state
  const [simStudentId, setSimStudentId] = useState<string>(
    students.find((s) => s.riskCategory === 'Critical')?.id || students[0]?.id || ''
  );
  const simStudent = students.find((s) => s.id === simStudentId) || students[0];

  const [simAttendance, setSimAttendance] = useState<number>(simStudent ? simStudent.overallAttendance : 75);
  const [simMarksBoost, setSimMarksBoost] = useState<number>(0);

  // Recalculate simulated student
  const simulatedBreakdown = React.useMemo(() => {
    if (!simStudent) return null;
    const adjustedScores = simStudent.subjectScores.map((sub) => ({
      ...sub,
      internal2: Math.min(50, sub.internal2 + simMarksBoost),
    }));
    return calculateRisk(adjustedScores, simAttendance, {
      ...settings,
      internalMarksWeight: marksWeight / 100,
      attendanceWeight: attWeight / 100,
      trendWeight: trendWeight / 100,
      assignmentsWeight: assignWeight / 100,
      attendanceCutoff: attCutoff,
    });
  }, [simStudent, simAttendance, simMarksBoost, marksWeight, attWeight, trendWeight, assignWeight, attCutoff, settings]);

  const handleApplyWeights = () => {
    const totalWeight = marksWeight + attWeight + trendWeight + assignWeight;
    // Normalize to 1.0
    const normalizedSettings: AcademicSettings = {
      ...settings,
      internalMarksWeight: marksWeight / totalWeight,
      attendanceWeight: attWeight / totalWeight,
      trendWeight: trendWeight / totalWeight,
      assignmentsWeight: assignWeight / totalWeight,
      attendanceCutoff: attCutoff,
    };

    saveSettings(normalizedSettings);
    onSettingsUpdated(normalizedSettings);

    // Recalculate every student
    const recomputedStudents = students.map((stu) => {
      const breakdown = calculateRisk(stu.subjectScores, stu.overallAttendance, normalizedSettings);
      return {
        ...stu,
        riskScore: breakdown.totalScore,
        riskCategory: breakdown.category,
        riskBreakdown: breakdown,
        lastUpdated: new Date().toISOString(),
      };
    });

    saveStudents(recomputedStudents);
    onStudentsUpdated(recomputedStudents);

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const getRiskBadge = (category: RiskCategory) => {
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

  const currentWeightSum = marksWeight + attWeight + trendWeight + assignWeight;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            Early Warning System (EWS) Engine
          </h2>
          <p className="text-xs text-slate-500">
            Multi-factor composite scoring engine with configurable institutional weights and root-cause analysis.
          </p>
        </div>
      </div>

      {/* 4 Risk Categories Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-800">Critical Risk</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900">
              Score &ge; 70
            </span>
          </div>
          <p className="text-xs text-rose-900 mt-2 font-medium">
            Imminent semester failure or detainment. Trigger mandatory parent alert, remedial tutorials & HOD review.
          </p>
          <div className="mt-3 text-xs font-bold text-rose-700">
            {students.filter((s) => s.riskCategory === 'Critical').length} Students in Cohort
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-800">High Risk</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
              Score 50 - 69
            </span>
          </div>
          <p className="text-xs text-amber-900 mt-2 font-medium">
            Noticeable academic distress, 2+ weak subjects or attendance drop. Assign faculty mentor & peer study buddy.
          </p>
          <div className="mt-3 text-xs font-bold text-amber-700">
            {students.filter((s) => s.riskCategory === 'High').length} Students in Cohort
          </div>
        </div>

        <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-yellow-800">Moderate Risk</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-yellow-200 text-yellow-900">
              Score 30 - 49
            </span>
          </div>
          <p className="text-xs text-yellow-900 mt-2 font-medium">
            Single weak module or marginal attendance. Send automated advisory nudge and study plan adjustments.
          </p>
          <div className="mt-3 text-xs font-bold text-yellow-700">
            {students.filter((s) => s.riskCategory === 'Moderate').length} Students in Cohort
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800">Low Risk</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
              Score &lt; 30
            </span>
          </div>
          <p className="text-xs text-emerald-900 mt-2 font-medium">
            Consistent performance, satisfactory attendance (&gt;80%), and timely submissions. Periodic standard review.
          </p>
          <div className="mt-3 text-xs font-bold text-emerald-700">
            {students.filter((s) => s.riskCategory === 'Low').length} Students in Cohort
          </div>
        </div>
      </div>

      {/* CONFIGURABLE RISK WEIGHTS PANEL */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Configurable Institutional Risk Scoring Weights
            </h3>
            <p className="text-xs text-slate-500">
              Adjust how strongly each factor influences the early warning threat calculation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${
                currentWeightSum === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              Sum: {currentWeightSum}%
            </span>
            <button
              onClick={handleApplyWeights}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              Apply Weights to All Students
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Weights applied! All {students.length} student risk scores and categories recalculated immediately.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          
          {/* Internal Exam Marks Weight */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Internal Marks Weight</span>
              <span className="font-mono font-bold text-indigo-600">{marksWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="70"
              value={marksWeight}
              onChange={(e) => setMarksWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Low exam scores & failing test units.</p>
          </div>

          {/* Attendance Weight */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Attendance Deficit Weight</span>
              <span className="font-mono font-bold text-indigo-600">{attWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={attWeight}
              onChange={(e) => setAttWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Absences below cutoff ({attCutoff}%).</p>
          </div>

          {/* Performance Drop / Trend Weight */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Declining Trend Weight</span>
              <span className="font-mono font-bold text-indigo-600">{trendWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={trendWeight}
              onChange={(e) => setTrendWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Drop in Internal 2 vs Internal 1.</p>
          </div>

          {/* Assignments Weight */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Assignment Incompletion</span>
              <span className="font-mono font-bold text-indigo-600">{assignWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={assignWeight}
              onChange={(e) => setAssignWeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Backlog lab and theory assignments.</p>
          </div>

        </div>
      </div>

      {/* WHAT-IF RISK SIMULATOR */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-300" />
              <h3 className="text-base font-bold text-white">
                Interactive "What-If" Academic Recovery Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate recovery trajectories: test how boosting attendance or scoring higher in retests drops risk.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Select Student:</span>
            <select
              value={simStudentId}
              onChange={(e) => {
                const id = e.target.value;
                setSimStudentId(id);
                const s = students.find((st) => st.id === id);
                if (s) {
                  setSimAttendance(s.overallAttendance);
                  setSimMarksBoost(0);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white border border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rollNumber}) - {s.riskCategory}
                </option>
              ))}
            </select>
          </div>
        </div>

        {simStudent && simulatedBreakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Simulation Controls */}
            <div className="lg:col-span-2 space-y-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-200">
                    Simulate Attendance Improvement
                  </span>
                  <span className="font-mono font-bold text-indigo-300">
                    {simAttendance}% (Current: {simStudent.overallAttendance}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="0.5"
                  value={simAttendance}
                  onChange={(e) => setSimAttendance(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer accent-indigo-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-200">
                    Simulate Retest Score Gain (Across Weak Subjects)
                  </span>
                  <span className="font-mono font-bold text-emerald-300">
                    +{simMarksBoost} Marks / Subject
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={simMarksBoost}
                  onChange={(e) => setSimMarksBoost(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer accent-emerald-400"
                />
              </div>

              <div className="text-xs text-slate-400">
                Simulating performance for <strong className="text-white">{simStudent.name}</strong> ({simStudent.department} S{simStudent.semester})
              </div>
            </div>

            {/* Simulated Outcome Card */}
            <div className="p-4 rounded-xl bg-white/10 border border-white/15 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                  Simulated Outcome
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <div className="text-3xl font-black font-mono text-white">
                    {simulatedBreakdown.totalScore}
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getRiskBadge(
                      simulatedBreakdown.category
                    )}`}
                  >
                    {simulatedBreakdown.category} Risk
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-300">
                  Previous Risk Score: <strong className="text-white font-mono">{simStudent.riskScore}</strong>{' '}
                  ({simStudent.riskCategory})
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-300">
                  <span className="text-slate-400 block font-semibold mb-1">Remaining Diagnostic Triggers:</span>
                  <ul className="space-y-1">
                    {simulatedBreakdown.reasons.map((r, i) => (
                      <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-2">
                <button
                  onClick={() => onOpenMarksModal(simStudent)}
                  className="w-full py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs"
                >
                  Apply Live in Student Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL EARLY WARNING COHORT REGISTRY */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          All Cohort Early Warning Status Cards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((stu) => (
            <div
              key={stu.id}
              className={`p-4 rounded-xl border bg-white transition-all hover:shadow-md ${
                stu.riskCategory === 'Critical'
                  ? 'border-rose-300 shadow-rose-100/50'
                  : stu.riskCategory === 'High'
                  ? 'border-amber-300 shadow-amber-100/50'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{stu.name}</h4>
                  <div className="text-xs text-slate-500 font-mono">
                    {stu.rollNumber} • {stu.department} S{stu.semester}-{stu.section}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs border font-bold ${getRiskBadge(stu.riskCategory)}`}>
                  {stu.riskCategory} ({stu.riskScore})
                </span>
              </div>

              {/* Reasons */}
              <div className="mt-3 space-y-1">
                {stu.riskBreakdown.reasons.map((reason, i) => (
                  <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenMarksModal(stu)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Update Marks
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenProfileModal(stu)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                    title="Profile"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenInterventionModal(stu)}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                  >
                    Intervene
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
