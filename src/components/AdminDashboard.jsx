import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  Star, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download,
  Building,
  Layers,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

const ALL_INTERVIEW_ROUNDS = [
  { id: 'Theory Round', num: 1, label: '1. Theory Round', short: '1. Theory', desc: 'Conceptual & core technical Q&A' },
  { id: 'Practical Round', num: 2, label: '2. Practical Round', short: '2. Practical', desc: 'Hands-on task / live coding test' },
  { id: 'HR Round', num: 3, label: '3. HR Round', short: '3. HR', desc: 'Culture fit, salary & final discussion' }
];

const getCandidateRounds = (cand) => {
  if (Array.isArray(cand?.assignedRounds) && cand.assignedRounds.length > 0) {
    const ordered = ALL_INTERVIEW_ROUNDS.map(r => r.id).filter(id => cand.assignedRounds.includes(id));
    if (ordered.length > 0) return ordered;
  }
  return ALL_INTERVIEW_ROUNDS.map(r => r.id);
};

export default function AdminDashboard({ currentUser }) {
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(null);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected candidate modal for details / actions
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [assignInterviewerModal, setAssignInterviewerModal] = useState(false);
  const [targetInterviewer, setTargetInterviewer] = useState('');
  const [targetRoom, setTargetRoom] = useState('Room 1 - Tech Round');
  const [targetRounds, setTargetRounds] = useState(['Theory Round', 'Practical Round', 'HR Round']);
  const [targetCurrentRound, setTargetCurrentRound] = useState('Theory Round');

  // Person-wise Interview Rounds Modal
  const [roundsModalCandidate, setRoundsModalCandidate] = useState(null);
  const [selectedRounds, setSelectedRounds] = useState(['Theory Round', 'Practical Round', 'HR Round']);
  const [savingRounds, setSavingRounds] = useState(false);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [candRes, statsRes, intRes] = await Promise.all([
        api.getCandidates({ status: statusFilter, role: roleFilter, search: searchQuery }),
        api.getStats(),
        api.getInterviewers()
      ]);

      if (candRes.success) setCandidates(candRes.candidates);
      if (statsRes.success) setStats(statsRes.stats);
      if (intRes.success) setInterviewers(intRes.interviewers);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling every 10 seconds for real-time walk-in updates
    return () => clearInterval(interval);
  }, [statusFilter, roleFilter, searchQuery]);

  // Helper to toggle a round while keeping canonical order (Theory -> Practical -> HR)
  const toggleRoundInList = (roundId, currentList, setList, onChangeCurrent) => {
    const exists = currentList.includes(roundId);
    if (exists && currentList.length === 1) {
      return; // Must keep at least 1 round selected
    }
    const rawNext = exists
      ? currentList.filter(r => r !== roundId)
      : [...currentList, roundId];
    const orderedNext = ALL_INTERVIEW_ROUNDS.map(r => r.id).filter(id => rawNext.includes(id));
    setList(orderedNext);
    if (onChangeCurrent && !orderedNext.includes(targetCurrentRound)) {
      onChangeCurrent(orderedNext[0]);
    }
  };

  // Open Person-wise Interview Rounds modal
  const openRoundsModal = (candidate) => {
    const candRounds = getCandidateRounds(candidate);
    setRoundsModalCandidate(candidate);
    setSelectedRounds(candRounds);
  };

  // Save Person-wise Interview Rounds to MongoDB
  const handleSaveRounds = async (e) => {
    e.preventDefault();
    if (!roundsModalCandidate || selectedRounds.length === 0) return;

    setSavingRounds(true);
    try {
      const ordered = ALL_INTERVIEW_ROUNDS.map(r => r.id).filter(id => selectedRounds.includes(id));
      const payload = { assignedRounds: ordered };
      if (roundsModalCandidate.currentRound !== 'Completed' && !ordered.includes(roundsModalCandidate.currentRound)) {
        payload.currentRound = ordered[0];
      }
      const res = await api.updateCandidate(
        roundsModalCandidate._id || roundsModalCandidate.tokenNumber,
        payload
      );
      if (res.success) {
        if (selectedCandidate && selectedCandidate._id === roundsModalCandidate._id) {
          setSelectedCandidate(res.candidate);
        }
        setRoundsModalCandidate(null);
        loadData();
      } else {
        alert(res.message || 'Failed to update interview rounds');
      }
    } catch (err) {
      alert('Failed to update interview rounds');
    } finally {
      setSavingRounds(false);
    }
  };

  // Handle Assign Interviewer & Room (with person-wise rounds)
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    if (!targetInterviewer) {
      alert('Please select a registered interviewer.');
      return;
    }
    if (!targetRounds || targetRounds.length === 0) {
      alert('Please select at least one interview round.');
      return;
    }

    try {
      const orderedRounds = ALL_INTERVIEW_ROUNDS.map(r => r.id).filter(id => targetRounds.includes(id));
      const activeRound = orderedRounds.includes(targetCurrentRound) ? targetCurrentRound : orderedRounds[0];
      const chosenInterviewer = interviewers.find(i => i.name === targetInterviewer);

      await api.updateCandidate(selectedCandidate._id || selectedCandidate.tokenNumber, {
        assignedInterviewer: targetInterviewer,
        assignedInterviewerEmail: chosenInterviewer?.email || '',
        room: targetRoom,
        assignedRounds: orderedRounds,
        currentRound: activeRound,
        status: 'In-Interview'
      });
      setAssignInterviewerModal(false);
      setSelectedCandidate(null);
      loadData();
    } catch (err) {
      alert('Failed to assign interviewer');
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = [
      'Token',
      'Full Name',
      'Mobile Number',
      'Email ID',
      'Current Address',
      'Department',
      'Domain',
      'CV Link',
      'Category',
      'Salary / Internship',
      'Status',
      'Round',
      'Assigned Interviewer',
      'Latest Remark'
    ];
    const rows = candidates.map(c => {
      const salaryOrIntern = c.candidateType === 'Employee'
        ? (c.salaryExpectation || 'N/A')
        : c.candidateType === 'Intern'
        ? `${c.internshipType || ''} Internship${c.stipendAmount ? ` (${c.stipendAmount})` : ''}`
        : 'Pending';
      const latestNote = Array.isArray(c.feedbacks) && c.feedbacks.length > 0
        ? (c.feedbacks[c.feedbacks.length - 1].notes || '').replace(/"/g, '""')
        : '';
      const cleanAddress = (c.currentAddress || '').replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return [
        c.tokenNumber,
        `"${c.fullName || ''}"`,
        c.phone || '',
        c.email || '',
        `"${cleanAddress}"`,
        `"${c.department || ''}"`,
        `"${c.domain || c.appliedRole || ''}"`,
        `"${c.resumeLink ? api.getFileUrl(c.resumeLink) : ''}"`,
        `"${c.candidateType || 'Pending'}"`,
        `"${salaryOrIntern}"`,
        c.status,
        `"${c.currentRound || ''}"`,
        `"${c.assignedInterviewer || 'Unassigned'}"`,
        `"${latestNote}"`
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kevalon_WalkIn_Candidates_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Waiting':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">⏳ Waiting in Lounge</span>;
      case 'In-Interview':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 animate-pulse">🎙️ In Interview</span>;
      case 'Round 1 Passed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">✅ Round 1 Cleared</span>;
      case 'Round 2 Passed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">⭐ Round 2 Cleared</span>;
      case 'Selected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">🏆 Hired / Selected</span>;
      case 'Rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">❌ Rejected</span>;
      case 'On-Hold':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-800 border border-slate-300">⏸️ On Hold</span>;
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-[#034665] to-[#055d87] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-sky-100 border border-white/20 uppercase tracking-wider">
              Admin & HR Console
            </span>
            <span className="text-xs text-sky-200 font-medium">&bull; Live Synchronized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            Walk-in Interview Command Center
          </h1>
          <p className="text-sky-100 text-sm mt-1 max-w-2xl">
            Real-time candidate tracking, interviewer assignment, live remarks, and hiring decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-[#034665] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Walk-ins</span>
            <Users className="w-4 h-4 text-[#034665]" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.total ?? candidates.length}</div>
          <span className="text-[11px] font-medium text-slate-500">Registered today</span>
        </div>

        {/* Waiting */}
        <div className="bg-amber-50/60 p-4 rounded-2xl shadow-sm border border-amber-200">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Lounge</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats?.waiting ?? 0}</div>
          <span className="text-[11px] font-medium text-amber-600">Waiting for call</span>
        </div>

        {/* In Interview */}
        <div className="bg-sky-50/60 p-4 rounded-2xl shadow-sm border border-sky-200">
          <div className="flex items-center justify-between text-sky-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">In Interview</span>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
          </div>
          <div className="text-2xl font-black text-sky-800">{stats?.inInterview ?? 0}</div>
          <span className="text-[11px] font-medium text-sky-600">Active interviews</span>
        </div>

        {/* Selected / Hired */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl shadow-sm border border-emerald-200">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Selected</span>
            <Star className="w-4 h-4 text-emerald-600 fill-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats?.selected ?? 0}</div>
          <span className="text-[11px] font-medium text-emerald-600">Job offers made</span>
        </div>

        {/* Rejected / Hold */}
        <div className="bg-rose-50/60 p-4 rounded-2xl shadow-sm border border-rose-200">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected / Hold</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{(stats?.rejected ?? 0) + (stats?.onHold ?? 0)}</div>
          <span className="text-[11px] font-medium text-rose-600">Completed reviews</span>
        </div>

      </div>

      {/* Role Breakdown Chips */}
      {stats?.roleBreakdown && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#034665]" /> Role Distribution:
          </span>
          {Object.entries(stats.roleBreakdown).map(([role, count]) => (
            <span 
              key={role}
              onClick={() => setRoleFilter(roleFilter === role ? 'All' : role)}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                roleFilter === role 
                  ? 'bg-[#034665] text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {role}: <b>{count}</b>
            </span>
          ))}
          {roleFilter !== 'All' && (
            <button
              onClick={() => setRoleFilter('All')}
              className="text-xs text-rose-600 underline font-semibold ml-auto"
            >
              Clear Role Filter
            </button>
          )}
        </div>
      )}

      {/* Candidate Queue Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Filters Toolbar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-2">
              <Filter className="w-3.5 h-3.5 text-[#034665]" /> Status:
            </span>
            {['All', 'Waiting', 'In-Interview', 'Selected', 'Rejected', 'On-Hold'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === st
                    ? 'bg-[#034665] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, token, phone..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs text-slate-800 bg-white"
            />
          </div>

        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Token #</th>
                <th className="py-3.5 px-4">Candidate</th>
                <th className="py-3.5 px-4">Department &amp; Domain</th>
                <th className="py-3.5 px-4">Type &amp; Salary / Intern</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Round</th>
                <th className="py-3.5 px-4">Assigned Interviewer</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#034665]" />
                    <p className="text-sm font-semibold">No candidates found matching the filters.</p>
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c._id || c.tokenNumber} className="hover:bg-sky-50/40 transition-colors">
                    
                    {/* Token */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-[#034665] text-white shadow-xs">
                        {c.tokenNumber}
                      </span>
                    </td>

                    {/* Name, Contact & Address */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500">{c.phone} &bull; {c.email}</div>
                      {c.currentAddress && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 max-w-[220px] truncate" title={c.currentAddress}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{c.currentAddress}</span>
                        </div>
                      )}
                    </td>

                    {/* Department & Domain */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#034665] text-xs">
                        {c.department || 'Not Selected'}
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 mt-0.5">
                        {c.domain || c.appliedRole || 'Not Selected'}
                      </div>
                    </td>

                    {/* Type & Salary / Intern */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.candidateType ? (
                        <>
                          <div className="font-medium text-slate-700">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              c.candidateType === 'Employee'
                                ? 'bg-sky-50 text-[#034665] border-sky-200'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            }`}>
                              {c.candidateType}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-slate-700 mt-1">
                            {c.candidateType === 'Employee'
                              ? `Salary: ${c.salaryExpectation || 'N/A'}`
                              : `${c.internshipType || ''} Internship${c.stipendAmount ? ` (${c.stipendAmount})` : ''}`}
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pending</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>

                    {/* Person-Wise Round Only */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#034665] text-xs">{c.currentRound}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {getCandidateRounds(c).map((roundId) => {
                          const rMeta = ALL_INTERVIEW_ROUNDS.find(r => r.id === roundId);
                          const isCurrent = c.currentRound === roundId;
                          return (
                            <span
                              key={roundId}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                                isCurrent
                                  ? 'bg-[#034665] text-white border-[#034665]'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {rMeta ? rMeta.short : roundId}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Assigned Interviewer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {c.assignedInterviewer || 'Unassigned'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Set Person-Wise Rounds */}
                        <button
                          onClick={() => openRoundsModal(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors cursor-pointer"
                          title="Set Interview Rounds for this Candidate (Theory / Practical / HR)"
                        >
                          <Layers className="w-3 h-3" />
                          Rounds ({getCandidateRounds(c).length})
                        </button>

                        {/* Assign Interviewer */}
                        <button
                          onClick={() => {
                            const candRounds = getCandidateRounds(c);
                            setSelectedCandidate(c);
                            const isRegisteredAssigned = interviewers.some(i => i.name === c.assignedInterviewer);
                            setTargetInterviewer(isRegisteredAssigned ? c.assignedInterviewer : '');
                            setTargetRoom(c.room && c.room !== 'Waiting Lounge' ? c.room : 'Room 1 - Tech Round');
                            setTargetRounds(candRounds);
                            setTargetCurrentRound(candRounds.includes(c.currentRound) ? c.currentRound : candRounds[0]);
                            setAssignInterviewerModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-[#034665] font-bold text-xs transition-colors cursor-pointer"
                          title="Assign to Interviewer"
                        >
                          Assign
                        </button>

                        {/* Quick CV Link */}
                        {c.resumeLink && (
                          <a
                            href={api.getFileUrl(c.resumeLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors"
                            title="Open Uploaded CV"
                          >
                            <FileText className="w-3 h-3" />
                            CV
                          </a>
                        )}

                        {/* Quick View Details */}
                        <button
                          onClick={() => setSelectedCandidate(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="View Details & Interviewer Remarks"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing <b>{candidates.length}</b> candidates</span>
        </div>

      </div>

      {/* ASSIGN INTERVIEWER MODAL */}
      {assignInterviewerModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="text-lg font-black text-slate-900 brand-font mb-1">
              Assign Candidate to Interviewer
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Token: <b>{selectedCandidate.tokenNumber}</b> &bull; {selectedCandidate.fullName} ({selectedCandidate.appliedRole})
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Registered Interviewer</label>
                <select
                  value={targetInterviewer}
                  required
                  disabled={interviewers.length === 0}
                  onChange={(e) => {
                    const chosen = interviewers.find(i => i.name === e.target.value);
                    setTargetInterviewer(e.target.value);
                    if (chosen && chosen.room) {
                      setTargetRoom(chosen.room);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {interviewers.length > 0 ? '-- Select Registered Interviewer --' : '-- No Registered Interviewers Yet --'}
                  </option>
                  {interviewers.map((int) => (
                    <option key={int._id || int.id || int.email} value={int.name}>
                      {int.name} ({int.designation || 'Interviewer'})
                    </option>
                  ))}
                </select>
                {interviewers.length === 0 && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">
                    No interviewers have registered yet. Once an interviewer registers, their name will automatically appear here.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Person-Wise Interview Rounds ({targetRounds.length} Selected)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {ALL_INTERVIEW_ROUNDS.map((r) => {
                    const checked = targetRounds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoundInList(r.id, targetRounds, setTargetRounds, setTargetCurrentRound)}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          checked
                            ? 'bg-[#034665] text-white border-[#034665] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                          checked ? 'bg-white text-[#034665] border-white' : 'border-slate-300 bg-white'
                        }`}>
                          {checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </span>
                        <span>{r.short}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Round to Assign */}
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 mt-2">
                  Assign For Round
                </label>
                <select
                  value={targetCurrentRound}
                  onChange={(e) => setTargetCurrentRound(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                >
                  {targetRounds.map((roundId) => {
                    const rMeta = ALL_INTERVIEW_ROUNDS.find(r => r.id === roundId);
                    return (
                      <option key={roundId} value={roundId}>
                        {rMeta ? rMeta.label : roundId}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 text-[#034665] text-xs">
                💡 Assigning will automatically set status to <b>In-Interview</b> and display this candidate in the selected interviewer&apos;s panel.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignInterviewerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={interviewers.length === 0 || !targetInterviewer}
                  className="px-5 py-2 rounded-xl bg-[#034665] hover:bg-[#022a3d] text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS & FEEDBACK HISTORY DRAWER */}
      {selectedCandidate && !assignInterviewerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xl px-3 py-1.5 rounded-xl bg-[#034665] text-white">
                  {selectedCandidate.tokenNumber}
                </span>
                <div>
                  <h3 className="text-xl font-black text-slate-900 brand-font">{selectedCandidate.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedCandidate.department ? `${selectedCandidate.department} • ` : ''}
                    {selectedCandidate.domain || selectedCandidate.appliedRole}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                <div className="mt-1">{getStatusBadge(selectedCandidate.status)}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                <div className="font-bold text-[#034665] text-sm mt-1">
                  {selectedCandidate.candidateType || 'Pending'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {selectedCandidate.candidateType === 'Intern' ? 'Internship Type' : 'Salary Expectation'}
                </span>
                <div className="font-bold text-emerald-700 text-sm mt-1">
                  {selectedCandidate.candidateType === 'Employee'
                    ? (selectedCandidate.salaryExpectation || 'N/A')
                    : selectedCandidate.candidateType === 'Intern'
                    ? `${selectedCandidate.internshipType || ''} Internship${selectedCandidate.stipendAmount ? ` (${selectedCandidate.stipendAmount})` : ''}`
                    : 'Not Recorded'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Current Round</span>
                <div className="font-bold text-slate-800 text-sm mt-1">{selectedCandidate.currentRound || 'Theory Round'}</div>
              </div>
            </div>

            {/* Candidate Submitted Form Details (All 7 Form Fields) */}
            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3 mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <User className="w-4 h-4 text-[#034665]" /> Candidate Submitted Form Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {/* 1. Full Name */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">1. Full Name</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <User className="w-3.5 h-3.5 text-[#034665] shrink-0" />
                    <span>{selectedCandidate.fullName || 'N/A'}</span>
                  </div>
                </div>

                {/* 2. Mobile Number */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">2. Mobile Number</span>
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Phone className="w-3.5 h-3.5 text-[#034665] shrink-0" />
                    <span>{selectedCandidate.phone || 'N/A'}</span>
                  </div>
                </div>

                {/* 3. Email ID */}
                <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">3. Email ID</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 break-all">
                    <Mail className="w-3.5 h-3.5 text-[#034665] shrink-0" />
                    <span>{selectedCandidate.email || 'N/A'}</span>
                  </div>
                </div>

                {/* 4. Current Address */}
                <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">4. Current Address</span>
                  <div className="flex items-start gap-1.5 font-medium text-slate-800 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-[#034665] shrink-0 mt-0.5" />
                    <span>{selectedCandidate.currentAddress || 'Not provided'}</span>
                  </div>
                </div>

                {/* 5. Department */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">5. Department</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#034665]">
                    <Building className="w-3.5 h-3.5 text-[#034665] shrink-0" />
                    <span>{selectedCandidate.department || 'Not selected'}</span>
                  </div>
                </div>

                {/* 6. Domain */}
                <div className="bg-white p-3 rounded-xl border border-slate-200/90">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">6. Domain</span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{selectedCandidate.domain || selectedCandidate.appliedRole || 'Not selected'}</span>
                  </div>
                </div>

                {/* 7. Uploaded CV / Resume */}
                <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">7. Uploaded CV / Resume</span>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 truncate">
                      <FileText className="w-3.5 h-3.5 text-[#034665] shrink-0" />
                      <span className="truncate">
                        {selectedCandidate.resumeLink
                          ? (selectedCandidate.resumeFileName || 'Candidate CV Document')
                          : 'No CV uploaded yet'}
                      </span>
                    </div>
                  </div>
                  {selectedCandidate.resumeLink && (
                    <a
                      href={api.getFileUrl(selectedCandidate.resumeLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#034665] hover:bg-[#022a3d] text-white text-xs font-bold transition-colors shrink-0"
                    >
                      View / Download CV <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Interview Assignment & Rounds Summary */}
            <div className="space-y-3 text-xs mb-6">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-semibold">Assigned Interviewer:</span>
                <span className="font-bold text-slate-800">{selectedCandidate.assignedInterviewer || 'Unassigned'}</span>
              </div>
              {selectedCandidate.candidateType && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-emerald-900 font-bold">
                    Category: {selectedCandidate.candidateType}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {selectedCandidate.candidateType === 'Employee'
                      ? `Salary Expectation: ${selectedCandidate.salaryExpectation || 'N/A'}`
                      : `${selectedCandidate.internshipType || ''} Internship${selectedCandidate.stipendAmount ? ` (${selectedCandidate.stipendAmount})` : ''}`}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-indigo-50/70 border border-indigo-200">
                <div>
                  <span className="text-indigo-900 font-bold block">Assigned Interview Rounds ({getCandidateRounds(selectedCandidate).length}):</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {getCandidateRounds(selectedCandidate).map((roundId) => {
                      const rMeta = ALL_INTERVIEW_ROUNDS.find(r => r.id === roundId);
                      return (
                        <span key={roundId} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-indigo-800 border border-indigo-200">
                          {rMeta ? rMeta.label : roundId}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openRoundsModal(selectedCandidate)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Change Rounds
                </button>
              </div>
            </div>

            {/* Interviewer Feedback Log */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#034665]" /> Interviewer Evaluation Logs ({selectedCandidate.feedbacks?.length || 0})
              </h4>

              {(!selectedCandidate.feedbacks || selectedCandidate.feedbacks.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs">
                  No interview remark recorded yet. Candidate is pending interview round.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCandidate.feedbacks.map((fb, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          {fb.round} &bull; <span className="text-[#034665]">{fb.interviewerName}</span>
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          fb.decision === 'Reject'
                            ? 'bg-rose-50 border-rose-300 text-rose-700'
                            : fb.decision === 'Select' || fb.decision === 'Advance'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-300 text-slate-700'
                        }`}>
                          {fb.decision === 'Reject' ? 'FAILED' : fb.decision === 'Select' || fb.decision === 'Advance' ? 'PASSED' : fb.decision}
                        </span>
                      </div>

                      {/* Employee / Intern & Salary / Internship Details */}
                      {fb.candidateType && (
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className={`px-2.5 py-1 rounded-lg border ${
                            fb.candidateType === 'Employee'
                              ? 'bg-sky-50 text-[#034665] border-sky-200'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          }`}>
                            Category: {fb.candidateType}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {fb.candidateType === 'Employee'
                              ? `Salary Expectation: ${fb.salaryExpectation || 'N/A'}`
                              : `${fb.internshipType || ''} Internship${fb.stipendAmount ? ` (Stipend: ${fb.stipendAmount})` : ''}`}
                          </span>
                        </div>
                      )}

                      {/* Interviewer Remark */}
                      {fb.notes && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Interviewer Remark
                          </span>
                          <p className="text-xs text-slate-700 italic">
                            &quot;{fb.notes}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* SET PERSON-WISE INTERVIEW ROUNDS MODAL */}
      {roundsModalCandidate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 brand-font flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" /> Set Candidate Interview Rounds
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Token: <b>{roundsModalCandidate.tokenNumber}</b> &bull; {roundsModalCandidate.fullName} ({roundsModalCandidate.experience || 'Candidate'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoundsModalCandidate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRounds} className="space-y-4">
              {/* 3 Selectable Round Cards */}
              <div className="space-y-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Rounds for {roundsModalCandidate.fullName}
                </span>
                {ALL_INTERVIEW_ROUNDS.map((r) => {
                  const isChecked = selectedRounds.includes(r.id);
                  const isOnlyOne = isChecked && selectedRounds.length === 1;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRoundInList(r.id, selectedRounds, setSelectedRounds)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-sky-50/70 border-[#034665] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${
                          isChecked
                            ? 'bg-[#034665] border-[#034665] text-white'
                            : 'bg-white border-slate-300'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <span className={`text-xs sm:text-sm font-extrabold block ${isChecked ? 'text-[#034665]' : 'text-slate-700'}`}>
                            {r.label}
                          </span>
                          <span className="text-[11px] text-slate-500 block">{r.desc}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isChecked
                          ? 'bg-[#034665] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isOnlyOne ? 'Min 1' : isChecked ? 'Enabled' : 'Skipped'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Summary Preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Selected Plan ({selectedRounds.length} {selectedRounds.length === 1 ? 'Round' : 'Rounds'}): </span>
                <span className="text-[#034665] font-semibold">
                  {selectedRounds.join(' → ')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRoundsModalCandidate(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRounds || selectedRounds.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#034665] hover:bg-[#022a3d] text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {savingRounds ? 'Saving...' : 'Save Rounds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
