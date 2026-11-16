import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mic, MicOff } from 'lucide-react';
import { useVoiceRecognition } from '../utils/useVoiceRecognition.js';
import DynamicClinicalQuestions from './DynamicClinicalQuestions.jsx';
import SoapCaseSheetView from './SoapCaseSheetView.jsx';
import { getClinicalQuestions } from '../services/api.js';

export default function PatientIntakePortal({ language, onStructureComplete, onRedFlagDetected }) {
  const isEnglish = language === 'en';
  const [step, setStep] = useState('describe');
  const [complaint, setComplaint] = useState('');
  const [answers, setAnswers] = useState({});
  const [questions, setQuestions] = useState(null);
  const [allowAiProcessing, setAllowAiProcessing] = useState(false);
  const [questionNotice, setQuestionNotice] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    isListening,
    interimTranscript,
    error: voiceError,
    isSupported,
    startListening,
    stopListening
  } = useVoiceRecognition(language);

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
      return;
    }
    startListening((transcript) => {
      setComplaint((current) => `${current}${current.trim() ? ' ' : ''}${transcript}`);
    });
  };

  const openQuestions = async () => {
    if (!complaint.trim()) {
      setError(isEnglish ? 'Describe your symptoms before continuing.' : 'आगे बढ़ने से पहले अपने लक्षण बताएं।');
      return;
    }
    setError('');
    setQuestionNotice('');
    setQuestions([]);
    if (allowAiProcessing) {
      try {
        const result = await getClinicalQuestions({ complaint, language, allowAiProcessing: true });
        setQuestions(result.questions || []);
        if (!result.questions?.length) {
          setQuestionNotice(isEnglish
            ? 'AI questions were not returned. You can submit your report without answers.'
            : 'एआई प्रश्न नहीं मिले। आप बिना उत्तरों के रिपोर्ट जमा कर सकते हैं।');
        }
      } catch {
        setQuestionNotice(isEnglish
          ? 'AI questions are unavailable. You can submit your report without answers.'
          : 'एआई प्रश्न उपलब्ध नहीं हैं। आप बिना उत्तरों के रिपोर्ट जमा कर सकते हैं।');
      }
    } else {
      setQuestionNotice(isEnglish
        ? 'AI was not used. You can submit your report without generated questions.'
        : 'एआई का उपयोग नहीं किया गया। आप बिना बनाए गए प्रश्नों के रिपोर्ट जमा कर सकते हैं।');
    }
    setStep('questions');
  };

  const submitReport = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await onStructureComplete({
        chiefComplaint: complaint,
        rawText: complaint,
        language,
        clinicalAnswers: answers,
        clinicalQuestions: questions || [],
        allowAiProcessing
      });
      setCaseData(result.caseData);
      setStep('summary');
      if (result.caseData?.isRedFlag) {
        onRedFlagDetected(result.caseData.redFlagReason || '');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || (isEnglish
        ? 'Your report could not be submitted. Please try again.'
        : 'आपकी रिपोर्ट जमा नहीं हो सकी। कृपया फिर प्रयास करें।'));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'summary' && caseData) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-teal-700">{isEnglish ? 'Report submitted' : 'रिपोर्ट जमा हुई'}</p>
            <h2 className="text-2xl font-black text-slate-900">
              {isEnglish ? 'Ready for clinician review' : 'चिकित्सक की समीक्षा के लिए तैयार'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setComplaint('');
              setAnswers({});
              setQuestions(null);
              setAllowAiProcessing(false);
              setCaseData(null);
              setStep('describe');
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            {isEnglish ? 'New report' : 'नई रिपोर्ट'}
          </button>
        </div>
        <SoapCaseSheetView caseData={caseData} language={language} />
      </div>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-widest text-teal-700">
        {step === 'describe'
          ? (isEnglish ? 'Step 1 of 2 · Your words' : 'चरण 1 / 2 · आपकी बात')
          : (isEnglish ? 'Step 2 of 2 · Follow-up' : 'चरण 2 / 2 · आगे के प्रश्न')}
      </p>

      {step === 'describe' ? (
        <>
          <h2 className="mt-2 text-2xl font-black text-slate-900">
            {isEnglish ? 'What would you like the clinician to know?' : 'आप चिकित्सक को क्या बताना चाहेंगे?'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isEnglish
              ? 'Speak or type in your selected language. Review and correct the text before continuing.'
              : 'अपनी चुनी हुई भाषा में बोलें या लिखें। आगे बढ़ने से पहले पाठ जाँचें और सुधारें।'}
          </p>
          <div className="relative mt-5">
            <textarea
              rows={7}
              value={complaint}
              onChange={(event) => setComplaint(event.target.value)}
              placeholder={isEnglish ? 'Describe what you are feeling…' : 'बताएं कि आप क्या महसूस कर रहे हैं…'}
              className="w-full rounded-2xl border border-slate-300 p-4 pr-16 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            />
            <button
              type="button"
              onClick={toggleVoice}
              disabled={!isSupported}
              aria-label={isListening ? 'Stop recording' : 'Start voice input'}
              className={`absolute bottom-4 right-4 rounded-full p-3 text-white ${
                isListening ? 'animate-pulse bg-red-600' : 'bg-teal-600 hover:bg-teal-700'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          {interimTranscript && (
            <p aria-live="polite" className="mt-2 text-sm text-slate-500">{interimTranscript}</p>
          )}
          {(!isSupported || voiceError) && (
            <p role="status" className="mt-2 text-sm text-amber-700">
              {voiceError || (isEnglish
                ? 'Voice input is not supported here. You can type your report.'
                : 'इस ब्राउज़र में आवाज़ इनपुट उपलब्ध नहीं है। आप अपनी बात लिख सकते हैं।')}
            </p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            {isEnglish
              ? 'Browser speech recognition may send audio to the browser provider for transcription. Typing is available instead.'
              : 'ब्राउज़र की आवाज़ पहचान सेवा प्रतिलेखन के लिए ऑडियो अपने प्रदाता को भेज सकती है। इसके बजाय आप लिख सकते हैं।'}
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allowAiProcessing}
              onChange={(event) => setAllowAiProcessing(event.target.checked)}
              className="mt-1 accent-teal-600"
            />
            <span>
              {isEnglish
                ? 'I agree to send my symptom report and answers to Groq for follow-up questions and a neutral summary. The app masks some phone, Aadhaar, and email patterns but may miss personal information; do not include names or identifiers. Groq may retain inference data for up to 30 days for reliability or abuse investigations. I can continue without AI.'
                : 'मैं अपने लक्षण-विवरण और उत्तरों को आगे के प्रश्नों और तटस्थ सारांश के लिए Groq को भेजने की सहमति देता/देती हूँ। ऐप कुछ फोन, आधार और ईमेल पैटर्न छिपाता है, लेकिन व्यक्तिगत जानकारी छूट सकती है; नाम या पहचान-सूचक जानकारी न दें। विश्वसनीयता या दुरुपयोग की जाँच के लिए Groq इनपुट को 30 दिनों तक रख सकता है। मैं एआई के बिना भी जारी रख सकता/सकती हूँ।'}
              {' '}
              <a
                href="https://console.groq.com/docs/your-data"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-teal-700 underline"
              >
                {isEnglish ? 'Groq data policy' : 'Groq डेटा नीति'}
              </a>
            </span>
          </label>
          <button
            type="button"
            onClick={openQuestions}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white hover:bg-teal-700"
          >
            {isEnglish ? 'Continue' : 'आगे बढ़ें'} <ArrowRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-2xl font-black text-slate-900">
            {isEnglish ? 'A few follow-up questions' : 'कुछ आगे के प्रश्न'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isEnglish ? 'These answers help keep the report complete.' : 'इन उत्तरों से रिपोर्ट पूरी करने में मदद मिलेगी।'}
          </p>
          {questionNotice && <p role="status" className="mt-3 text-sm text-amber-700">{questionNotice}</p>}
          <div className="mt-5">
            <DynamicClinicalQuestions
              answers={answers}
              onChange={setAnswers}
              questions={questions || []}
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep('describe')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700"
            >
              <ArrowLeft className="w-4 h-4" /> {isEnglish ? 'Back' : 'पीछे'}
            </button>
            <button
              type="button"
              onClick={submitReport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-bold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? (isEnglish ? 'Submitting…' : 'जमा हो रहा है…')
                : (isEnglish ? 'Submit for clinician review' : 'चिकित्सक समीक्षा के लिए जमा करें')}
            </button>
          </div>
        </>
      )}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
