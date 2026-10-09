import React from 'react';
import { UserRole, Student } from '../types';
import {
  Activity,
  Shield,
  GraduationCap,
  Users,
  BarChart3,
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  Database,
  RefreshCw,
  Search,
  CheckCircle,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  students: Student[];
  selectedStudentId: string;
  onSelectStudentId: (id: string) => void;
  onOpenSupabaseModal: () => void;
  onResetData: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeRole,
  onSelectRole,
  students,
  selectedStudentId,
  onSelectStudentId,
  onOpenSupabaseModal,
  onResetData,
  searchQuery,
  onSearchChange,
}) => {
  const criticalCount = students.filter((s) => s.riskCategory === 'Critical').length;
  const highCount = students.filter((s) => s.riskCategory === 'High').length;

  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[1] || students[0];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'faculty'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['admin', 'faculty'] },
    { id: 'analytics', label: 'Academic Analytics', icon: Activity, roles: ['admin', 'faculty'] },
    { id: 'early-warning', label: 'Early Warning Engine', icon: AlertTriangle, roles: ['admin', 'faculty'] },
    { id: 'study-planner', label: 'Study Planner', icon: CalendarCheck, roles: ['admin', 'faculty', 'student'] },
    { id: 'interventions', label: 'Mentoring Tracker', icon: ClipboardList, roles: ['admin', 'faculty'] },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Utility Bar */}
      <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-200">EduPulse AI Engine Active</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline italic">
            “Detect Early. Support Smartly. Improve Together.”
          </span>
        </div>

        <div className="flex items-center gap-3">
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold text-[11px]">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              {criticalCount} Critical & {highCount} High Alerts
            </span>
          )}

          <button
            onClick={onOpenSupabaseModal}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            title="Database & Supabase Settings"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="hidden md:inline">Demo DB / Supabase</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset student records and simulations back to default mock data?')) {
                onResetData();
              }
            }}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
            title="Reset to default mock students"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                EduPulse <span className="text-indigo-600">AI</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                Engineering Academic EWS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden md:block">
              Continuous Academic Risk Detection & Intervention Platform
            </p>
          </div>
        </div>

        {/* Global Search (for students) */}
        <div className="flex-1 max-w-xs hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick search roll no, student..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* User Role Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin / Dean</span>
              <span className="sm:hidden">Admin</span>
            </button>

            <button
              onClick={() => onSelectRole('faculty')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'faculty'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Faculty</span>
            </button>

            <button
              onClick={() => onSelectRole('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeRole === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student</span>
            </button>
          </div>

          {/* Student Picker if in student role */}
          {activeRole === 'student' && (
            <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-xs text-slate-500">View as:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => onSelectStudentId(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[140px]"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      {activeRole !== 'student' && (
        <div className="px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-slate-100 scrollbar-none py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50/80 border border-indigo-200/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
