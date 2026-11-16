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
    try {
      const result = await getClinicalQuestions({ complaint, language });
      setQuestions(result.questions || null);
    } catch {
      setQuestions(null);
      setQuestionNotice(isEnglish
        ? 'AI questions are unavailable. Using the local question set.'
        : 'एआई प्रश्न उपलब्ध नहीं हैं। स्थानीय प्रश्नों का उपयोग किया जा रहा है।');
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
        clinicalAnswers: answers
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
              complaint={complaint}
              answers={answers}
              onChange={setAnswers}
              questions={questions}
              isAiGenerated={Boolean(questions)}
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
