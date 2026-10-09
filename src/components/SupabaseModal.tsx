import React, { useState } from 'react';
import { X, Database, CheckCircle2, Shield, RefreshCw, Key, ExternalLink, Copy, Check } from 'lucide-react';
import { loadSupabaseConfig, saveSupabaseConfig, resetAllDataToDefault } from '../services/storage';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataReset,
}) => {
  if (!isOpen) return null;

  const currentCfg = loadSupabaseConfig();
  const [url, setUrl] = useState(currentCfg.url);
  const [anonKey, setAnonKey] = useState(currentCfg.anonKey);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim(),
      enabled: Boolean(url.trim() && anonKey.trim()),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const sqlSchema = `-- EduPulse AI Database Schema (PostgreSQL / Supabase)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  semester INT NOT NULL,
  section TEXT NOT NULL,
  overall_attendance NUMERIC(5,2) NOT NULL,
  risk_score INT NOT NULL,
  risk_category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subject_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  internal_1 INT NOT NULL,
  internal_2 INT NOT NULL,
  assignment INT NOT NULL,
  attendance NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  faculty_name TEXT NOT NULL,
  category TEXT NOT NULL,
  discussion_notes TEXT,
  action_items TEXT,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Database & Supabase Connection</h2>
              <p className="text-xs text-slate-500">
                Hybrid Architecture: Zero-Config Local Offline Mode + Optional Cloud Supabase
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Active Mode Banner */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-900 text-sm">
                Active Mode: Fully Functional Offline Demo Engine (LocalStorage)
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                All mock engineering students, marks updates, risk calculations, interventions, and personalized study plans are active and persist automatically in browser storage. No external API keys or Supabase credentials are required to evaluate all features!
              </p>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider">
                Reset Demo Records
              </span>
              <span className="text-xs text-slate-500">
                Restore the initial batch of 16 engineering students, marks & interventions.
              </span>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all students and interventions back to initial state?')) {
                  resetAllDataToDefault();
                  onDataReset();
                  onClose();
                }
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reset Demo
            </button>
          </div>

          {/* Optional Supabase Config */}
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                Optional: Connect Your Supabase Cloud Project
              </h3>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Credentials saved locally
                </span>
              ) : <span />}

              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
              >
                Save Supabase Config
              </button>
            </div>
          </form>

          {/* Schema Snippet */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-600">Production SQL Schema</span>
              <button
                onClick={handleCopySql}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedSql ? 'Copied!' : 'Copy SQL'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36">
              {sqlSchema}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
