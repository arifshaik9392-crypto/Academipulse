import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Activity, Flame, BookOpen, AlertOctagon, TrendingUp, TrendingDown, Layers, HelpCircle } from 'lucide-react';

interface AcademicAnalyticsProps {
  students: Student[];
  onOpenMarksModal: (student: Student) => void;
}

export const AcademicAnalytics: React.FC<AcademicAnalyticsProps> = ({
  students,
  onOpenMarksModal,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>('CSE');
  const [hoveredCell, setHoveredCell] = useState<{
    studentName: string;
    subjectName: string;
    score: number;
    int1: number;
    int2: number;
    attendance: number;
  } | null>(null);

  const deptStudents = useMemo(() => {
    return students.filter((s) => s.department === selectedDept);
  }, [students, selectedDept]);

  // Aggregate subject performance for the selected department
  const subjectAnalytics = useMemo(() => {
    const map: Record<
      string,
      { code: string; name: string; int1Sum: number; int2Sum: number; count: number; failCount: number }
    > = {};

    deptStudents.forEach((stu) => {
      stu.subjectScores.forEach((sub) => {
        if (!map[sub.subjectCode]) {
          map[sub.subjectCode] = {
            code: sub.subjectCode,
            name: sub.subjectName,
            int1Sum: 0,
            int2Sum: 0,
            count: 0,
            failCount: 0,
          };
        }
        map[sub.subjectCode].int1Sum += sub.internal1;
        map[sub.subjectCode].int2Sum += sub.internal2;
        map[sub.subjectCode].count += 1;
        if (sub.internal1 < 20 || sub.internal2 < 20) {
          map[sub.subjectCode].failCount += 1;
        }
      });
    });

    return Object.values(map).map((item) => ({
      code: item.code,
      name: item.name.length > 20 ? item.code : item.name,
      fullName: item.name,
      avgInt1: Number((item.int1Sum / (item.count || 1)).toFixed(1)),
      avgInt2: Number((item.int2Sum / (item.count || 1)).toFixed(1)),
      avgTotal: Number(((item.int1Sum + item.int2Sum) / (item.count || 1)).toFixed(1)),
      failureRate: Number(((item.failCount / (item.count || 1)) * 100).toFixed(0)),
    }));
  }, [deptStudents]);

  // Unique subjects for heatmap columns
  const heatmapSubjects = useMemo(() => {
    if (deptStudents.length === 0) return [];
    return deptStudents[0].subjectScores.map((s) => ({
      code: s.subjectCode,
      name: s.subjectName,
    }));
  }, [deptStudents]);

  // Scatter plot data: Attendance vs Average Marks
  const scatterData = useMemo(() => {
    return students.map((s) => {
      const avgMarks =
        s.subjectScores.reduce((acc, sub) => acc + sub.internal1 + sub.internal2, 0) /
        s.subjectScores.length;
      return {
        name: s.name,
        roll: s.rollNumber,
        attendance: s.overallAttendance,
        marks: Number(avgMarks.toFixed(1)),
        risk: s.riskScore,
        category: s.riskCategory,
      };
    });
  }, [students]);

  // Trajectory counts
  const trajectoryStats = useMemo(() => {
    let improved = 0;
    let declined = 0;
    let stable = 0;

    students.forEach((s) => {
      const avg1 = s.subjectScores.reduce((acc, c) => acc + c.internal1, 0) / s.subjectScores.length;
      const avg2 = s.subjectScores.reduce((acc, c) => acc + c.internal2, 0) / s.subjectScores.length;
      const diff = avg2 - avg1;
      if (diff > 1.5) improved++;
      else if (diff < -1.5) declined++;
      else stable++;
    });

    return { improved, declined, stable };
  }, [students]);

  const getHeatmapColor = (pct: number) => {
    if (pct >= 75) return 'bg-emerald-500 text-white';
    if (pct >= 60) return 'bg-emerald-300 text-emerald-950 font-semibold';
    if (pct >= 50) return 'bg-amber-300 text-amber-950 font-semibold';
    if (pct >= 40) return 'bg-amber-500 text-white font-bold';
    return 'bg-rose-500 text-white font-bold';
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Department Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Academic Analytics & Trajectory Intelligence
          </h2>
          <p className="text-xs text-slate-500">
            Internal exam comparisons, failure bottlenecks, student-subject heatmaps, and attendance correlations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filter Department:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {['CSE', 'ECE', 'MECH'].map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1 font-bold rounded-lg transition-all ${
                  selectedDept === dept ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trajectory Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800">Upward Trajectory</span>
            <div className="text-xl font-black text-emerald-950 font-mono">
              {trajectoryStats.improved} Students
            </div>
            <span className="text-[11px] text-emerald-700">Scored higher in Int 2 vs Int 1</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-rose-800">Declining Momentum</span>
            <div className="text-xl font-black text-rose-950 font-mono">
              {trajectoryStats.declined} Students
            </div>
            <span className="text-[11px] text-rose-700">Significant drop between internals</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700">Stable Performance</span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {trajectoryStats.stable} Students
            </div>
            <span className="text-[11px] text-slate-600">Consistent scores (±1.5%)</span>
          </div>
        </div>
      </div>

      {/* Subject Comparison Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Internal 1 vs Internal 2 Subject Comparison */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Internal 1 vs Internal 2 Average Marks
              </h3>
              <p className="text-xs text-slate-400">Department of {selectedDept} (Max 50 per test)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 50]} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} / 50`, name === 'avgInt1' ? 'Internal 1' : 'Internal 2']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="avgInt1" name="Internal 1" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgInt2" name="Internal 2" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Failure / Vulnerability Rate */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                Subject Vulnerability & Backlog Risk Rate
              </h3>
              <p className="text-xs text-slate-400">% of students scoring below 20/50 in {selectedDept}</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="code" stroke="#64748b" fontSize={11} interval={0} />
                <YAxis stroke="#64748b" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(val: any) => [`${val}% of Students At-Risk`, 'Failure Rate']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="failureRate" name="Failure Vulnerability" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* COLOR-CODED SUBJECT PERFORMANCE HEATMAP */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Color-Coded Subject Performance Heatmap ({selectedDept})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid visual detection: Green (&gt;75%), Amber (50-74%), Red (&lt;50% critical shortage/failure). Click or hover any cell for diagnostics.
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" /> &gt;75% High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-400" /> 50-74% Moderate
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-rose-500" /> &lt;50% Critical
            </span>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-left w-48">Student (Roll No)</th>
                <th className="py-3 px-2 text-center w-24">Risk Tier</th>
                {heatmapSubjects.map((sub) => (
                  <th key={sub.code} className="py-3 px-2 text-center min-w-[100px]">
                    <div className="font-mono text-xs">{sub.code}</div>
                    <div className="text-[10px] text-slate-400 font-normal truncate max-w-[100px]">
                      {sub.name}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptStudents.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{stu.name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{stu.rollNumber}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stu.riskCategory === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : stu.riskCategory === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : stu.riskCategory === 'Moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {stu.riskCategory}
                    </span>
                  </td>

                  {stu.subjectScores.map((score) => {
                    const totalPct = score.internal1 + score.internal2;
                    return (
                      <td
                        key={score.subjectCode}
                        className="py-2.5 px-2 text-center p-1"
                        onMouseEnter={() =>
                          setHoveredCell({
                            studentName: stu.name,
                            subjectName: score.subjectName,
                            score: totalPct,
                            int1: score.internal1,
                            int2: score.internal2,
                            attendance: score.attendance,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`w-full py-1.5 rounded-lg text-xs font-mono transition-transform hover:scale-105 cursor-pointer shadow-2xs ${getHeatmapColor(
                            totalPct
                          )}`}
                          title={`${score.subjectName}: Int1=${score.internal1}, Int2=${score.internal2}, Att=${score.attendance}%`}
                        >
                          {totalPct}%
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => onOpenMarksModal(stu)}
                      className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Hover Diagnostic Detail Banner */}
        {hoveredCell && (
          <div className="mt-3 p-3 bg-slate-900 text-white rounded-xl text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
            <div>
              <span className="text-slate-400">Inspecting:</span>{' '}
              <strong className="text-white">{hoveredCell.studentName}</strong> • {hoveredCell.subjectName}
            </div>
            <div className="flex items-center gap-4 font-mono">
              <span>Internal 1: <strong className="text-indigo-300">{hoveredCell.int1}/50</strong></span>
              <span>Internal 2: <strong className="text-indigo-300">{hoveredCell.int2}/50</strong></span>
              <span>Total Aggregate: <strong className="text-emerald-400">{hoveredCell.score}%</strong></span>
              <span>Subject Attendance: <strong className="text-amber-300">{hoveredCell.attendance}%</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance vs Performance Correlation Scatter Plot */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Attendance vs Academic Marks Correlation
          </h3>
          <p className="text-xs text-slate-400">
            Clear correlation: Attendance below 75% clusters heavily with low marks and elevated risk warnings.
          </p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="attendance"
                name="Attendance"
                unit="%"
                domain={[50, 100]}
                stroke="#64748b"
                fontSize={11}
              />
              <YAxis
                type="number"
                dataKey="marks"
                name="Average Score"
                unit="%"
                domain={[20, 100]}
                stroke="#64748b"
                fontSize={11}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl font-sans">
                        <div className="font-bold">{data.name} ({data.roll})</div>
                        <div className="text-slate-300 mt-1">Attendance: {data.attendance}%</div>
                        <div className="text-slate-300">Avg Marks: {data.marks}%</div>
                        <div className="mt-1 font-bold text-amber-400">
                          Risk: {data.category} ({data.risk} pts)
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Students" data={scatterData} fill="#6366f1" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
