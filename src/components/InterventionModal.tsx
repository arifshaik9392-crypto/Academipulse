import React, { useState } from 'react';
import { Student, Intervention, InterventionStatus, FacultyMember } from '../types';
import { loadInterventions, saveInterventions, loadFaculty } from '../services/storage';
import { X, UserCheck, Calendar, ShieldCheck, Check } from 'lucide-react';

interface InterventionModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newIntervention: Intervention) => void;
}

export const InterventionModal: React.FC<InterventionModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !student) return null;

  const facultyList = loadFaculty();
  const [facultyId, setFacultyId] = useState<string>(facultyList[0]?.id || 'fac-1');
  const [category, setCategory] = useState<Intervention['category']>('Academic Weakness');
  const [discussionNotes, setDiscussionNotes] = useState<string>(
    `Met with ${student.name} regarding performance in ${student.riskBreakdown.primaryWeakSubject || 'core engineering subjects'}.`
  );
  const [actionItems, setActionItems] = useState<string>(
    `1. Enroll in weekly tutorial sessions.\n2. Assign peer study partner.\n3. Re-evaluate after next section test.`
  );
  const [followUpDate, setFollowUpDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<InterventionStatus>('In Progress');
  const [parentNotified, setParentNotified] = useState<boolean>(student.riskCategory === 'Critical');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedFaculty = facultyList.find((f) => f.id === facultyId) || facultyList[0];

    const newIntervention: Intervention = {
      id: `int-${Date.now()}`,
      studentId: student.id,
      studentRoll: student.rollNumber,
      studentName: student.name,
      studentDept: student.department,
      facultyId: selectedFaculty.id,
      facultyName: selectedFaculty.name,
      date: new Date().toISOString().split('T')[0],
      category,
      discussionNotes,
      actionItems,
      followUpDate,
      status,
      preRiskScore: student.riskScore,
      parentNotified,
    };

    const currentList = loadInterventions();
    saveInterventions([newIntervention, ...currentList]);
    onSuccess(newIntervention);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Record Faculty Mentoring & Intervention</h2>
              <p className="text-xs text-slate-500">
                Student: <strong>{student.name}</strong> ({student.rollNumber}) • Current Risk: {student.riskScore} ({student.riskCategory})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Faculty Mentor
              </label>
              <select
                value={facultyId}
                onChange={(e) => setFacultyId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Intervention Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Academic Weakness">Academic Weakness</option>
                <option value="Attendance Deficit">Attendance Deficit</option>
                <option value="Exam Failure">Exam Failure / Backlog</option>
                <option value="Assignment Backlog">Assignment Backlog</option>
                <option value="Emotional / Stress">Emotional / Exam Stress</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Discussion Notes & Root Cause Analysis
            </label>
            <textarea
              rows={3}
              value={discussionNotes}
              onChange={(e) => setDiscussionNotes(e.target.value)}
              placeholder="Describe challenges discussed, root causes (e.g. conceptual gap, commuting issues, illness)..."
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Agreed Action Plan & Next Steps
            </label>
            <textarea
              rows={3}
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="e.g. 1. Remedial tutorials on Fridays; 2. Submit pending 2 assignments..."
              required
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Escalated">Escalated to HOD</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={parentNotified}
                onChange={(e) => setParentNotified(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Parent / Guardian Alert Dispatched
                </span>
                <span className="text-[11px] text-slate-500">
                  Notify guardians via SMS/Email regarding attendance or severe academic risk alert.
                </span>
              </div>
            </label>
          </div>

          {/* Footer inside form */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 rounded-xl flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Mentoring Session
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
