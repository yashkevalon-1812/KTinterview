import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw,
  FileText,
  Camera,
  UploadCloud,
  ExternalLink,
  Eye,
  Award,
  XCircle,
  Clock,
  UserCheck,
  Star,
  CheckCircle,
  Briefcase,
  HelpCircle,
  FileCheck2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function CandidateDashboard({ currentUser }) {
  const [formData, setFormData] = useState({
    fullName: currentUser?.name || currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    currentAddress: currentUser?.currentAddress || currentUser?.candidateProfile?.currentAddress || '',
    department: currentUser?.department || currentUser?.candidateProfile?.department || '',
    domain: currentUser?.domain || currentUser?.candidateProfile?.domain || ''
  });

  const [tokenNumber, setTokenNumber] = useState(
    currentUser?.tokenNumber || currentUser?.candidateProfile?.tokenNumber || ''
  );
  const [status, setStatus] = useState(
    currentUser?.candidateProfile?.status || 'Waiting'
  );

  // Admin Assigned Interviewer & Room Details
  const [assignedInterviewer, setAssignedInterviewer] = useState(
    currentUser?.assignedInterviewer || currentUser?.candidateProfile?.assignedInterviewer || 'Unassigned'
  );
  const [room, setRoom] = useState(
    currentUser?.room || currentUser?.candidateProfile?.room || 'Waiting Lounge'
  );
  const [currentRound, setCurrentRound] = useState(
    currentUser?.currentRound || currentUser?.candidateProfile?.currentRound || 'Round 1: Technical'
  );
  const [feedbacks, setFeedbacks] = useState(
    currentUser?.feedbacks || currentUser?.candidateProfile?.feedbacks || []
  );

  // CV Upload state
  const [cvFile, setCvFile] = useState(null);
  const [cvPreview, setCvPreview] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [cvFileType, setCvFileType] = useState('');
  const [existingResumeLink, setExistingResumeLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamic Departments & Domains fetched from MongoDB
  const [departmentOptions, setDepartmentOptions] = useState([]);

  // Fetch dynamic departments from MongoDB
  const loadDynamicDepartments = async () => {
    try {
      const res = await api.getDepartments();
      if (res.success && res.departments) {
        setDepartmentOptions(res.departments);
      }
    } catch (err) {
      console.error('Failed to load dynamic departments from MongoDB:', err);
    }
  };

  // Fetch candidate's fresh profile from MongoDB
  const fetchFreshData = async () => {
    try {
      setFetching(true);
      const res = await api.getCandidates({ search: currentUser.email });
      if (res.success && res.candidates && res.candidates.length > 0) {
        const myProfile = res.candidates.find(
          c => c.email.toLowerCase() === currentUser.email.toLowerCase() || 
               (currentUser.tokenNumber && c.tokenNumber === currentUser.tokenNumber)
        );

        if (myProfile) {
          setFormData(prev => ({
            ...prev,
            fullName: myProfile.fullName || prev.fullName || '',
            phone: myProfile.phone || prev.phone || '',
            email: myProfile.email || prev.email || '',
            currentAddress: myProfile.currentAddress || prev.currentAddress || '',
            department: myProfile.department || prev.department || '',
            domain: myProfile.domain || prev.domain || ''
          }));
          setTokenNumber(myProfile.tokenNumber || tokenNumber);
          setStatus(myProfile.status || 'Waiting');
          setAssignedInterviewer(myProfile.assignedInterviewer || 'Unassigned');
          setRoom(myProfile.room || 'Waiting Lounge');
          setCurrentRound(myProfile.currentRound || 'Round 1: Technical');
          setFeedbacks(myProfile.feedbacks || []);
          if (myProfile.resumeLink) {
            setExistingResumeLink(myProfile.resumeLink);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch candidate profile:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadDynamicDepartments();
    fetchFreshData();
    // Auto polling every 5 seconds for live Admin assignment and Pass/Fail updates
    const interval = setInterval(fetchFreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  // When department changes, do not auto-select domain - require candidate to choose
  const handleDepartmentChange = (deptName) => {
    setFormData(prev => ({
      ...prev,
      department: deptName,
      domain: '' // Reset domain so candidate explicitly selects
    }));
  };

  // Handle CV file selection (PDF or Image)
  const handleCVChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File size too large. Please select a file smaller than 20MB.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setErrorMsg('Please upload a PDF document or a Photo / Image file (JPG, PNG, WebP).');
      return;
    }

    setErrorMsg('');
    setCvFile(file);
    setCvFileName(file.name);
    setCvFileType(isPdf ? 'pdf' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      setCvPreview(reader.result); // Base64 data URL
    };
    reader.readAsDataURL(file);
  };

  // Submit candidate details form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.email) {
      setErrorMsg('Name, Phone Number, and Email are required.');
      return;
    }
    if (!formData.department) {
      setErrorMsg('Please select your Department.');
      return;
    }
    if (!formData.domain) {
      setErrorMsg('Please select your Domain.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const candId = tokenNumber || currentUser.email;
      const payload = {
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        currentAddress: formData.currentAddress,
        department: formData.department,
        domain: formData.domain,
        appliedRole: formData.domain || formData.department
      };

      // Include CV file if uploaded
      if (cvPreview) {
        payload.resumeBase64 = cvPreview;
        payload.resumeFileName = cvFileName;
        payload.resumeFileType = cvFileType === 'pdf' ? 'application/pdf' : 'image/jpeg';
      }

      const res = await api.updateCandidate(candId, payload);

      if (res.success) {
        setSuccessMsg('Your Candidate Details & CV have been saved successfully to MongoDB!');
        if (res.candidate && res.candidate.resumeLink) {
          setExistingResumeLink(res.candidate.resumeLink);
        }
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to save details.');
      }
    } catch (err) {
      setErrorMsg('Error connecting to the server. Please check backend.');
    } finally {
      setLoading(false);
    }
  };

  // Render Pass / Fail / Waiting Banner
  const renderStatusBanner = () => {
    const isPassed = status === 'Selected';
    const isRoundPassed = status === 'Round 1 Passed' || status === 'Round 2 Passed';
    const isFailed = status === 'Rejected';
    const isInInterview = status === 'In-Interview';

    if (isPassed) {
      return (
        <div className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-emerald-400 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                <Award className="w-9 h-9 text-amber-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-300 text-emerald-950 uppercase tracking-wider mb-2 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-900" /> RESULT: PASSED / SELECTED (પસંદગી પામેલ છો)
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black brand-font tracking-tight text-white">
                  Congratulations! You Have Passed the Walk-in Interview!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100 mt-1.5 max-w-3xl leading-relaxed">
                  You have successfully cleared all interview rounds at <b>Kevalon Technology</b>! Welcome to our organization. Our HR team will reach out to you with your formal offer letter and joining details.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-white rounded-2xl text-center shrink-0 shadow-2xl border border-emerald-200">
              <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">Final Result</span>
              <span className="text-2xl font-black text-emerald-600 tracking-wide">PASSED</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                Selected
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (isRoundPassed) {
      return (
        <div className="w-full bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-teal-300 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                <CheckCircle className="w-9 h-9 text-teal-200" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-teal-300 text-teal-950 uppercase tracking-wider mb-2 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-teal-900" /> ROUND PASSED (રાઉન્ડ પાસ થયેલ છે)
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black brand-font tracking-tight text-white">
                  Great Job! You Passed {status === 'Round 1 Passed' ? 'Round 1 (Technical)' : 'Round 2'}!
                </h3>
                <p className="text-xs sm:text-sm text-teal-100 mt-1.5 max-w-3xl leading-relaxed">
                  You have successfully cleared this stage. Please stay in the candidate lounge; Admin will dispatch you to your next interview stage: <b>{currentRound}</b>.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-white rounded-2xl text-center shrink-0 shadow-2xl border border-teal-200">
              <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">Round Status</span>
              <span className="text-2xl font-black text-teal-600 tracking-wide">PASSED</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                Next: {currentRound}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div className="w-full bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-rose-300 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
                <XCircle className="w-9 h-9 text-rose-200" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-rose-200 text-rose-950 uppercase tracking-wider mb-2 shadow-xs">
                  <XCircle className="w-4 h-4 text-rose-800" /> RESULT: FAILED / NOT CLEARED (ઇન્ટરવ્યુ ક્લિયર થયેલ નથી)
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black brand-font tracking-tight text-white">
                  Interview Result: Not Cleared (Failed)
                </h3>
                <p className="text-xs sm:text-sm text-rose-100 mt-1.5 max-w-3xl leading-relaxed">
                  Thank you for attending the Kevalon Technology walk-in drive today. Unfortunately, your evaluation did not meet the criteria for this role. We truly appreciate your time and wish you the very best in your career ahead!
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-white rounded-2xl text-center shrink-0 shadow-2xl border border-rose-200">
              <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">Final Result</span>
              <span className="text-2xl font-black text-rose-600 tracking-wide">FAILED</span>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                Not Cleared
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (isInInterview) {
      return (
        <div className="w-full bg-gradient-to-r from-[#034665] via-[#04557d] to-sky-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl border-2 border-sky-400 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner relative">
                <UserCheck className="w-9 h-9 text-sky-200" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#034665] animate-ping"></span>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-sky-300 text-sky-950 uppercase tracking-wider mb-2 shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> IN PROGRESS (ઇન્ટરવ્યુ ચાલુ છે)
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black brand-font tracking-tight text-white">
                  Interview In Progress with {assignedInterviewer}
                </h3>
                <p className="text-xs sm:text-sm text-sky-100 mt-1.5 max-w-3xl leading-relaxed">
                  Your assigned interviewer <b>{assignedInterviewer}</b> is conducting your assessment for <b>{currentRound}</b>. Best of luck!
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-white rounded-2xl text-center shrink-0 shadow-2xl border border-sky-200">
              <span className="text-[11px] font-black uppercase text-slate-400 block tracking-wider">Current Status</span>
              <span className="text-2xl font-black text-[#034665] tracking-wide">ACTIVE</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                In Progress
              </span>
            </div>
          </div>
        </div>
      );
    }

    // If Waiting or not in active result state, do not show waiting banner
    return null;
  };

  // Current domain choices based on selected department
  const currentDeptObj = departmentOptions.find(d => d.name === formData.department);
  const currentDomainChoices = currentDeptObj ? currentDeptObj.domains : [];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-10 py-6 space-y-6">
      
      {/* 1. Top Welcome & Token Banner - Full Screen Width */}
      <div className="w-full bg-[#034665] rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-white/20 text-sky-100 border border-white/20">
              Walk-in Candidate Dashboard
            </span>
            {formData.department ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-sky-900/60 text-sky-200 border border-sky-700/60">
                {formData.department}
              </span>
            ) : null}
            <button 
              onClick={fetchFreshData}
              className="p-1.5 rounded-full text-sky-200 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh from MongoDB"
            >
              <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight brand-font">
            Welcome, {formData.fullName || 'Candidate'}!
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 max-w-2xl">
            Live portal for your walk-in interview. Track your assigned interviewer, real-time pass/fail evaluation, and manage your profile details.
          </p>
        </div>

        {/* Token Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 text-center shadow-2xl border border-slate-100 shrink-0 min-w-[160px]">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Walk-in Token
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-black text-[#034665] my-1">
            {tokenNumber}
          </div>
          <span className={`text-xs font-black px-3 py-1 rounded-full border inline-block ${
            status === 'Selected' || status.includes('Passed')
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : status === 'Rejected'
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-amber-700 bg-amber-50 border-amber-200'
          }`}>
            {status}
          </span>
        </div>
      </div>

      {/* 2. Live Pass / Fail / Interview Progress Banner - Full Screen Width */}
      {renderStatusBanner()}

      {/* 3. Admin Assigned Interviewer & Status Details Deck - 3 Full-Width Cards */}
      <div className="w-full bg-white rounded-3xl p-6 shadow-lg border border-slate-200/90 space-y-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 brand-font flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#034665]" /> Admin Assigned Interviewer & Evaluation Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live updates directly from Kevalon Admin Command Center. Synchronized with MongoDB in real-time.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-sky-50 text-[#034665] border border-sky-200 flex items-center gap-2 self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Cloud Sync
          </span>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Assigned Interviewer */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-sky-300 transition-all flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#034665] flex items-center justify-center shrink-0 shadow-xs font-black text-lg">
              {assignedInterviewer !== 'Unassigned' ? assignedInterviewer[0] : '?'}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Assigned Interviewer
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5 truncate">
                {assignedInterviewer !== 'Unassigned' ? assignedInterviewer : 'Not Assigned Yet'}
              </span>
              <span className={`text-[10px] font-bold mt-1 inline-block px-2.5 py-0.5 rounded-full ${
                assignedInterviewer !== 'Unassigned' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {assignedInterviewer !== 'Unassigned' ? '✓ Assigned by Admin' : '⏳ Admin will assign'}
              </span>
            </div>
          </div>

          {/* Card 2: Current Round */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-amber-300 transition-all flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Interview Round
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 block mt-0.5 truncate">
                {currentRound || 'Round 1: Technical'}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Stage {currentRound.includes('Round 2') ? '2 of 3' : currentRound.includes('Round 3') ? '3 of 3' : '1 of 3'}
              </span>
            </div>
          </div>

          {/* Card 3: Final Result & Status */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition-all flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              status === 'Selected' || status.includes('Passed') 
                ? 'bg-emerald-100 text-emerald-700' 
                : status === 'Rejected' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-sky-100 text-[#034665]'
            }`}>
              {status === 'Selected' || status.includes('Passed') ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : status === 'Rejected' ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Pass / Fail Result
              </span>
              <span className={`text-sm sm:text-base font-black block mt-0.5 truncate ${
                status === 'Selected' || status.includes('Passed') 
                  ? 'text-emerald-700' 
                  : status === 'Rejected' 
                  ? 'text-rose-700' 
                  : 'text-amber-700'
              }`}>
                {status === 'Selected' ? 'PASSED (SELECTED)' : status === 'Rejected' ? 'FAILED' : status.toUpperCase()}
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Recorded by Evaluator
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Full-Screen 2-Column Split Layout */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side (4 Cols): Interview Process, Evaluator Feedback, & Instructions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Interviewer Feedback Log (if available) */}
          {feedbacks && feedbacks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 brand-font flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> Interviewer Remarks
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {feedbacks.length} Record(s)
                </span>
              </div>
              
              <div className="space-y-3">
                {feedbacks.map((fb, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {fb.round}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        fb.decision === 'Select' || fb.decision === 'Advance' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : fb.decision === 'Reject' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {fb.decision === 'Select' ? 'PASSED' : fb.decision === 'Advance' ? 'ADVANCED' : fb.decision === 'Reject' ? 'FAILED' : 'ON HOLD'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#034665] font-semibold">
                      Interviewer: {fb.interviewerName}
                    </div>

                    {fb.notes && (
                      <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200 mt-1">
                        "{fb.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Walk-in Process Tracker Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 brand-font flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-[#034665]" /> Walk-in Interview Process
            </h3>

            <div className="space-y-3 text-xs">
              
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950 block">1. Walk-in Registration</span>
                  <span className="text-emerald-800 text-[11px]">Token {tokenNumber} generated and profile recorded in MongoDB.</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-sky-50/70 border border-sky-200">
                <FileCheck2 className="w-4 h-4 text-[#034665] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-sky-950 block">2. CV / Resume Submission</span>
                  <span className="text-sky-800 text-[11px]">Upload your PDF or take/upload photo below.</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <UserCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">3. Interviewer Allocation</span>
                  <span className="text-slate-600 text-[11px]">
                    Admin dispatches you to your room. Current: <b>{assignedInterviewer !== 'Unassigned' ? assignedInterviewer : 'In Queue'}</b>
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <Award className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">4. Evaluation & Result</span>
                  <span className="text-slate-600 text-[11px]">Live Pass / Fail verdict updated instantly.</span>
                </div>
              </div>

            </div>
          </div>

          {/* Company & Support Help Card */}
          <div className="bg-gradient-to-br from-slate-900 to-[#034665] text-white rounded-3xl p-6 shadow-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-200 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-sky-300" /> Kevalon Technology Desk
            </h4>
            <p className="text-xs text-sky-100 leading-relaxed">
              If you have any questions regarding your interview room, token call, or documents, please contact our HR desk at the reception lounge.
            </p>
            <div className="text-[11px] text-sky-200/80 pt-1 border-t border-white/10 flex items-center justify-between">
              <span>Drive Location: Reception Lounge</span>
              <span>Kevalon Technology</span>
            </div>
          </div>

        </div>

        {/* Right Side (8 Cols): Candidate Profile & CV Upload Form */}
        <div className="lg:col-span-8">
          
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200/90 overflow-hidden">
            
            {/* Form Header */}
            <div className="px-6 sm:px-8 py-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 brand-font flex items-center gap-2">
                  <User className="w-5 h-5 text-[#034665]" /> Candidate Profile & Interview Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete all details and upload your CV (PDF or Photo). Stored directly into Kevalon MongoDB.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-sky-50 text-[#034665] border border-sky-200 self-start sm:self-auto">
                Token: {tokenNumber}
              </span>
            </div>

            {/* Form Body */}
            <div className="p-6 sm:p-8">
              
              {/* Success Message */}
              {successMsg && (
                <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="font-semibold">{successMsg}</span>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* 2-Column Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* 1. Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      1. Full Name <span className="text-red-500 font-black ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 2. Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      2. Mobile Number <span className="text-red-500 font-black ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 3. Email ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Email ID <span className="text-red-500 font-black ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 4. Current Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      4. Current Address <span className="text-red-500 font-black ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea
                        rows={2}
                        required
                        value={formData.currentAddress}
                        onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })}
                        placeholder="Enter your current residential address, city, state, pin code"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  {/* 5. Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      5. Department <span className="text-red-500 font-black ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={formData.department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm font-semibold text-slate-800 bg-white cursor-pointer"
                      >
                        <option value="">-- Select Department --</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept.name} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 6. Domain */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      6. Domain <span className="text-red-500 font-black ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={formData.domain}
                        onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                        required
                        disabled={!formData.department}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#034665] text-xs sm:text-sm font-medium text-slate-800 bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">
                          {formData.department ? '-- Select Domain --' : '-- Select Department First --'}
                        </option>
                        {currentDomainChoices.map((dm) => (
                          <option key={dm} value={dm}>
                            {dm}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {formData.department ? (
                        <>Role under <b>{formData.department}</b></>
                      ) : (
                        'Please choose your department first'
                      )}
                    </span>
                  </div>

                </div>

                {/* 7. Upload CV / Resume (PDF or Photo / Image) - DIRECTLY BELOW DOMAIN */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>7. Upload CV / Resume (PDF or Photo)</span>
                    <span className="text-[11px] font-normal text-slate-400 lowercase">Upload PDF or take/upload photo</span>
                  </label>

                  <div className="border-2 border-dashed border-slate-300 hover:border-[#034665] rounded-2xl p-5 sm:p-6 transition-colors bg-slate-50/70 text-center">
                    
                    {cvPreview ? (
                      /* Live Preview */
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-3.5">
                          {cvFileType === 'image' ? (
                            <img 
                              src={cvPreview} 
                              alt="CV Preview" 
                              className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                              <FileText className="w-8 h-8" />
                            </div>
                          )}
                          <div className="text-left">
                            <span className="text-sm font-bold text-slate-800 block truncate max-w-sm">
                              {cvFileName}
                            </span>
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to upload ({cvFileType.toUpperCase()})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCvFile(null);
                            setCvPreview(null);
                            setCvFileName('');
                            setCvFileType('');
                          }}
                          className="text-xs text-rose-600 hover:text-rose-800 font-bold px-3.5 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors"
                        >
                          Remove / Change
                        </button>
                      </div>
                    ) : (
                      /* Upload Actions */
                      <div>
                        <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-800">
                          Upload your CV / Resume or take a photo
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 mb-4">
                          Supports PDF documents or Camera Photo / Images (JPG, PNG, WebP) up to 20MB
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {/* Button 1: PDF Document Upload */}
                          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#034665] border-2 border-slate-300 hover:border-[#034665] hover:bg-sky-50 shadow-xs cursor-pointer transition-colors">
                            <FileText className="w-4 h-4 text-[#034665]" />
                            <span>Upload PDF File</span>
                            <input
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handleCVChange}
                              className="hidden"
                            />
                          </label>

                          {/* Button 2: Photo / Camera / Image Upload */}
                          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#034665] text-white hover:bg-[#02334a] shadow-md cursor-pointer transition-colors">
                            <Camera className="w-4 h-4" />
                            <span>Take Photo / Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleCVChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Show Existing Stored Resume link from MongoDB if present */}
                    {existingResumeLink && !cvPreview && (
                      <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-600">
                        <span className="font-medium">Previously Uploaded CV:</span>
                        <a
                          href={existingResumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#034665] hover:underline flex items-center gap-1.5 bg-sky-50 px-3 py-1 rounded-lg border border-sky-200"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Uploaded CV
                        </a>
                      </div>
                    )}

                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-[#034665] hover:bg-[#02334a] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Saving to MongoDB...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save & Submit Details to Kevalon
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
