import React, { useState, useMemo } from 'react';
import { Student, Department, RiskCategory } from '../types';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  Edit3,
  UserCheck,
  BookOpen,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { calculateRisk, DEFAULT_SETTINGS, generateDefaultStudyPlan } from '../services/riskEngine';
import { saveStudents, loadStudents } from '../services/storage';

interface StudentManagementProps {
  students: Student[];
  onOpenMarksModal: (student: Student) => void;
  onOpenProfileModal: (student: Student) => void;
  onOpenInterventionModal: (student: Student) => void;
  onStudentListUpdated: (students: Student[]) => void;
  initialRiskFilter?: string;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  students,
  onOpenMarksModal,
  onOpenProfileModal,
  onOpenInterventionModal,
  onStudentListUpdated,
  initialRiskFilter = 'ALL',
}) => {
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>(initialRiskFilter);
  const [attendanceFilter, setAttendanceFilter] = useState<string>('ALL'); // 'ALL' | 'BELOW_75' | 'ABOVE_75'
  const [sortField, setSortField] = useState<'rollNumber' | 'name' | 'attendance' | 'riskScore'>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // New Student Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState<Department>('CSE');
  const [newSemester, setNewSemester] = useState<number>(4);
  const [newSection, setNewSection] = useState<string>('A');
  const [newAttendance, setNewAttendance] = useState<number>(80);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Search query
        if (search) {
          const q = search.toLowerCase();
          const matches =
            s.name.toLowerCase().includes(q) ||
            s.rollNumber.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Department
        if (selectedDept !== 'ALL' && s.department !== selectedDept) return false;

        // Section
        if (selectedSection !== 'ALL' && s.section !== selectedSection) return false;

        // Risk Category
        if (selectedRisk !== 'ALL' && s.riskCategory !== selectedRisk) return false;

        // Attendance Filter
        if (attendanceFilter === 'BELOW_75' && s.overallAttendance >= 75) return false;
        if (attendanceFilter === 'ABOVE_75' && s.overallAttendance < 75) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'attendance') {
          valA = a.overallAttendance;
          valB = b.overallAttendance;
        } else if (sortField === 'rollNumber') {
          valA = a.rollNumber;
          valB = b.rollNumber;
        } else if (sortField === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (sortField === 'riskScore') {
          valA = a.riskScore;
          valB = b.riskScore;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [students, search, selectedDept, selectedSection, selectedRisk, attendanceFilter, sortField, sortAsc]);

  const handleSort = (field: 'rollNumber' | 'name' | 'attendance' | 'riskScore') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'name' || field === 'rollNumber');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Name',
      'Email',
      'Department',
      'Semester',
      'Section',
      'Overall Attendance (%)',
      'Risk Score',
      'Risk Category',
      'Primary Weak Subject',
      'Mentor Faculty',
    ];

    const rows = filteredStudents.map((s) => [
      s.rollNumber,
      `"${s.name}"`,
      s.email,
      s.department,
      s.semester,
      s.section,
      s.overallAttendance,
      s.riskScore,
      s.riskCategory,
      `"${s.riskBreakdown.primaryWeakSubject || 'None'}"`,
      `"${s.mentorName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduPulse_Students_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRoll) return;

    // Default subject template for the selected department
    const sampleSubjects = [
      { code: `${newDept}401`, name: 'Core Foundations I', int1: 25, int2: 24, assign: 14, att: newAttendance },
      { code: `${newDept}402`, name: 'Core Engineering Systems', int1: 30, int2: 28, assign: 15, att: newAttendance },
      { code: `${newDept}403`, name: 'Engineering Analysis & Math', int1: 22, int2: 20, assign: 12, att: newAttendance },
      { code: `${newDept}404`, name: 'Laboratory Applications', int1: 35, int2: 36, assign: 18, att: newAttendance },
    ];

    const subjectScores = sampleSubjects.map((s, idx) => ({
      subjectId: `sub-${newDept.toLowerCase()}-${Date.now()}-${idx}`,
      subjectCode: s.code,
      subjectName: s.name,
      internal1: s.int1,
      internal2: s.int2,
      assignment: s.assign,
      attendance: s.att,
    }));

    const riskBreakdown = calculateRisk(subjectScores, newAttendance, DEFAULT_SETTINGS);

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      rollNumber: newRoll.toUpperCase().trim(),
      name: newName.trim(),
      email: newEmail.trim() || `${newRoll.toLowerCase()}@students.edupulse.edu`,
      department: newDept,
      semester: newSemester,
      section: newSection,
      mentorFacultyId: 'fac-1',
      mentorName: 'Dr. Priya Sharma',
      overallAttendance: newAttendance,
      subjectScores,
      riskCategory: riskBreakdown.category,
      riskScore: riskBreakdown.totalScore,
      riskBreakdown,
      previousRiskScore: riskBreakdown.totalScore,
      studyTasks: generateDefaultStudyPlan({ subjectScores, name: newName }),
      academicYear: '2025-2026',
      lastUpdated: new Date().toISOString(),
    };

    const updatedList = [newStudent, ...students];
    saveStudents(updatedList);
    onStudentListUpdated(updatedList);
    setIsAddModalOpen(false);
    setNewName('');
    setNewRoll('');
    setNewEmail('');
  };

  const getRiskBadge = (category: RiskCategory) => {
    switch (category) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 font-bold';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Top Action & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Student Academic Roster & Directory</h2>
          <p className="text-xs text-slate-500">
            Real-time tracking of marks, attendance, early warning levels, and interventions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <UserPlus className="w-4 h-4" />
            Enroll Student
          </button>
        </div>
      </div>

      {/* Filter and Search Controls Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roll, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Departments</option>
              <option value="CSE">CSE (Computer Science)</option>
              <option value="ECE">ECE (Electronics & Comm)</option>
              <option value="MECH">MECH (Mechanical)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Sections (A & B)</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              <option value="ALL">All Risk Categories</option>
              <option value="Critical">Critical Risk (Action Required)</option>
              <option value="High">High Risk</option>
              <option value="Moderate">Moderate Risk</option>
              <option value="Low">Low Risk (Satisfactory)</option>
            </select>
          </div>

          {/* Attendance Filter */}
          <div>
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Attendance Levels</option>
              <option value="BELOW_75">Below 75% (Shortage Deficit)</option>
              <option value="ABOVE_75">Above 75% (Eligible)</option>
            </select>
          </div>

        </div>

        {/* Filter Summary & Quick Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800">{filteredStudents.length}</strong> of{' '}
            {students.length} students
          </div>
          {(search || selectedDept !== 'ALL' || selectedSection !== 'ALL' || selectedRisk !== 'ALL' || attendanceFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedDept('ALL');
                setSelectedSection('ALL');
                setSelectedRisk('ALL');
                setAttendanceFilter('ALL');
              }}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('rollNumber')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Roll No <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    Student Details <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Class</th>
                <th
                  onClick={() => handleSort('attendance')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Attendance <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Int 1 Avg</th>
                <th className="py-3 px-3 text-center">Int 2 Avg</th>
                <th
                  onClick={() => handleSort('riskScore')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    Early Warning Risk <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Weak Subject</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu) => {
                  const int1Avg = (
                    stu.subjectScores.reduce((acc, c) => acc + c.internal1, 0) / stu.subjectScores.length
                  ).toFixed(1);
                  const int2Avg = (
                    stu.subjectScores.reduce((acc, c) => acc + c.internal2, 0) / stu.subjectScores.length
                  ).toFixed(1);
                  const diff = Number(int2Avg) - Number(int1Avg);

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Roll Number */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {stu.rollNumber}
                      </td>

                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{stu.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {stu.email}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {stu.department} S{stu.semester}-{stu.section}
                        </span>
                      </td>

                      {/* Attendance */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                            stu.overallAttendance < 75
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {stu.overallAttendance < 75 && <AlertTriangle className="w-3 h-3" />}
                          {stu.overallAttendance}%
                        </span>
                      </td>

                      {/* Internal 1 Avg */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                        {int1Avg}/50
                      </td>

                      {/* Internal 2 Avg + Trend */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="flex items-center justify-center gap-1 font-medium">
                          <span>{int2Avg}/50</span>
                          {diff < -2 ? (
                            <span title={`Dropped ${diff.toFixed(1)}`}>
                              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            </span>
                          ) : diff > 2 ? (
                            <span title={`Gained +${diff.toFixed(1)}`}>
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Risk Score & Category */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getRiskBadge(stu.riskCategory)}`}>
                            {stu.riskCategory} ({stu.riskScore})
                          </span>
                        </div>
                      </td>

                      {/* Weak Subject */}
                      <td className="py-3 px-3">
                        <span className="text-slate-700 text-[11px] font-medium line-clamp-1 max-w-[130px]">
                          {stu.riskBreakdown.primaryWeakSubject || 'Consistent'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenMarksModal(stu)}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Update marks & attendance (Live recalculated)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenInterventionModal(stu)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Record mentoring session"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenProfileModal(stu)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View student 360 profile"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Enroll New Engineering Student</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22CS135"
                    value={newRoll}
                    onChange={(e) => setNewRoll(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Iyer"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. maya.iyer@students.edupulse.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="MECH">MECH</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Semester
                  </label>
                  <select
                    value={newSemester}
                    onChange={(e) => setNewSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value={4}>Sem 4</option>
                    <option value={6}>Sem 6</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Section
                  </label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Attendance ({newAttendance}%)
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={newAttendance}
                  onChange={(e) => setNewAttendance(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
