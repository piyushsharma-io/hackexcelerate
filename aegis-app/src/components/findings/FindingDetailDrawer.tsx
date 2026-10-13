import React, { useState } from 'react';
import { useAegis } from '../../context/AegisContext';
import {
  X,
  ExternalLink,
  Server,
  Send,
  Flag,
  Share2,
  Sparkles,
  Bot,
  RotateCw,
  Check
} from 'lucide-react';
import { SeverityBadge } from '../ui/SeverityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { FindingStatus } from '../../types';
import {
  analyzeEvidenceWithAI,
  AIEvidenceAnalysisResponse
} from '../../services/aiEvidenceService';

export const FindingDetailDrawer: React.FC = () => {
  const { selectedFinding, setSelectedFinding, updateFindingStatus, theme } = useAegis();
  const [newNote, setNewNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIEvidenceAnalysisResponse | null>(null);
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);

  if (!selectedFinding) return null;

  const isLight = theme === 'light';

  const handleStatusChange = (status: FindingStatus) => {
    updateFindingStatus(selectedFinding.id, status);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const notes = selectedFinding.notes || [];
    selectedFinding.notes = [...notes, `[${new Date().toLocaleTimeString()}] ${newNote.trim()}`];
    setNewNote('');
  };

  const handleRunAIAnalysis = async () => {
    if (!selectedFinding || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeEvidenceWithAI({
        findingId: selectedFinding.id,
        findingTitle: selectedFinding.title,
        targetBrand: selectedFinding.associatedBrand,
        platform: selectedFinding.platform,
        similarity: selectedFinding.similarity,
        ipAddress: selectedFinding.ipAddress,
        dnsHost: selectedFinding.dnsHost,
        registrar: selectedFinding.registrar,
        asn: selectedFinding.asn,
        targetUrl: selectedFinding.targetUrl,
        notes: selectedFinding.notes
      });
      setAiAnalysis(result);
    } catch (err) {
      console.error('Failed to run AI Evidence analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyAnalysis = () => {
    if (!aiAnalysis) return;
    const text = `AEGIS AI Evidence Analysis - ${selectedFinding.title}\n` +
      `Threat Assessment: ${aiAnalysis.threatAssessment}\n` +
      `Recommended Action: ${aiAnalysis.recommendedAction}\n` +
      `Confidence: ${aiAnalysis.confidenceScore}% (Model: ${aiAnalysis.model})`;
    navigator.clipboard?.writeText(text);
    setCopiedAnalysis(true);
    setTimeout(() => setCopiedAnalysis(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm animate-fade-in">
      {/* Click outside backdrop to close */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => setSelectedFinding(null)}
      />

      {/* Centered Evidence Details Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] border rounded-3xl p-6 sm:p-7 flex flex-col justify-between overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shadow-2xl transition-all animate-scale-in"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="space-y-1.5 pr-4">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={selectedFinding.risk} showDot />
                <StatusBadge status={selectedFinding.status} />
                <span className="text-xs font-mono font-bold text-stone-600 dark:text-slate-400">
                  {selectedFinding.id}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight break-all" style={{ color: 'var(--text-primary)' }}>
                {selectedFinding.title}
              </h2>
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Target Brand:{' '}
                <span className="font-bold" style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }}>
                  {selectedFinding.associatedBrand}
                </span>
              </p>
            </div>
            <button
              onClick={() => setSelectedFinding(null)}
              className="p-2 rounded-xl transition-colors hover:bg-black/10 dark:hover:bg-white/10 text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              title="Close panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--card-sub-bg)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-slate-400">
                Similarity Score
              </span>
              <p
                className="text-xl font-extrabold mt-0.5 font-mono"
                style={{
                  color: selectedFinding.similarity >= 90
                    ? (isLight ? '#B91C1C' : '#F87171')
                    : selectedFinding.similarity >= 75
                    ? (isLight ? '#D97706' : '#FBBF24')
                    : (isLight ? '#2563EB' : '#60A5FA')
                }}
              >
                {selectedFinding.similarity}%
              </p>
            </div>
            <div className="p-3.5 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--card-sub-bg)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-slate-400">
                Platform
              </span>
              <p className="text-base font-bold capitalize mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {selectedFinding.platform}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl border shadow-sm" style={{ backgroundColor: 'var(--card-sub-bg)', borderColor: 'var(--border-color)' }}>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-slate-400">
                Detected
              </span>
              <p className="text-xs font-bold mt-1 font-mono text-stone-700 dark:text-slate-300">
                {selectedFinding.detectedTime}
              </p>
            </div>
          </div>

          {/* Technical Telemetry */}
          <div className="p-4 rounded-2xl border space-y-3 shadow-sm" style={{ backgroundColor: 'var(--card-sub-bg)', borderColor: 'var(--border-color)' }}>
            <div
              className="text-xs font-extrabold uppercase tracking-wider font-mono flex items-center gap-2"
              style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }}
            >
              <Server size={14} /> Technical Forensics
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 dark:text-slate-400 block">
                  Resolved IP
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-slate-100">
                  {selectedFinding.ipAddress || '198.51.100.42'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 dark:text-slate-400 block">
                  DNS Host
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-slate-100 truncate block">
                  {selectedFinding.dnsHost || 'ns1.threat-edge.net'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 dark:text-slate-400 block">
                  Registrar
                </span>
                <span className="font-semibold text-stone-900 dark:text-slate-200">
                  {selectedFinding.registrar || 'NameCheap Inc.'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 dark:text-slate-400 block">
                  Autonomous System (ASN)
                </span>
                <span className="font-mono font-bold text-stone-900 dark:text-slate-200">
                  {selectedFinding.asn || 'AS13335'}
                </span>
              </div>
            </div>

            {selectedFinding.targetUrl && (
              <div className="pt-2.5 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 dark:text-slate-400 block mb-0.5">
                  Target URI
                </span>
                <a
                  href={selectedFinding.targetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs hover:underline flex items-center gap-1 font-mono font-bold break-all"
                  style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }}
                >
                  {selectedFinding.targetUrl}
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* AI Evidence Analysis & Explanation Section */}
          <div
            className="p-4 rounded-2xl border space-y-3 shadow-sm transition-all"
            style={{
              backgroundColor: 'var(--card-sub-bg)',
              borderColor: aiAnalysis
                ? (isLight ? '#C2410C' : 'var(--primary-accent)')
                : 'var(--border-color)'
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="text-xs font-extrabold uppercase tracking-wider font-mono flex items-center gap-2"
                style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }}
              >
                <Sparkles size={14} className={isAnalyzing ? 'animate-spin' : ''} />
                AI Evidence Analysis & Explanation
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold"
                style={{
                  borderColor: isLight ? 'rgba(194, 65, 12, 0.3)' : 'rgba(56, 189, 248, 0.3)',
                  backgroundColor: isLight ? 'rgba(194, 65, 12, 0.08)' : 'rgba(56, 189, 248, 0.08)',
                  color: isLight ? '#C2410C' : 'var(--primary-accent)'
                }}
              >
                Gemini Engine Ready
              </span>
            </div>

            {/* Initial Trigger Button */}
            {!aiAnalysis && !isAnalyzing && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <p className="text-xs text-stone-600 dark:text-slate-400 font-medium">
                  Trigger automated legal and forensic evidence reasoning via AI model API.
                </p>
                <button
                  type="button"
                  onClick={handleRunAIAnalysis}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all shadow-sm shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: isLight ? '#C2410C' : 'var(--primary-accent-muted)',
                    borderColor: isLight ? '#9A3412' : 'var(--primary-accent)',
                    color: isLight ? '#FFFFFF' : 'var(--primary-accent)'
                  }}
                >
                  <Sparkles size={13} />
                  Run AI Evidence Analysis
                </button>
              </div>
            )}

            {/* Loading / Inference State */}
            {isAnalyzing && (
              <div className="py-5 flex flex-col items-center justify-center gap-2.5 text-center">
                <div
                  className="w-7 h-7 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: isLight ? '#C2410C' : 'var(--primary-accent)',
                    borderTopColor: 'transparent'
                  }}
                />
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                  Correlating evidence telemetry with AI threat classifier...
                </span>
                <span className="text-[10px] font-mono text-stone-500 dark:text-slate-400">
                  Ready for backend API key integration (POST /api/ai/analyze-evidence)
                </span>
              </div>
            )}

            {/* Structured AI Analysis Result Container */}
            {aiAnalysis && !isAnalyzing && (
              <div className="space-y-3 pt-1 animate-fade-in text-xs">
                {/* Threat Assessment */}
                <div
                  className="p-3 rounded-xl border leading-relaxed"
                  style={{
                    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.04)',
                    borderColor: 'var(--border-color)'
                  }}
                >
                  <div className="font-bold mb-1 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                    <span>Threat Assessment & Explanation</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }}>
                      Confidence: {aiAnalysis.confidenceScore}%
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-slate-300 font-medium text-[11.5px] leading-relaxed">
                    {aiAnalysis.threatAssessment}
                  </p>
                </div>

                {/* Key Indicators */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-stone-600 dark:text-slate-400 block">
                    Forensic Indicators & Clues:
                  </span>
                  <ul className="space-y-1 pl-4 list-disc text-stone-700 dark:text-slate-300 font-medium text-[11px]">
                    {aiAnalysis.keyIndicators.map((ind, i) => (
                      <li key={i}>{ind}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Mitigation */}
                <div
                  className="p-2.5 rounded-xl border flex items-start gap-2"
                  style={{
                    backgroundColor: isLight ? 'rgba(194, 65, 12, 0.08)' : 'rgba(56, 189, 248, 0.08)',
                    borderColor: isLight ? 'rgba(194, 65, 12, 0.25)' : 'rgba(56, 189, 248, 0.25)'
                  }}
                >
                  <Bot size={15} className="shrink-0 mt-0.5" style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }} />
                  <div className="text-[11px] leading-tight font-medium" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-bold">Recommended Mitigation: </span>
                    {aiAnalysis.recommendedAction}
                  </div>
                </div>

                {/* Engine telemetry and Action Bar */}
                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-stone-500 dark:text-slate-400">
                  <span>Engine: {aiAnalysis.model} • {aiAnalysis.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAnalysis}
                      className="hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {copiedAnalysis ? <Check size={11} className="text-emerald-500" /> : null}
                      <span>{copiedAnalysis ? 'Copied' : 'Copy'}</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handleRunAIAnalysis}
                      className="hover:underline flex items-center gap-1 font-bold cursor-pointer"
                      style={{ color: isLight ? '#C2410C' : 'var(--primary-accent)' }}
                    >
                      <RotateCw size={11} /> Re-analyze
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analyst Notes & Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-primary)' }}>
                Investigation Notes ({selectedFinding.notes?.length || 0})
              </span>
              <span className="text-[11px] font-medium text-stone-600 dark:text-slate-400">
                Assigned:{' '}
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {selectedFinding.assignedAnalyst || 'Alex Carter'}
                </span>
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {selectedFinding.notes && selectedFinding.notes.length > 0 ? (
                selectedFinding.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border text-xs leading-relaxed font-medium shadow-xs"
                    style={{
                      backgroundColor: isLight ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.04)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    {note}
                  </div>
                ))
              ) : (
                <div className="text-xs text-stone-500 dark:text-slate-400 italic">No analyst notes recorded yet.</div>
              )}
            </div>

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Append telemetry log or analyst observation..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none shadow-sm"
                style={{
                  backgroundColor: 'var(--card-sub-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
                style={{
                  backgroundColor: isLight ? '#C2410C' : 'var(--primary-accent-muted)',
                  borderColor: isLight ? '#9A3412' : 'var(--primary-accent)',
                  color: isLight ? '#FFFFFF' : 'var(--primary-accent)'
                }}
              >
                <Send size={12} /> Post
              </button>
            </form>
          </div>

          {/* Workflow Status Controls */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold uppercase tracking-wider font-mono text-stone-700 dark:text-slate-300">
              Update Investigation Status
            </span>
            <div className="grid grid-cols-4 gap-2">
              {(['new', 'under_review', 'resolved', 'escalated'] as FindingStatus[]).map((st) => {
                const isSelected = selectedFinding.status === st;
                return (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className="py-2 px-2 rounded-xl border text-center text-xs font-bold transition-all shadow-sm cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? (isLight ? '#C2410C' : 'var(--primary-accent-muted)')
                        : 'var(--card-sub-bg)',
                      borderColor: isSelected
                        ? (isLight ? '#9A3412' : 'var(--primary-accent)')
                        : 'var(--border-color)',
                      color: isSelected
                        ? '#FFFFFF'
                        : 'var(--text-secondary)'
                    }}
                  >
                    {st === 'under_review' ? 'Review' : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-5 mt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={() => {
              alert(`Takedown notice dispatch simulated for ${selectedFinding.title}`);
            }}
            className="flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
            style={{
              backgroundColor: isLight ? '#DC2626' : 'rgba(244, 63, 94, 0.15)',
              borderColor: isLight ? '#B91C1C' : 'rgba(244, 63, 94, 0.4)',
              color: isLight ? '#FFFFFF' : '#FDA4AF'
            }}
          >
            <Flag size={14} /> Request Takedown
          </button>

          <button
            onClick={handleRunAIAnalysis}
            className="py-2.5 px-3.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
            style={{
              backgroundColor: isLight ? '#F1E2D4' : 'rgba(56, 189, 248, 0.12)',
              borderColor: isLight ? '#D7B69B' : 'rgba(56, 189, 248, 0.35)',
              color: isLight ? '#C2410C' : 'var(--primary-accent)'
            }}
            title="Analyze evidence telemetry with AI"
          >
            <Sparkles size={14} /> AI Analysis
          </button>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Finding evidence link copied to clipboard.');
            }}
            className="py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.01] cursor-pointer"
            style={{
              backgroundColor: isLight ? '#E5D6C5' : 'rgba(255, 255, 255, 0.08)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <Share2 size={14} /> Share IOC
          </button>
        </div>
      </div>
    </div>
  );
};
