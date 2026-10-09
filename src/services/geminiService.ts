import { GoogleGenAI } from '@google/genai';
import { Student, StudyTask } from '../types';

let aiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || '';
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    aiInstance = new GoogleGenAI({ apiKey });
    return aiInstance;
  }
  return null;
}

export async function generateAIStudyRecommendations(student: Student): Promise<{
  adviceSummary: string;
  smartTasks: StudyTask[];
  suggestedWeeklyFocus: string;
}> {
  const ai = getGenAI();

  const weakSubjects = [...student.subjectScores].sort(
    (a, b) => (a.internal1 + a.internal2) - (b.internal1 + b.internal2)
  );
  const primaryWeak = weakSubjects[0] || { subjectName: 'Core Engineering', internal1: 15, internal2: 15 };
  const secondaryWeak = weakSubjects[1] || { subjectName: 'Applied Systems', internal1: 20, internal2: 22 };

  if (ai) {
    try {
      const prompt = `You are EduPulse AI, an expert engineering academic advisor.
Student Name: ${student.name}
Department: ${student.department}, Semester ${student.semester}
Attendance: ${student.overallAttendance}%
Risk Level: ${student.riskCategory} (Score: ${student.riskScore}/100)
Weakest Subject: ${primaryWeak.subjectName} (Internal 1: ${primaryWeak.internal1}/50, Internal 2: ${primaryWeak.internal2}/50)
Secondary Weak Subject: ${secondaryWeak.subjectName} (Internal 1: ${secondaryWeak.internal1}/50, Internal 2: ${secondaryWeak.internal2}/50)
Risk Reasons: ${student.riskBreakdown.reasons.join(', ')}

Provide a structured, encouraging JSON response with:
1. "adviceSummary": 2-3 sentences of empathetic, highly practical guidance for this student.
2. "suggestedWeeklyFocus": A 1-sentence strategic mantra for the week.
3. "tasks": Array of 5 concrete actionable study tasks. Each task should have "subject", "topic", "estimatedHours" (number), "priority" ("High"|"Medium"|"Low"), "dayOfWeek" (Monday to Friday), "notes".

Respond with pure JSON only without markdown code blocks.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || '';
      // Clean possible markdown code fences
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const tasks: StudyTask[] = (parsed.tasks || []).map((t: any, idx: number) => ({
        id: `ai-task-${Date.now()}-${idx}`,
        subject: t.subject || primaryWeak.subjectName,
        topic: t.topic || 'Core conceptual review',
        estimatedHours: Number(t.estimatedHours) || 2,
        priority: t.priority || 'High',
        completed: false,
        dayOfWeek: t.dayOfWeek || 'Monday',
        notes: t.notes || 'Focus on step-by-step problem sets',
      }));

      return {
        adviceSummary: parsed.adviceSummary || 'Focus on progressive recovery through active problem-solving.',
        smartTasks: tasks.length > 0 ? tasks : student.studyTasks,
        suggestedWeeklyFocus: parsed.suggestedWeeklyFocus || `Target 80%+ mastery in ${primaryWeak.subjectName}`,
      };
    } catch (err) {
      console.warn('Gemini API call skipped or fallback used:', err);
    }
  }

  // Fallback intelligent engineering recommendations
  const dynamicTasks: StudyTask[] = [
    {
      id: `task-gen-1-${Date.now()}`,
      subject: primaryWeak.subjectName,
      topic: 'Core Diagnostic: Revisit mid-term exam errors & model solutions',
      estimatedHours: 2.5,
      priority: 'High',
      completed: false,
      dayOfWeek: 'Monday',
      notes: 'Identify whether marks were lost in theoretical proofs or numerical calculations.',
    },
    {
      id: `task-gen-2-${Date.now()}`,
      subject: primaryWeak.subjectName,
      topic: 'High-Yield Topic Mastery & Formula Sheet Formulation',
      estimatedHours: 3.0,
      priority: 'High',
      completed: false,
      dayOfWeek: 'Tuesday',
      notes: 'Draft a 2-page concise revision cheat sheet for rapid reference before tests.',
    },
    {
      id: `task-gen-3-${Date.now()}`,
      subject: secondaryWeak.subjectName,
      topic: 'Unit III Key Derivations & Code Walkthrough',
      estimatedHours: 2.0,
      priority: 'Medium',
      completed: false,
      dayOfWeek: 'Wednesday',
      notes: 'Consult faculty office hours for clarity on tricky boundary conditions.',
    },
    {
      id: `task-gen-4-${Date.now()}`,
      subject: primaryWeak.subjectName,
      topic: 'Timed 45-Min Mock Section Test (Unassisted)',
      estimatedHours: 1.5,
      priority: 'High',
      completed: false,
      dayOfWeek: 'Thursday',
      notes: 'Simulate examination conditions to build test speed and overcome exam anxiety.',
    },
    {
      id: `task-gen-5-${Date.now()}`,
      subject: 'Lab & Assignments',
      topic: 'Catch up on backlog submissions & code verification',
      estimatedHours: 2.0,
      priority: 'Medium',
      completed: false,
      dayOfWeek: 'Friday',
      notes: 'Clear any pending lab experiment reports with teaching assistants.',
    },
  ];

  return {
    adviceSummary: `You have strong potential to recover quickly! Prioritize ${primaryWeak.subjectName} where targeted practice on fundamentals will yield the highest jump in marks. Attend all scheduled lectures this week to restore attendance buffers.`,
    smartTasks: dynamicTasks,
    suggestedWeeklyFocus: `Bridge the conceptual gap in ${primaryWeak.subjectName} and sustain 85%+ weekly attendance.`,
  };
}
