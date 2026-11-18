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
  ExternalLink,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  X,
  AlertCircle,
  Briefcase,
  GraduationCap,
  IndianRupee
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

const formatEmploymentSummary = (obj) => {
  if (!obj?.candidateType) return '';
  if (obj.candidateType === 'Employee') {
    return obj.salaryExpectation
      ? `Employee • Expected Salary: ${obj.salaryExpectation}`
      : 'Employee';
  }
  if (obj.candidateType === 'Intern') {
    if (obj.internshipType === 'Paid') {
      return obj.stipendAmount
        ? `Intern • Paid Internship (${obj.stipendAmount})`
        : 'Intern • Paid Internship';
    }
    if (obj.internshipType === 'Unpaid') {
      return 'Intern • Unpaid Internship';
    }
    return 'Intern';
  }
  return '';
};

export default function InterviewerDashboard({ currentUser }) {
  const [assignedCandidates, setAssignedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Evaluation (Employee/Intern + Salary/Paid-Unpaid + Remark + Pass/Fail) modal state
  const [evaluatingCandidate, setEvaluatingCandidate] = useState(null);
  const [evalRound, setEvalRound] = useState('Theory Round');
  const [candidateType, setCandidateType] = useState(''); // 'Employee' | 'Intern'
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [internshipType, setInternshipType] = useState(''); // 'Paid' | 'Unpaid'
  const [stipendAmount, setStipendAmount] = useState('');
  const [evalResult, setEvalResult] = useState(''); // 'Pass' | 'Fail'
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

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

  // Open evaluation modal for a candidate (pre-fill existing type/salary/internship if recorded)
  const openEvaluateModal = (candidate) => {
    const candRounds = getCandidateRounds(candidate);
    const activeR = candRounds.includes(candidate.currentRound)
      ? candidate.currentRound
      : candRounds[0];
    setEvaluatingCandidate(candidate);
    setEvalRound(activeR);
    setCandidateType(candidate.candidateType || '');
    setSalaryExpectation(candidate.salaryExpectation || '');
    setInternshipType(candidate.internshipType || '');
    setStipendAmount(candidate.stipendAmount || '');
    setEvalResult('');
    setRemark('');
    setModalError('');
  };

  // Submit Candidate Type + Salary/Internship + Remark + Pass / Fail result
  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!evaluatingCandidate) return;

    if (!candidateType) {
      setModalError('Please select whether the candidate is an Employee or an Intern.');
      return;
    }
    if (candidateType === 'Employee' && !salaryExpectation.trim()) {
      setModalError('Please enter the Employee salary expectation.');
      return;
    }
    if (candidateType === 'Intern' && !internshipType) {
      setModalError('Please select Paid Internship or Unpaid Internship.');
      return;
    }
    if (!evalResult) {
      setModalError('Please select Pass or Fail.');
      return;
    }
    if (!remark.trim()) {
      setModalError('Please enter your interview remark.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const payload = {
        interviewerName: interviewerName || 'Interviewer',
        round: evalRound,
        decision: evalResult === 'Pass' ? 'Advance' : 'Reject',
        notes: remark.trim(),
        candidateType,
        salaryExpectation: candidateType === 'Employee' ? salaryExpectation.trim() : '',
        internshipType: candidateType === 'Intern' ? internshipType : '',
        stipendAmount:
          candidateType === 'Intern' && internshipType === 'Paid' ? stipendAmount.trim() : ''
      };

      const res = await api.submitFeedback(
        evaluatingCandidate._id || evaluatingCandidate.tokenNumber,
        payload
      );

      if (res.success) {
        const verdictLabel = evalResult === 'Pass' ? 'PASSED' : 'FAILED';
        setToastMsg(
          `Result saved for ${evaluatingCandidate.fullName} (${evaluatingCandidate.tokenNumber}) — Marked as ${verdictLabel}.`
        );
        setTimeout(() => setToastMsg(''), 5000);
        setEvaluatingCandidate(null);
        setRemark('');
        setEvalResult('');
        loadAssignedCandidates(false);
      } else {
        setModalError(res.message || 'Failed to save interview result.');
      }
    } catch (err) {
      setModalError('Server connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine what happens when Pass is selected for the currently open candidate/round
  const getPassOutcomeHint = () => {
    if (!evaluatingCandidate) return '';
    const candRounds = getCandidateRounds(evaluatingCandidate);
    const idx = candRounds.indexOf(evalRound);
    if (idx !== -1 && idx < candRounds.length - 1) {
      return `Clears ${evalRound} → Moves to ${candRounds[idx + 1]}`;
    }
    return `Final round cleared → Marks candidate as PASSED (Selected)`;
  };

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
            Only candidates assigned to you by Admin are listed below. Record Employee/Intern details, remarks, and Pass / Fail after each interview.
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

      {/* Success Toast */}
      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg('')}
            className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {assignedCandidates.map((c) => {
              const candRounds = getCandidateRounds(c);
              const isCompleted = c.status === 'Selected' || c.status === 'Rejected';
              const lastFeedback =
                Array.isArray(c.feedbacks) && c.feedbacks.length > 0
                  ? c.feedbacks[c.feedbacks.length - 1]
                  : null;
              const employmentInfo = formatEmploymentSummary(c);

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
                          c.status === 'Selected'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : c.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : c.status === 'Round 1 Passed' || c.status === 'Round 2 Passed'
                            ? 'bg-teal-100 text-teal-800 border-teal-200'
                            : c.status === 'In-Interview'
                            ? 'bg-sky-100 text-sky-800 border-sky-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {c.status === 'Selected'
                          ? 'PASSED'
                          : c.status === 'Rejected'
                          ? 'FAILED'
                          : c.status}
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

                    {/* Employee / Intern Summary Pill if recorded */}
                    {employmentInfo && (
                      <div
                        className={`px-3 py-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${
                          c.candidateType === 'Employee'
                            ? 'bg-sky-50 text-[#034665] border-sky-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}
                      >
                        {c.candidateType === 'Employee' ? (
                          <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">{employmentInfo}</span>
                      </div>
                    )}

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

                    {/* Latest Remark Preview if recorded */}
                    {lastFeedback && (
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-500 uppercase">
                            Last Remark ({lastFeedback.round})
                          </span>
                          <span
                            className={`font-black px-1.5 py-0.5 rounded ${
                              lastFeedback.decision === 'Reject'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {lastFeedback.decision === 'Reject' ? 'FAILED' : 'PASSED'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 italic line-clamp-2">
                          "{lastFeedback.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions: Room, View CV & Remark / Pass-Fail Button */}
                  <div className="pt-3 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] font-semibold text-slate-500 truncate">
                        Room: <b className="text-slate-800">{c.room || 'Room 1'}</b>
                      </span>

                      {c.resumeLink ? (
                        <a
                          href={api.getFileUrl(c.resumeLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#034665] border border-sky-200 text-[11px] font-bold transition-colors shrink-0"
                        >
                          <FileText className="w-3.5 h-3.5" /> View CV
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">No CV</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openEvaluateModal(c)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                        isCompleted
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-[#034665] hover:bg-[#022a3d] text-white shadow-md'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      {isCompleted ? 'Update Remark / Result' : 'Add Remark & Pass / Fail'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* REMARK, EMPLOYEE/INTERN & PASS / FAIL MODAL */}
      {evaluatingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-[#034665] px-6 py-4 text-white flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-black text-base px-3 py-1 rounded-xl bg-white/20 border border-white/25 shrink-0">
                  {evaluatingCandidate.tokenNumber}
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-black brand-font truncate">
                    {evaluatingCandidate.fullName}
                  </h3>
                  <p className="text-xs text-sky-200 truncate">
                    {evaluatingCandidate.domain || evaluatingCandidate.appliedRole}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEvaluatingCandidate(null)}
                className="p-1.5 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitResult} className="p-6 space-y-5 overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* 1. Round Selection (Person-Wise Assigned Rounds) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Interview Round
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {getCandidateRounds(evaluatingCandidate).map((r, idx) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEvalRound(r)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        evalRound === r
                          ? 'bg-[#034665] text-white border-[#034665] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {idx + 1}. {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Candidate Type: Employee or Intern */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Candidate Category <span className="text-rose-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateType('Employee');
                      setInternshipType('');
                      setStipendAmount('');
                      setModalError('');
                    }}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                      candidateType === 'Employee'
                        ? 'bg-[#034665] text-white border-[#034665] shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-[#034665]/50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Employee</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCandidateType('Intern');
                      setSalaryExpectation('');
                      setModalError('');
                    }}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                      candidateType === 'Intern'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Intern</span>
                  </button>
                </div>

                {/* Conditional Field for Employee: Salary Expectation */}
                {candidateType === 'Employee' && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Salary Expectation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={salaryExpectation}
                        onChange={(e) => {
                          setSalaryExpectation(e.target.value);
                          if (modalError) setModalError('');
                        }}
                        placeholder="e.g. 25,000 / month or 4.5 LPA"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Conditional Field for Intern: Paid or Unpaid Internship */}
                {candidateType === 'Intern' && (
                  <div className="pt-1 space-y-2.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Internship Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setInternshipType('Paid');
                          setModalError('');
                        }}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          internshipType === 'Paid'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        Paid Internship
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setInternshipType('Unpaid');
                          setStipendAmount('');
                          setModalError('');
                        }}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                          internshipType === 'Unpaid'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                        }`}
                      >
                        Unpaid Internship
                      </button>
                    </div>

                    {internshipType === 'Paid' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Stipend Amount (Optional)
                        </label>
                        <div className="relative">
                          <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={stipendAmount}
                            onChange={(e) => setStipendAmount(e.target.value)}
                            placeholder="e.g. 8,000 / month"
                            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Pass / Fail Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Interview Result (Pass / Fail) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEvalResult('Pass');
                      setModalError('');
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      evalResult === 'Pass'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg scale-[1.01]'
                        : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-sm font-black tracking-wide">PASS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEvalResult('Fail');
                      setModalError('');
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      evalResult === 'Fail'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg scale-[1.01]'
                        : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:border-rose-400'
                    }`}
                  >
                    <XCircle className="w-6 h-6" />
                    <span className="text-sm font-black tracking-wide">FAIL</span>
                  </button>
                </div>

                {evalResult && (
                  <p
                    className={`text-[11px] font-semibold mt-2 px-3 py-1.5 rounded-lg border ${
                      evalResult === 'Pass'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {evalResult === 'Pass'
                      ? getPassOutcomeHint()
                      : 'Marks candidate as FAILED (Rejected) and completes evaluation.'}
                  </p>
                )}
              </div>

              {/* 4. Remark Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Interviewer Remark <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={remark}
                  onChange={(e) => {
                    setRemark(e.target.value);
                    if (modalError) setModalError('');
                  }}
                  placeholder="Write your interview remarks, candidate performance, technical/practical notes, or reason for Pass/Fail..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm text-slate-800 resize-none"
                />
              </div>

              {/* Previous Remarks (if any) */}
              {Array.isArray(evaluatingCandidate.feedbacks) &&
                evaluatingCandidate.feedbacks.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 max-h-32 overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Previous Remarks ({evaluatingCandidate.feedbacks.length})
                    </span>
                    {evaluatingCandidate.feedbacks.map((fb, i) => {
                      const fbEmp = formatEmploymentSummary(fb);
                      return (
                        <div
                          key={i}
                          className="text-xs text-slate-700 pb-1.5 border-b border-slate-200/70 last:border-none last:pb-0"
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span>
                              {fb.round} &bull; {fb.interviewerName}
                            </span>
                            <span
                              className={
                                fb.decision === 'Reject' ? 'text-rose-600' : 'text-emerald-600'
                              }
                            >
                              {fb.decision === 'Reject' ? 'FAILED' : 'PASSED'}
                            </span>
                          </div>
                          {fbEmp && (
                            <div className="text-[10px] font-semibold text-[#034665] mt-0.5">
                              {fbEmp}
                            </div>
                          )}
                          <p className="text-slate-600 italic mt-0.5">"{fb.notes}"</p>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvaluatingCandidate(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 ${
                    evalResult === 'Fail'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : evalResult === 'Pass'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#034665] hover:bg-[#022a3d]'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? 'Saving Result...' : 'Submit Remark & Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
