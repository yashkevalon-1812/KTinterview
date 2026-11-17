import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter, 
  UserPlus, 
  Eye, 
  UserCheck, 
  Star, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download,
  Building
} from 'lucide-react';
import { api } from '../services/api';

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

  // New Candidate Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    fullName: '',
    email: '',
    phone: '',
    appliedRole: 'React Developer',
    experience: 'Fresher',
    currentCtc: 'N/A',
    expectedCtc: '4.5 LPA',
    noticePeriod: 'Immediate',
    skills: 'React, JavaScript, HTML, CSS',
    resumeLink: '',
    portfolio: ''
  });

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

  // Handle Quick Status Change
  const handleStatusChange = async (candidateId, newStatus) => {
    try {
      await api.updateCandidate(candidateId, { status: newStatus });
      loadData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Handle Assign Interviewer & Room
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    try {
      await api.updateCandidate(selectedCandidate._id || selectedCandidate.tokenNumber, {
        assignedInterviewer: targetInterviewer || 'Rohit Patel',
        room: targetRoom,
        status: 'In-Interview'
      });
      setAssignInterviewerModal(false);
      setSelectedCandidate(null);
      loadData();
    } catch (err) {
      alert('Failed to assign interviewer');
    }
  };

  // Handle Add New Walk-in Candidate
  const handleAddNewCandidate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.registerCandidate(newCandidate);
      if (res.success) {
        setShowAddModal(false);
        setNewCandidate({
          fullName: '',
          email: '',
          phone: '',
          appliedRole: 'React Developer',
          experience: 'Fresher',
          currentCtc: 'N/A',
          expectedCtc: '4.5 LPA',
          noticePeriod: 'Immediate',
          skills: 'React, JavaScript, HTML, CSS',
          resumeLink: '',
          portfolio: ''
        });
        loadData();
      }
    } catch (err) {
      alert('Failed to register candidate');
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Token', 'Name', 'Phone', 'Email', 'Role', 'Experience', 'Status', 'Current Round', 'Interviewer', 'Expected CTC'];
    const rows = candidates.map(c => [
      c.tokenNumber,
      `"${c.fullName}"`,
      c.phone,
      c.email,
      `"${c.appliedRole}"`,
      `"${c.experience}"`,
      c.status,
      `"${c.currentRound}"`,
      `"${c.assignedInterviewer}"`,
      `"${c.expectedCtc}"`
    ]);
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
            Real-time candidate tracking, interviewer room dispatch, live scorecards, and hiring decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Check In Candidate
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        
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
          <span className="text-[11px] font-medium text-sky-600">Active in rooms</span>
        </div>

        {/* Round 1 Passed */}
        <div className="bg-indigo-50/60 p-4 rounded-2xl shadow-sm border border-indigo-200">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">R1 Cleared</span>
            <CheckCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-800">{stats?.round1Passed ?? 0}</div>
          <span className="text-[11px] font-medium text-indigo-600">Eligible for R2</span>
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
            {['All', 'Waiting', 'In-Interview', 'Round 1 Passed', 'Selected', 'Rejected', 'On-Hold'].map((st) => (
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
                <th className="py-3.5 px-4">Applied Role</th>
                <th className="py-3.5 px-4">Exp & Notice</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Room & Round</th>
                <th className="py-3.5 px-4">Assigned Evaluator</th>
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

                    {/* Name & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500">{c.phone} &bull; {c.email}</div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">{c.appliedRole}</span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {Array.isArray(c.skills) ? c.skills.join(', ') : c.skills}
                      </div>
                    </td>

                    {/* Exp & Notice */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{c.experience}</div>
                      <div className="text-[10px] text-slate-500">Notice: {c.noticePeriod}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(c.status)}
                    </td>

                    {/* Room & Round */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{c.room || 'Lounge'}</div>
                      <div className="text-[10px] text-slate-500">{c.currentRound}</div>
                    </td>

                    {/* Interviewer */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700">
                        {c.assignedInterviewer || 'Unassigned'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Assign Room / Interviewer */}
                        <button
                          onClick={() => {
                            setSelectedCandidate(c);
                            setTargetInterviewer(c.assignedInterviewer || 'Rohit Patel');
                            setTargetRoom(c.room || 'Room 1 - Tech Round');
                            setAssignInterviewerModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-[#034665] font-bold text-xs transition-colors"
                          title="Assign to Interviewer & Room"
                        >
                          Dispatch
                        </button>

                        {/* Quick View Details */}
                        <button
                          onClick={() => setSelectedCandidate(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="View Details & Scorecard History"
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
          <span className="font-medium">Data saved in MongoDB</span>
        </div>

      </div>

      {/* DISPATCH / ASSIGN MODAL */}
      {assignInterviewerModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="text-lg font-black text-slate-900 brand-font mb-1">
              Dispatch Candidate to Interview Room
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Token: <b>{selectedCandidate.tokenNumber}</b> &bull; {selectedCandidate.fullName} ({selectedCandidate.appliedRole})
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Interviewer</label>
                <select
                  value={targetInterviewer}
                  onChange={(e) => {
                    setTargetInterviewer(e.target.value);
                    if (e.target.value === 'Priya Shah') setTargetRoom('Room 2 - Frontend Round');
                    else if (e.target.value === 'Vikas Mehta') setTargetRoom('Room 3 - HR & Culture Round');
                    else if (e.target.value === 'Yash Vaghasiya') setTargetRoom('Room 1 - Tech Round');
                    else setTargetRoom('Room 1 - Tech Round');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                >
                  <option value="Yash Vaghasiya">Yash Vaghasiya (Technical Interviewer)</option>
                  <option value="Rohit Patel">Rohit Patel (Senior Tech Lead)</option>
                  <option value="Priya Shah">Priya Shah (Frontend Lead)</option>
                  <option value="Vikas Mehta">Vikas Mehta (HR Manager)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Interview Room</label>
                <input
                  type="text"
                  value={targetRoom}
                  onChange={(e) => setTargetRoom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  placeholder="e.g. Room 1 - Tech Round"
                />
              </div>

              <div className="p-3 rounded-xl bg-sky-50 text-[#034665] text-xs">
                💡 Assigning will automatically change status to <b>In-Interview</b> and notify the Lobby TV Screen.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignInterviewerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#034665] hover:bg-[#022a3d] text-xs font-bold text-white shadow-md"
                >
                  Confirm Dispatch
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
                  <p className="text-xs text-slate-500">{selectedCandidate.appliedRole} &bull; {selectedCandidate.experience}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                <span className="text-[10px] uppercase font-bold text-slate-400">Current CTC</span>
                <div className="font-bold text-slate-800 text-sm mt-1">{selectedCandidate.currentCtc || 'N/A'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Expected CTC</span>
                <div className="font-bold text-emerald-700 text-sm mt-1">{selectedCandidate.expectedCtc || 'N/A'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Notice Period</span>
                <div className="font-bold text-slate-800 text-sm mt-1">{selectedCandidate.noticePeriod}</div>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="space-y-3 text-xs mb-6">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-500 font-semibold">Contact:</span>
                <span className="font-medium text-slate-800">{selectedCandidate.phone} | {selectedCandidate.email}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                <span className="text-slate-500 font-semibold">Assigned Evaluator & Room:</span>
                <span className="font-medium text-slate-800">{selectedCandidate.assignedInterviewer} ({selectedCandidate.room})</span>
              </div>
              {selectedCandidate.resumeLink && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-sky-50 text-[#034665]">
                  <span className="font-semibold">Candidate Resume:</span>
                  <a href={selectedCandidate.resumeLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-bold underline">
                    Open Resume Document <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Interviewer Feedback Log */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-[#034665]" /> Interviewer Evaluation Logs ({selectedCandidate.feedbacks?.length || 0})
              </h4>

              {(!selectedCandidate.feedbacks || selectedCandidate.feedbacks.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400 text-xs">
                  No interview feedback recorded yet. Candidate is pending interview round.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedCandidate.feedbacks.map((fb, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs">
                          {fb.round} &bull; <span className="text-[#034665]">{fb.interviewerName}</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-300 text-slate-700">
                          Decision: {fb.decision}
                        </span>
                      </div>

                      {/* Ratings */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                        <div>Tech: <b>{fb.technicalRating}/5 ⭐</b></div>
                        <div>Problem Solving: <b>{fb.problemSolvingRating}/5 ⭐</b></div>
                        <div>Comm: <b>{fb.communicationRating}/5 ⭐</b></div>
                        <div>Exp Fit: <b>{fb.experienceMatchRating}/5 ⭐</b></div>
                      </div>

                      {/* Notes */}
                      {fb.notes && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 italic">
                          "{fb.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Status Override Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">Quick Override:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleStatusChange(selectedCandidate._id, 'Waiting')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800"
                >
                  Set Waiting
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCandidate._id, 'Round 1 Passed')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800"
                >
                  Pass R1
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCandidate._id, 'Selected')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800"
                >
                  Select / Hire
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCandidate._id, 'Rejected')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800"
                >
                  Reject
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD WALK-IN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 brand-font mb-1">
              Add New Walk-in Candidate
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Front desk quick check-in. Generates token instantly.
            </p>

            <form onSubmit={handleAddNewCandidate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCandidate.fullName}
                  onChange={(e) => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                  placeholder="e.g. Divyesh Vaghasiya"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    required
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    placeholder="10-digit number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                  <select
                    value={newCandidate.appliedRole}
                    onChange={(e) => setNewCandidate({ ...newCandidate, appliedRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                  >
                    <option value="React Developer">React Developer</option>
                    <option value="Node.js Backend Developer">Node.js Backend Developer</option>
                    <option value="Full Stack MERN Developer">Full Stack MERN Developer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                    <option value="QA Engineer">QA Engineer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Experience</label>
                  <select
                    value={newCandidate.experience}
                    onChange={(e) => setNewCandidate({ ...newCandidate, experience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
                  >
                    <option value="Fresher">Fresher</option>
                    <option value="1-2 Years">1 - 2 Years</option>
                    <option value="2-4 Years">2 - 4 Years</option>
                    <option value="4+ Years">4+ Years</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md"
                >
                  Generate Token & Check In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
