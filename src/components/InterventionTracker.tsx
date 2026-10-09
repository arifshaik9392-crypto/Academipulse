import React, { useState } from 'react';
import { Intervention, Student, InterventionStatus } from '../types';
import { saveInterventions, loadInterventions } from '../services/storage';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
  Calendar,
  PhoneCall,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface InterventionTrackerProps {
  interventions: Intervention[];
  students: Student[];
  onOpenInterventionModal: (student: Student) => void;
  onInterventionsUpdated: (interventions: Intervention[]) => void;
}

export const InterventionTracker: React.FC<InterventionTrackerProps> = ({
  interventions,
  students,
  onOpenInterventionModal,
  onInterventionsUpdated,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filteredInterventions = interventions.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        item.studentName.toLowerCase().includes(q) ||
        item.studentRoll.toLowerCase().includes(q) ||
        item.facultyName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleUpdateStatus = (id: string, newStatus: InterventionStatus) => {
    const updated = interventions.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          postRiskScore: newStatus === 'Resolved' && !item.postRiskScore ? Math.max(20, item.preRiskScore - 18) : item.postRiskScore,
        };
      }
      return item;
    });

    saveInterventions(updated);
    onInterventionsUpdated(updated);
  };

  const scheduledCount = interventions.filter((i) => i.status === 'Scheduled').length;
  const inProgressCount = interventions.filter((i) => i.status === 'In Progress').length;
  const resolvedCount = interventions.filter((i) => i.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            Faculty Intervention & Mentoring Tracker
          </h2>
          <p className="text-xs text-slate-500">
            Document 1-on-1 counseling, remedial action plans, parent communications, and recovery progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const flagged = students.find((s) => s.riskCategory === 'Critical') || students[0];
              if (flagged) onOpenInterventionModal(flagged);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Log Mentoring Session
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Recorded</span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{interventions.length}</div>
          <span className="text-[11px] text-slate-500">Mentoring Engagements</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700">In Progress</span>
          <div className="text-2xl font-black font-mono text-amber-950 mt-1">{inProgressCount}</div>
          <span className="text-[11px] text-amber-700">Active Remedial Plans</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Resolved / Improved</span>
          <div className="text-2xl font-black font-mono text-emerald-950 mt-1">{resolvedCount}</div>
          <span className="text-[11px] text-emerald-700">Risk De-escalated</span>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Scheduled / Follow-ups</span>
          <div className="text-2xl font-black font-mono text-indigo-950 mt-1">{scheduledCount}</div>
          <span className="text-[11px] text-indigo-700">Upcoming Check-ins</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full sm:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student, roll no, faculty or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'Scheduled', 'In Progress', 'Resolved', 'Escalated'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Interventions List */}
      <div className="space-y-4">
        {filteredInterventions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No mentoring records found matching your filter.
          </div>
        ) : (
          filteredInterventions.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-colors flex flex-col lg:flex-row lg:items-start justify-between gap-4"
            >
              <div className="space-y-3 flex-1">
                {/* Header row */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-slate-900 text-sm">{item.studentName}</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {item.studentRoll} ({item.studentDept})
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.category}
                  </span>
                  {item.parentNotified && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3" /> Parent Contacted
                    </span>
                  )}
                </div>

                {/* Notes and Action items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block mb-1">
                      Discussion & Root Cause Notes:
                    </span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">{item.discussionNotes}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                    <span className="font-bold uppercase tracking-wider text-indigo-900 text-[10px] block mb-1">
                      Agreed Action Plan & Remediations:
                    </span>
                    <p className="text-indigo-950 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                      {item.actionItems}
                    </p>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>
                    Faculty Mentor: <strong className="text-slate-800">{item.facultyName}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Date Held: <strong className="text-slate-800">{item.date}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-indigo-700 font-semibold">
                    <Calendar className="w-3.5 h-3.5" /> Next Follow-up: {item.followUpDate}
                  </span>
                </div>
              </div>

              {/* Status and Risk Evolution Controls */}
              <div className="lg:w-48 flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Risk Score Evolution</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-rose-600">Pre: {item.preRiskScore}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-mono text-xs font-bold text-emerald-600">
                      Post: {item.postRiskScore ? item.postRiskScore : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <select
                    value={item.status}
                    onChange={(e) => handleUpdateStatus(item.id, e.target.value as any)}
                    className={`w-full px-3 py-1.5 text-xs font-bold rounded-xl border focus:outline-none ${
                      item.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : item.status === 'In Progress'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Escalated">Escalated</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
