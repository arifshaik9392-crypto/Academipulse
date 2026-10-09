import React, { useState } from 'react';
import { Student, StudyTask } from '../types';
import {
  CalendarCheck,
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Printer,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  X,
  Target,
} from 'lucide-react';
import { generateAIStudyRecommendations } from '../services/geminiService';
import { saveStudents, loadStudents } from '../services/storage';

interface StudyPlannerProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudentId: (id: string) => void;
  isStudentRole?: boolean;
}

export const StudyPlanner: React.FC<StudyPlannerProps> = ({
  students,
  selectedStudentId,
  onSelectStudentId,
  isStudentRole = false,
}) => {
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[1] || students[0];

  const [tasks, setTasks] = useState<StudyTask[]>(currentStudent ? currentStudent.studyTasks : []);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // New task form state
  const [newTaskSubject, setNewTaskSubject] = useState(
    currentStudent?.riskBreakdown.primaryWeakSubject || 'Core Subject'
  );
  const [newTaskTopic, setNewTaskTopic] = useState('');
  const [newTaskHours, setNewTaskHours] = useState(2);
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [newTaskDay, setNewTaskDay] = useState('Monday');

  // Sync tasks when student selection changes
  React.useEffect(() => {
    if (currentStudent) {
      setTasks(currentStudent.studyTasks || []);
      setAiAdvice('');
    }
  }, [currentStudent?.id]);

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updated);

    // Save to student record
    if (currentStudent) {
      const allStudents = loadStudents();
      const idx = allStudents.findIndex((s) => s.id === currentStudent.id);
      if (idx !== -1) {
        allStudents[idx].studyTasks = updated;
        saveStudents(allStudents);
      }
    }
  };

  const handleGenerateAIPlan = async () => {
    if (!currentStudent) return;
    setIsGeneratingAI(true);
    try {
      const res = await generateAIStudyRecommendations(currentStudent);
      setTasks(res.smartTasks);
      setAiAdvice(res.adviceSummary);

      // Persist to local storage
      const allStudents = loadStudents();
      const idx = allStudents.findIndex((s) => s.id === currentStudent.id);
      if (idx !== -1) {
        allStudents[idx].studyTasks = res.smartTasks;
        saveStudents(allStudents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTopic || !currentStudent) return;

    const newTask: StudyTask = {
      id: `task-custom-${Date.now()}`,
      subject: newTaskSubject,
      topic: newTaskTopic,
      estimatedHours: newTaskHours,
      priority: newTaskPriority,
      completed: false,
      dayOfWeek: newTaskDay,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);

    const allStudents = loadStudents();
    const idx = allStudents.findIndex((s) => s.id === currentStudent.id);
    if (idx !== -1) {
      allStudents[idx].studyTasks = updated;
      saveStudents(allStudents);
    }

    setIsAddTaskModalOpen(false);
    setNewTaskTopic('');
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const totalHours = tasks.reduce((acc, t) => acc + t.estimatedHours, 0);

  // Group tasks by day of week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            Personalized Academic Study Planner
          </h2>
          <p className="text-xs text-slate-500">
            Tailored weekly action plans targeted at remediating weak subjects and test anxiety.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isStudentRole && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Student:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => onSelectStudentId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.rollNumber}) - {s.riskCategory}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            title="Print schedule"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>

          <button
            onClick={handleGenerateAIPlan}
            disabled={isGeneratingAI}
            className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-indigo-200" />
            {isGeneratingAI ? 'Generating with AI...' : 'AI Smart Plan'}
          </button>
        </div>
      </div>

      {/* Student Context & Progress Banner */}
      {currentStudent && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-900">{currentStudent.name}</h3>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {currentStudent.rollNumber}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    currentStudent.riskCategory === 'Critical'
                      ? 'bg-rose-100 text-rose-800'
                      : currentStudent.riskCategory === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentStudent.riskCategory} Risk
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentStudent.department} Engineering • Sem {currentStudent.semester} - Section {currentStudent.section} • Mentor: {currentStudent.mentorName}
              </p>
            </div>

            {/* Target & Hours Summary */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Weekly Allocated</span>
                <span className="text-lg font-bold text-slate-900 font-mono">{totalHours} Hours</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">Completion Rate</span>
                <span className="text-lg font-bold text-indigo-600 font-mono">{progressPct}%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
              <span>{completedCount} of {tasks.length} tasks completed</span>
              <span>{progressPct === 100 ? '🎉 Weekly Goals Achieved!' : 'Keep going!'}</span>
            </div>
          </div>

          {/* AI Advisor Note Banner */}
          {aiAdvice ? (
            <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5 animate-in fade-in">
              <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-indigo-900 font-bold mb-0.5">AI Advisor Recommendation:</strong>
                <p className="leading-relaxed">{aiAdvice}</p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>
                  Primary Focus Priority:{' '}
                  <strong className="text-slate-800">
                    {currentStudent.riskBreakdown.primaryWeakSubject || 'Core Fundamentals'}
                  </strong>
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Click "AI Smart Plan" to re-generate an adaptive schedule using Gemini models.
              </span>
            </div>
          )}
        </div>
      )}

      {/* DAY-BY-DAY SCHEDULE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {daysOfWeek.map((day) => {
          const dayTasks = tasks.filter((t) => t.dayOfWeek.toLowerCase() === day.toLowerCase());

          return (
            <div
              key={day}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden"
            >
              {/* Day Header */}
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">{day}</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                  {dayTasks.filter((t) => t.completed).length}/{dayTasks.length} Done
                </span>
              </div>

              {/* Tasks List */}
              <div className="p-4 flex-1 space-y-3">
                {dayTasks.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No scheduled tasks. Rest or review lecture notes.
                  </div>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        task.completed
                          ? 'bg-slate-50/70 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          className="mt-0.5 text-slate-400 hover:text-indigo-600 shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`font-semibold text-slate-800 ${
                                task.completed ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {task.subject}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                task.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700'
                                  : task.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          <p
                            className={`mt-1 text-[11px] leading-snug ${
                              task.completed ? 'text-slate-400' : 'text-slate-600'
                            }`}
                          >
                            {task.topic}
                          </p>

                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" /> {task.estimatedHours} hrs
                            </span>
                            {task.resourceLink && (
                              <a
                                href={task.resourceLink}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-600 hover:underline flex items-center gap-0.5"
                              >
                                NPTEL <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Task Modal */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Add Personalized Study Task</h3>
              <button onClick={() => setIsAddTaskModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewTask} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-600 mb-1">
                  Topic / Remedial Objective
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Solve 5 problems on Dijkstra's shortest path"
                  value={newTaskTopic}
                  onChange={(e) => setNewTaskTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Day</label>
                  <select
                    value={newTaskDay}
                    onChange={(e) => setNewTaskDay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {daysOfWeek.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={newTaskHours}
                    onChange={(e) => setNewTaskHours(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
