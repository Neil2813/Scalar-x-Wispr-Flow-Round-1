import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Stethoscope } from 'lucide-react';
import { getAllCases, verifyCaseSheet } from '../services/api.js';
import SoapCaseSheetView from './SoapCaseSheetView.jsx';

export default function DoctorPortalPage({ user, language = 'en' }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isEnglish = language === 'en';

  const selectedCase = useMemo(
    () => cases.find((caseSheet) => caseSheet.caseId === selectedCaseId) || null,
    [cases, selectedCaseId]
  );

  const loadCases = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getAllCases();
      setCases(result.cases || []);
      setSelectedCaseId((current) =>
        result.cases?.some((caseSheet) => caseSheet.caseId === current)
          ? current
          : result.cases?.[0]?.caseId || ''
      );
    } catch (requestError) {
      setError(requestError.response?.data?.error || (isEnglish ? 'Cases could not be loaded.' : 'केस लोड नहीं हो सके।'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  useEffect(() => {
    setDoctorNotes(selectedCase?.doctorNotes || '');
  }, [selectedCase]);

  const handleVerify = async () => {
    if (!selectedCase || selectedCase.isVerified) return;
    setSaving(true);
    setError('');
    try {
      await verifyCaseSheet(selectedCase.caseId, { doctorNotes });
      await loadCases();
    } catch (requestError) {
      setError(requestError.response?.data?.error || (isEnglish ? 'The case could not be verified.' : 'केस की पुष्टि नहीं हो सकी।'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-teal-700">
            <Stethoscope className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isEnglish ? 'Clinician review' : 'चिकित्सक समीक्षा'}
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-slate-900">
            {isEnglish ? `Welcome, ${user.name}` : `स्वागत है, ${user.name}`}
          </h2>
        </div>
        <button
          type="button"
          onClick={loadCases}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {isEnglish ? 'Refresh' : 'रिफ्रेश'}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <h3 className="text-sm font-bold text-slate-700">
            {isEnglish ? `Patient reports (${cases.length})` : `रोगी रिपोर्ट (${cases.length})`}
          </h3>
          {cases.map((caseSheet) => (
            <button
              type="button"
              key={caseSheet.caseId}
              onClick={() => setSelectedCaseId(caseSheet.caseId)}
              className={`w-full rounded-xl border p-3 text-left ${
                selectedCaseId === caseSheet.caseId ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'
              }`}
            >
              <span className="block font-mono text-xs text-slate-500">{caseSheet.caseId}</span>
              <span className="mt-1 block line-clamp-2 text-sm font-semibold text-slate-800">
                {caseSheet.summary?.aiSummary || caseSheet.rawInput}
              </span>
              <span className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
                caseSheet.isVerified ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {caseSheet.isRedFlag && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                {caseSheet.isVerified
                  ? (isEnglish ? 'Verified' : 'पुष्ट')
                  : (isEnglish ? 'Review needed' : 'समीक्षा आवश्यक')}
              </span>
            </button>
          ))}
          {!loading && cases.length === 0 && (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
              {isEnglish ? 'No patient reports yet.' : 'अभी कोई रोगी रिपोर्ट नहीं है।'}
            </p>
          )}
        </aside>

        <section>
          {selectedCase ? (
            <>
              <SoapCaseSheetView caseData={selectedCase} language={language} />
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                <label className="block text-sm font-bold text-slate-700" htmlFor="doctor-notes">
                  {isEnglish ? 'Clinician notes (optional)' : 'चिकित्सक के नोट्स (वैकल्पिक)'}
                </label>
                <textarea
                  id="doctor-notes"
                  rows={3}
                  value={doctorNotes}
                  onChange={(event) => setDoctorNotes(event.target.value)}
                  disabled={selectedCase.isVerified}
                  className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-sm disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={saving || selectedCase.isVerified}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedCase.isVerified
                    ? (isEnglish ? 'Verified by clinician' : 'चिकित्सक द्वारा पुष्ट')
                    : saving
                      ? (isEnglish ? 'Saving…' : 'सहेजा जा रहा है…')
                      : (isEnglish ? 'Confirm review' : 'समीक्षा की पुष्टि करें')}
                </button>
              </div>
            </>
          ) : !loading && (
            <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              {isEnglish ? 'Select a report to review.' : 'समीक्षा के लिए रिपोर्ट चुनें।'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
