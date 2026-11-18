import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Clock,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  Building,
  Layers,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

const ALL_ROUNDS = ['Theory Round', 'Practical Round', 'HR Round'];

const getCandidateRounds = (cand) => {
  if (Array.isArray(cand?.assignedRounds) && cand.assignedRounds.length > 0) {
    const ordered = ALL_ROUNDS.filter((r) => cand.assignedRounds.includes(r));
    if (ordered.length > 0) return ordered;
  }
  return ALL_ROUNDS;
};

export default function InterviewerDashboard({ currentUser }) {
  const [assignedCandidates, setAssignedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const interviewerName = (currentUser?.name || '').trim();
  const interviewerEmail = (currentUser?.email || '').toLowerCase().trim();

  // Strictly match ONLY candidates explicitly assigned by Admin to THIS interviewer
  const isAssignedToMe = useCallback(
    (candidate) => {
      if (!candidate) return false;
      const candIntEmail = (candidate.assignedInterviewerEmail || '').toLowerCase().trim();
      const candIntName = (candidate.assignedInterviewer || '').trim();

      if (!candIntEmail && (!candIntName || candIntName.toLowerCase() === 'unassigned')) {
        return false;
      }

      if (candIntEmail && interviewerEmail) {
        return candIntEmail === interviewerEmail;
      }

      return Boolean(interviewerName) && candIntName.toLowerCase() === interviewerName.toLowerCase();
    },
    [interviewerEmail, interviewerName]
  );

  const loadAssignedCandidates = useCallback(
    async (isManual = false) => {
      if (!interviewerName && !interviewerEmail) {
        setAssignedCandidates([]);
        setLoading(false);
        return;
      }

      try {
        if (isManual) setRefreshing(true);
        const res = await api.getCandidates({
          interviewer: interviewerName,
          interviewerEmail: interviewerEmail
        });
        if (res.success && Array.isArray(res.candidates)) {
          // Double-filter client side to guarantee zero leakage of unassigned or other interviewers' candidates
          const mineOnly = res.candidates.filter(isAssignedToMe);
          setAssignedCandidates(mineOnly);
        }
      } catch (err) {
        console.error('Failed to load assigned candidates:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [interviewerName, interviewerEmail, isAssignedToMe]
  );

  useEffect(() => {
    loadAssignedCandidates();
    const interval = setInterval(() => loadAssignedCandidates(false), 5000);
    return () => clearInterval(interval);
  }, [loadAssignedCandidates]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#034665] to-[#045277] rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-sky-100 border border-white/20 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" /> Interviewer Panel
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight brand-font">
            Welcome, {interviewerName || 'Interviewer'}
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 mt-1">
            Only candidates assigned to you by Admin are listed below.
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl text-center min-w-[110px]">
            <span className="text-[10px] uppercase font-bold text-sky-200 block">Assigned To Me</span>
            <span className="text-2xl font-black text-white">{assignedCandidates.length}</span>
          </div>
          <button
            type="button"
            onClick={() => loadAssignedCandidates(true)}
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
            title="Refresh Assigned Candidates"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Assigned Candidates Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 brand-font">
              My Assigned Candidates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Candidates dispatched specifically to <b>{interviewerName}</b> by Admin.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-[#034665] border border-sky-200">
            {assignedCandidates.length} {assignedCandidates.length === 1 ? 'Candidate' : 'Candidates'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-7 h-7 mx-auto mb-2 animate-spin text-[#034665]" />
            <p className="text-xs font-semibold">Loading your assigned candidates...</p>
          </div>
        ) : assignedCandidates.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-700">
              No Candidates Assigned Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              When Admin assigns a candidate to you, they will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assignedCandidates.map((c) => {
              const candRounds = getCandidateRounds(c);
              return (
                <div
                  key={c._id || c.tokenNumber}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-[#034665]/50 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Token + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-[#034665] text-white shrink-0">
                          {c.tokenNumber}
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-slate-900 text-sm truncate">
                            {c.fullName}
                          </h3>
                          <p className="text-[11px] text-slate-500 truncate">
                            {c.domain || c.appliedRole || 'Candidate'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 border ${
                          c.status === 'In-Interview'
                            ? 'bg-sky-100 text-sky-800 border-sky-200'
                            : c.status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : c.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80">
                      {c.department && (
                        <div className="flex items-center gap-2 truncate">
                          <Building className="w-3.5 h-3.5 text-[#034665] shrink-0" />
                          <span className="truncate font-medium text-slate-800">{c.department}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 truncate">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Assigned Rounds & Current Round */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-600 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-[#034665]" /> Current Round:
                        </span>
                        <span className="font-extrabold text-[#034665]">
                          {c.currentRound || candRounds[0]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {candRounds.map((r, i) => (
                          <span
                            key={r}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              c.currentRound === r
                                ? 'bg-[#034665] text-white border-[#034665]'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {i + 1}. {r.replace(' Round', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer: Room & CV Link */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 truncate">
                      Room: <b className="text-slate-800">{c.room || 'Room 1'}</b>
                    </span>

                    {c.resumeLink ? (
                      <a
                        href={api.getFileUrl(c.resumeLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#034665] hover:bg-[#022a3d] text-white text-[11px] font-bold transition-colors shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" /> View CV
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">No CV</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
