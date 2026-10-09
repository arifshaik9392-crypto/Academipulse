import React from 'react';
import { Student, Intervention, AcademicSettings } from '../types';
import {
  Users,
  AlertTriangle,
  Award,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardProps {
  students: Student[];
  interventions: Intervention[];
  settings: AcademicSettings;
  onNavigateTab: (tab: string, filterParams?: any) => void;
  onOpenMarksModal: (student: Student) => void;
  onOpenProfileModal: (student: Student) => void;
  onOpenInterventionModal: (student: Student) => void;
}

const RISK_COLORS = {
  Low: '#10b981', // emerald
  Moderate: '#eab308', // yellow
  High: '#f97316', // orange
  Critical: '#ef4444', // red
};

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  interventions,
  settings,
  onNavigateTab,
  onOpenMarksModal,
  onOpenProfileModal,
  onOpenInterventionModal,
}) => {
  // Aggregate KPIs
  const totalStudents = students.length;
  const criticalStudents = students.filter((s) => s.riskCategory === 'Critical');
  const highStudents = students.filter((s) => s.riskCategory === 'High');
  const moderateStudents = students.filter((s) => s.riskCategory === 'Moderate');
  const lowStudents = students.filter((s) => s.riskCategory === 'Low');

  const needingSupportCount = criticalStudents.length + highStudents.length;
  const needingSupportPct = totalStudents > 0 ? ((needingSupportCount / totalStudents) * 100).toFixed(0) : 0;

  const avgAttendance =
    totalStudents > 0
      ? (students.reduce((acc, s) => acc + s.overallAttendance, 0) / totalStudents).toFixed(1)
      : '0';

  const belowCutoffCount = students.filter((s) => s.overallAttendance < settings.attendanceCutoff).length;

  // Average Marks calculation across all students
  let totalInternalScoreSum = 0;
  let totalSubjectCount = 0;
  students.forEach((s) => {
    s.subjectScores.forEach((sub) => {
      totalInternalScoreSum += sub.internal1 + sub.internal2;
      totalSubjectCount++;
    });
  });
  const avgInstitutionalScore =
    totalSubjectCount > 0 ? (totalInternalScoreSum / totalSubjectCount).toFixed(1) : '0';

  // Pie chart data for risk distribution
  const riskDistributionData = [
    { name: 'Low Risk', value: lowStudents.length, color: RISK_COLORS.Low },
    { name: 'Moderate Risk', value: moderateStudents.length, color: RISK_COLORS.Moderate },
    { name: 'High Risk', value: highStudents.length, color: RISK_COLORS.High },
    { name: 'Critical Risk', value: criticalStudents.length, color: RISK_COLORS.Critical },
  ];

  // Department-wise distribution
  const departments = ['CSE', 'ECE', 'MECH'] as const;
  const deptRiskData = departments.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept);
    return {
      department: dept,
      Low: deptStudents.filter((s) => s.riskCategory === 'Low').length,
      Moderate: deptStudents.filter((s) => s.riskCategory === 'Moderate').length,
      High: deptStudents.filter((s) => s.riskCategory === 'High').length,
      Critical: deptStudents.filter((s) => s.riskCategory === 'Critical').length,
      total: deptStudents.length,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Mission Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              Continuous Predictive Early Warning Active
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Academic Performance & Early Warning System
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Identifying at-risk engineering undergraduates through multi-factor indicators: low marks, declining internal trajectories, attendance deficits, and incomplete assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('early-warning')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-all shadow-md flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Configure Risk Weights
            </button>
            <button
              onClick={() => onNavigateTab('students')}
              className="px-4 py-2.5 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-bold text-xs border border-indigo-400/30 transition-all flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              Manage All Students
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalStudents}</span>
            <span className="text-xs font-medium text-slate-500">Undergraduates</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            Across CSE, ECE, & MECH Departments
          </div>
        </div>

        {/* Students Needing Academic Support */}
        <div
          onClick={() => onNavigateTab('students', { risk: 'Critical' })}
          className="p-5 rounded-2xl bg-white border border-rose-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Needing Support</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">{needingSupportCount}</span>
            <span className="text-xs font-bold text-rose-500">({needingSupportPct}% of cohort)</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{criticalStudents.length} Critical • {highStudents.length} High</span>
            <span className="text-rose-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center">
              View <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Average Attendance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Attendance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{avgAttendance}%</span>
            <span className="text-xs font-semibold text-slate-400">Institutional</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            {belowCutoffCount > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {belowCutoffCount} students below {settings.attendanceCutoff}%
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> All above cutoff
              </span>
            )}
          </div>
        </div>

        {/* Average Academic Score */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Internal Score</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{avgInstitutionalScore}%</span>
            <span className="text-xs font-semibold text-slate-400">Across Units</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Passing cutoff: {settings.marksPassingThreshold}%</span>
            <span className="text-xs text-indigo-600 font-bold">{interventions.length} Interventions</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Category Distribution Pie / Ring Chart */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Risk Distribution Matrix
              </h3>
              <p className="text-xs text-slate-400">Student cohort partitioned by threat level</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{totalStudents} Total</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Students`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {riskDistributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department-wise Risk Breakdown Bar Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Department-Wise Risk Stratification
              </h3>
              <p className="text-xs text-slate-400">Comparative risk counts in CSE, ECE, and Mechanical</p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptRiskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="department" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Critical" fill={RISK_COLORS.Critical} radius={[4, 4, 0, 0]} />
                <Bar dataKey="High" fill={RISK_COLORS.High} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Moderate" fill={RISK_COLORS.Moderate} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Low" fill={RISK_COLORS.Low} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Critical Early Warning Intervention Queue Banner */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <h3 className="text-base font-bold text-rose-950">
                Immediate Action Queue: Students Flagged in Critical & High Risk
              </h3>
            </div>
            <p className="text-xs text-rose-700 mt-0.5">
              These students meet composite warning triggers (low attendance, steep performance drops, or multiple failing internal tests).
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('students', { risk: 'Critical' })}
            className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded-xl hover:bg-rose-100 transition-colors shrink-0 shadow-2xs"
          >
            Filter All Flagged ({needingSupportCount})
          </button>
        </div>

        {/* Flagged Students Card List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...criticalStudents, ...highStudents].slice(0, 3).map((stu) => (
            <div
              key={stu.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{stu.name}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {stu.rollNumber} • {stu.department} Sem {stu.semester}-{stu.section}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                      stu.riskCategory === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {stu.riskCategory} ({stu.riskScore})
                  </span>
                </div>

                {/* Primary Reasons */}
                <div className="mt-3 space-y-1">
                  {stu.riskBreakdown.reasons.slice(0, 2).map((r, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span className="line-clamp-1">{r}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Attendance:</span>
                  <span
                    className={`font-mono font-bold ${
                      stu.overallAttendance < 75 ? 'text-rose-600' : 'text-slate-700'
                    }`}
                  >
                    {stu.overallAttendance}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2 flex items-center gap-2">
                <button
                  onClick={() => onOpenMarksModal(stu)}
                  className="flex-1 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-center"
                >
                  Update Marks
                </button>
                <button
                  onClick={() => onOpenInterventionModal(stu)}
                  className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-center shadow-2xs"
                >
                  Intervene
                </button>
                <button
                  onClick={() => onOpenProfileModal(stu)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="View full profile"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
