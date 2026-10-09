/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserRole, Student, AcademicSettings, Intervention } from './types';
import {
  loadStudents,
  saveStudents,
  loadSettings,
  saveSettings,
  loadInterventions,
  saveInterventions,
  resetAllDataToDefault,
} from './services/storage';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { StudentManagement } from './components/StudentManagement';
import { AcademicAnalytics } from './components/AcademicAnalytics';
import { EarlyWarningSystem } from './components/EarlyWarningSystem';
import { StudyPlanner } from './components/StudyPlanner';
import { InterventionTracker } from './components/InterventionTracker';
import { StudentPortal } from './components/StudentPortal';
import { MarksUpdateModal } from './components/MarksUpdateModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { InterventionModal } from './components/InterventionModal';
import { SupabaseModal } from './components/SupabaseModal';

export default function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('faculty');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [settings, setSettings] = useState<AcademicSettings>(loadSettings());
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [riskFilterParam, setRiskFilterParam] = useState<string>('ALL');

  // Modals
  const [modalStudent, setModalStudent] = useState<Student | null>(null);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isInterventionModalOpen, setIsInterventionModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Initialize data
  useEffect(() => {
    const loadedStudents = loadStudents();
    const loadedSettings = loadSettings();
    const loadedInterventions = loadInterventions();

    setStudents(loadedStudents);
    setSettings(loadedSettings);
    setInterventions(loadedInterventions);

    // Pick student-2 (Rahul Verma - critical) or first student as default
    if (loadedStudents.length > 0) {
      const defaultStudent = loadedStudents.find((s) => s.id === 'stu-2') || loadedStudents[0];
      setSelectedStudentId(defaultStudent.id);
    }
  }, []);

  const handleOpenMarksModal = (student: Student) => {
    setModalStudent(student);
    setIsMarksModalOpen(true);
  };

  const handleOpenProfileModal = (student: Student) => {
    setModalStudent(student);
    setIsProfileModalOpen(true);
  };

  const handleOpenInterventionModal = (student: Student) => {
    setModalStudent(student);
    setIsInterventionModalOpen(true);
  };

  const handleStudentUpdated = (updated: Student) => {
    const updatedList = students.map((s) => (s.id === updated.id ? updated : s));
    setStudents(updatedList);
    saveStudents(updatedList);
  };

  const handleResetData = () => {
    const res = resetAllDataToDefault();
    setStudents(res.students);
    setSettings(res.settings);
    setInterventions(res.interventions);
    if (res.students.length > 0) {
      setSelectedStudentId(res.students[1]?.id || res.students[0].id);
    }
  };

  const handleNavigateTab = (tab: string, filterParams?: any) => {
    if (filterParams?.risk) {
      setRiskFilterParam(filterParams.risk);
    } else {
      setRiskFilterParam('ALL');
    }
    setCurrentTab(tab);
  };

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[1] || students[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setRiskFilterParam('ALL');
          setCurrentTab(tab);
        }}
        activeRole={activeRole}
        onSelectRole={(role) => {
          setActiveRole(role);
          if (role === 'student') {
            setCurrentTab('student-portal');
          } else if (currentTab === 'student-portal') {
            setCurrentTab('dashboard');
          }
        }}
        students={students}
        selectedStudentId={selectedStudentId}
        onSelectStudentId={setSelectedStudentId}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onResetData={handleResetData}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && currentTab !== 'students') {
            setCurrentTab('students');
          }
        }}
      />

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeRole === 'student' && activeStudent ? (
          <StudentPortal
            student={activeStudent}
            allStudents={students}
            onOpenMarksModal={handleOpenMarksModal}
            onRequestMeeting={(stu) => handleOpenInterventionModal(stu)}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                students={students}
                interventions={interventions}
                settings={settings}
                onNavigateTab={handleNavigateTab}
                onOpenMarksModal={handleOpenMarksModal}
                onOpenProfileModal={handleOpenProfileModal}
                onOpenInterventionModal={handleOpenInterventionModal}
              />
            )}

            {currentTab === 'students' && (
              <StudentManagement
                students={students}
                onOpenMarksModal={handleOpenMarksModal}
                onOpenProfileModal={handleOpenProfileModal}
                onOpenInterventionModal={handleOpenInterventionModal}
                onStudentListUpdated={(updated) => setStudents(updated)}
                initialRiskFilter={riskFilterParam}
              />
            )}

            {currentTab === 'analytics' && (
              <AcademicAnalytics
                students={students}
                onOpenMarksModal={handleOpenMarksModal}
              />
            )}

            {currentTab === 'early-warning' && (
              <EarlyWarningSystem
                students={students}
                settings={settings}
                onSettingsUpdated={(newSettings) => setSettings(newSettings)}
                onStudentsUpdated={(updated) => setStudents(updated)}
                onOpenMarksModal={handleOpenMarksModal}
                onOpenProfileModal={handleOpenProfileModal}
                onOpenInterventionModal={handleOpenInterventionModal}
              />
            )}

            {currentTab === 'study-planner' && (
              <StudyPlanner
                students={students}
                selectedStudentId={selectedStudentId}
                onSelectStudentId={setSelectedStudentId}
              />
            )}

            {currentTab === 'interventions' && (
              <InterventionTracker
                interventions={interventions}
                students={students}
                onOpenInterventionModal={handleOpenInterventionModal}
                onInterventionsUpdated={(updated) => setInterventions(updated)}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">EduPulse AI</span>
            <span>—</span>
            <span className="italic">“Detect Early. Support Smartly. Improve Together.”</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Engineering Academic EWS v2.4</span>
            <span>•</span>
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className="hover:text-indigo-600 transition-colors"
            >
              Database Architecture
            </button>
            <span>•</span>
            <button onClick={handleResetData} className="hover:text-indigo-600 transition-colors">
              Reset Demo
            </button>
          </div>
        </div>
      </footer>

      {/* Global Interactive Modals */}
      <MarksUpdateModal
        student={modalStudent}
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        onSuccess={handleStudentUpdated}
      />

      <StudentProfileModal
        student={modalStudent}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenMarksModal={handleOpenMarksModal}
        onOpenInterventionModal={handleOpenInterventionModal}
      />

      <InterventionModal
        student={modalStudent}
        isOpen={isInterventionModalOpen}
        onClose={() => setIsInterventionModalOpen(false)}
        onSuccess={(newInt) => setInterventions((prev) => [newInt, ...prev])}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataReset={handleResetData}
      />
    </div>
  );
}
