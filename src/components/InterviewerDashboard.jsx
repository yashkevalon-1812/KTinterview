import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ExternalLink, 
  MessageSquare, 
  Code, 
  Award, 
  ChevronRight,
  ShieldAlert,
  Sparkles,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function InterviewerDashboard({ currentUser }) {
  const [candidates, setCandidates] = useState([]);
  const [activeInterviewCandidate, setActiveInterviewCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'waiting' | 'all'
  const [submitting, setSubmitting] = useState(false);

  // Scorecard state
  const [round, setRound] = useState(
    currentUser?.designation?.toLowerCase().includes('hr') 
      ? 'Round 3: HR' 
      : 'Round 1: Technical'
  );
  const [technicalRating, setTechnicalRating] = useState(4);
  const [problemSolvingRating, setProblemSolvingRating] = useState(4);
  const [communicationRating, setCommunicationRating] = useState(4);
  const [experienceMatchRating, setExperienceMatchRating] = useState(4);
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('Advance');

  const interviewerName = currentUser?.name || 'Interviewer';
  const interviewerRoom = currentUser?.room || 'Room 1 - Tech Round';

  const loadCandidates = async () => {
    try {
      const res = await api.getCandidates();
      if (res.success) {
        setCandidates(res.candidates);
        // If we have an active candidate being evaluated, keep their state updated
        if (activeInterviewCandidate) {
          const fresh = res.candidates.find(c => c._id === activeInterviewCandidate._id);
          if (fresh) setActiveInterviewCandidate(fresh);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCandidates();
    const interval = setInterval(loadCandidates, 8000);
    return () => clearInterval(interval);
  }, []);

  // Filter candidates
  const myAssignedCandidates = candidates.filter(
    c => c.assignedInterviewer === interviewerName || c.room === interviewerRoom
  );
  const waitingCandidates = candidates.filter(c => c.status === 'Waiting');

  // Start Interview action
  const handleStartInterview = async (candidate) => {
    try {
      await api.updateCandidate(candidate._id || candidate.tokenNumber, {
        status: 'In-Interview',
        assignedInterviewer: interviewerName,
        room: interviewerRoom,
        currentRound: round
      });
      setActiveInterviewCandidate({
        ...candidate,
        status: 'In-Interview',
        assignedInterviewer: interviewerName,
        room: interviewerRoom
      });
      loadCandidates();
    } catch (err) {
      alert('Could not start interview');
    }
  };

  // Submit Feedback & Decision
  const handleSubmitEvaluation = async (chosenDecision) => {
    if (!activeInterviewCandidate) return;
    setSubmitting(true);

    try {
      const payload = {
        interviewerName,
        round,
        technicalRating,
        communicationRating,
        problemSolvingRating,
        experienceMatchRating,
        decision: chosenDecision || decision,
        notes: notes || 'Interview completed.'
      };

      const res = await api.submitFeedback(activeInterviewCandidate._id, payload);
      if (res.success) {
        alert(`Evaluation recorded! Candidate marked as: ${chosenDecision || decision}`);
        setActiveInterviewCandidate(null);
        setNotes('');
        setTechnicalRating(4);
        setProblemSolvingRating(4);
        setCommunicationRating(4);
        setExperienceMatchRating(4);
        loadCandidates();
      }
    } catch (err) {
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate composite score
  const totalScore = technicalRating + problemSolvingRating + communicationRating + experienceMatchRating;
  const getScoreVerdict = () => {
    if (totalScore >= 18) return { label: 'Top Tier Fit (Hire Recommendation)', color: 'text-emerald-700 bg-emerald-50' };
    if (totalScore >= 14) return { label: 'Solid Candidate (Advance)', color: 'text-sky-700 bg-sky-50' };
    if (totalScore >= 10) return { label: 'Borderline / Needs Second Opinion', color: 'text-amber-700 bg-amber-50' };
    return { label: 'Below Requirements', color: 'text-rose-700 bg-rose-50' };
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      
      {/* Interviewer Profile Header */}
      <div className="bg-gradient-to-r from-[#034665] to-[#045277] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-sky-100 border border-white/20 uppercase tracking-wider">
              Interviewer Assessment Deck
            </span>
            <span className="text-xs text-sky-200 font-medium">&bull; {interviewerRoom}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Welcome, {interviewerName}
          </h1>
          <p className="text-sky-100 text-sm mt-1">
            Designation: <b>{currentUser?.designation || 'Technical Lead'}</b> &bull; Ready to evaluate today's walk-in applicants.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-sky-200 block">Assigned To Me</span>
            <span className="text-xl font-black text-white">{myAssignedCandidates.length}</span>
          </div>
          <div className="bg-white/10 border border-white/20 px-4 py-2.5 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-sky-200 block">Lounge Waiting</span>
            <span className="text-xl font-black text-amber-300">{waitingCandidates.length}</span>
          </div>
        </div>
      </div>

      {/* Main Layout: Split between Evaluation Console and Candidate Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CANDIDATE QUEUE (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h2 className="text-base font-extrabold text-slate-900 brand-font">
                Candidate Queue
              </h2>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'assigned' ? 'bg-[#034665] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Room ({myAssignedCandidates.length})
                </button>
                <button
                  onClick={() => setActiveTab('waiting')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'waiting' ? 'bg-[#034665] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lounge ({waitingCandidates.length})
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'all' ? 'bg-[#034665] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({candidates.length})
                </button>
              </div>
            </div>

            {/* Candidate List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {(activeTab === 'assigned' ? myAssignedCandidates : activeTab === 'waiting' ? waitingCandidates : candidates).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#034665]" />
                  <p className="text-xs font-semibold">No candidates in this queue right now.</p>
                </div>
              ) : (
                (activeTab === 'assigned' ? myAssignedCandidates : activeTab === 'waiting' ? waitingCandidates : candidates).map((c) => {
                  const isSelectedForEval = activeInterviewCandidate?._id === c._id;

                  return (
                    <div
                      key={c._id || c.tokenNumber}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelectedForEval
                          ? 'border-[#034665] bg-sky-50/60 shadow-md ring-2 ring-[#034665]/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-[#034665] text-white">
                            {c.tokenNumber}
                          </span>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{c.fullName}</h3>
                            <p className="text-[11px] text-slate-500">{c.appliedRole} &bull; {c.experience}</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === 'In-Interview' ? 'bg-sky-100 text-sky-800 animate-pulse' :
                          c.status === 'Waiting' ? 'bg-amber-100 text-amber-800' :
                          c.status === 'Selected' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {c.status}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                        <span>Notice: <b>{c.noticePeriod}</b></span>
                        <span>Exp CTC: <b className="text-emerald-700">{c.expectedCtc}</b></span>
                        {c.room && <span>Room: <b>{c.room}</b></span>}
                      </div>

                      {/* Skills */}
                      {c.skills && c.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(Array.isArray(c.skills) ? c.skills : c.skills.split(',')).slice(0, 4).map((sk, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                              {sk.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        {c.resumeLink ? (
                          <a
                            href={c.resumeLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#034665] font-bold flex items-center gap-1 hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" /> Resume
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">No Resume Link</span>
                        )}

                        <button
                          onClick={() => {
                            if (c.status === 'Waiting') {
                              handleStartInterview(c);
                            } else {
                              setActiveInterviewCandidate(c);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            isSelectedForEval
                              ? 'bg-[#034665] text-white'
                              : 'bg-sky-100 hover:bg-[#034665] hover:text-white text-[#034665]'
                          }`}
                        >
                          {c.status === 'Waiting' ? 'Call for Interview' : 'Evaluate Scorecard'}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: EVALUATION SCORECARD CONSOLE (7 Cols) */}
        <div className="lg:col-span-7">
          
          {activeInterviewCandidate ? (
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
              
              {/* Header */}
              <div className="bg-[#034665] p-6 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-xl px-3 py-1.5 rounded-xl bg-white/20 text-white border border-white/20">
                      {activeInterviewCandidate.tokenNumber}
                    </span>
                    <div>
                      <h2 className="text-xl font-extrabold brand-font leading-tight">
                        {activeInterviewCandidate.fullName}
                      </h2>
                      <p className="text-xs text-sky-200 mt-0.5">
                        {activeInterviewCandidate.appliedRole} &bull; {activeInterviewCandidate.experience} Exp &bull; Phone: {activeInterviewCandidate.phone}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-900 animate-pulse">
                    LIVE EVALUATION
                  </span>
                </div>

                {/* Candidate Quick Stats Banner */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[10px] text-sky-200 block uppercase">Notice Period</span>
                    <span className="font-bold">{activeInterviewCandidate.noticePeriod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-sky-200 block uppercase">Current / Expected CTC</span>
                    <span className="font-bold">{activeInterviewCandidate.currentCtc} / {activeInterviewCandidate.expectedCtc}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-sky-200 block uppercase">Resume</span>
                    {activeInterviewCandidate.resumeLink ? (
                      <a href={activeInterviewCandidate.resumeLink} target="_blank" rel="noreferrer" className="font-bold text-amber-300 underline">
                        Open Doc ↗
                      </a>
                    ) : (
                      <span className="text-sky-300">N/A</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scorecard Form */}
              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Round Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Current Evaluation Round
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Round 1: Technical', 'Round 2: Practical', 'Round 3: HR'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRound(r)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          round === r 
                            ? 'bg-[#034665] text-white border-[#034665] shadow-xs' 
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating Criteria Sliders / Stars */}
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                      Evaluation Criteria (1 to 5 Stars)
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreVerdict().color}`}>
                      Total: {totalScore} / 20 &bull; {getScoreVerdict().label}
                    </div>
                  </div>

                  {/* 1. Technical Knowledge */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>1. Technical Proficiency & Core Concepts</span>
                      <span className="text-[#034665] font-extrabold">{technicalRating} / 5 ⭐</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={technicalRating}
                      onChange={(e) => setTechnicalRating(Number(e.target.value))}
                      className="w-full accent-[#034665] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Weak</span>
                      <span>Average</span>
                      <span>Expert</span>
                    </div>
                  </div>

                  {/* 2. Problem Solving */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>2. Problem Solving & Live Coding / Logic</span>
                      <span className="text-[#034665] font-extrabold">{problemSolvingRating} / 5 ⭐</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={problemSolvingRating}
                      onChange={(e) => setProblemSolvingRating(Number(e.target.value))}
                      className="w-full accent-[#034665] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Struggles</span>
                      <span>Capable</span>
                      <span>Outstanding</span>
                    </div>
                  </div>

                  {/* 3. Communication & Attitude */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>3. Communication, Confidence & Culture Fit</span>
                      <span className="text-[#034665] font-extrabold">{communicationRating} / 5 ⭐</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={communicationRating}
                      onChange={(e) => setCommunicationRating(Number(e.target.value))}
                      className="w-full accent-[#034665] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Passive</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  {/* 4. Experience Match */}
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                      <span>4. Experience Match for {activeInterviewCandidate.appliedRole}</span>
                      <span className="text-[#034665] font-extrabold">{experienceMatchRating} / 5 ⭐</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={experienceMatchRating}
                      onChange={(e) => setExperienceMatchRating(Number(e.target.value))}
                      className="w-full accent-[#034665] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Mismatch</span>
                      <span>Aligned</span>
                      <span>Perfect Match</span>
                    </div>
                  </div>

                </div>

                {/* Qualitative Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Interviewer Remarks / Feedback Notes
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe specific strengths, coding exercise results, salary negotiation notes, or reasons for decision..."
                    className="w-full p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs text-slate-800"
                  />
                </div>

                {/* Previous Rounds History (if any) */}
                {activeInterviewCandidate.feedbacks && activeInterviewCandidate.feedbacks.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-2">
                      Prior Round Notes:
                    </span>
                    {activeInterviewCandidate.feedbacks.map((f, i) => (
                      <div key={i} className="text-xs text-amber-900 mb-1.5 pb-1.5 border-b border-amber-200/50 last:border-none">
                        <b>{f.round} ({f.interviewerName}):</b> {f.notes} &bull; Decision: <i>{f.decision}</i>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Decision Action Buttons */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Submit Final Round Decision:
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    
                    {/* Advance */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitEvaluation('Advance')}
                      className="py-3 px-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Pass to Next Round</span>
                    </button>

                    {/* Select */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitEvaluation('Select')}
                      className="py-3 px-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Hire / Selected</span>
                    </button>

                    {/* Hold */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitEvaluation('Hold')}
                      className="py-3 px-3 rounded-xl font-bold text-xs bg-slate-700 hover:bg-slate-800 text-white shadow-md flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Put on Hold</span>
                    </button>

                    {/* Reject */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSubmitEvaluation('Reject')}
                      className="py-3 px-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-md flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject Candidate</span>
                    </button>

                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[450px]">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-[#034665] mb-4">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 brand-font">No Candidate Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                Please select a candidate from your room queue on the left, or click <b>"Call for Interview"</b> on any waiting candidate.
              </p>
              {waitingCandidates.length > 0 && (
                <button
                  onClick={() => handleStartInterview(waitingCandidates[0])}
                  className="px-5 py-2.5 rounded-xl bg-[#034665] hover:bg-[#022a3d] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Call Next Waiting ({waitingCandidates[0].tokenNumber} - {waitingCandidates[0].fullName})
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
