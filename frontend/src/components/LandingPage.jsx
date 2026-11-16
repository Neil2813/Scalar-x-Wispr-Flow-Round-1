import { ArrowRight, HeartPulse, Stethoscope } from 'lucide-react';

export default function LandingPage({ language = 'en', onStartIntake, onDoctorLogin }) {
  const isEnglish = language === 'en';

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 sm:py-16">
      <section className="max-w-3xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-xl p-8 sm:p-12 text-center">
        <div className="inline-flex p-4 rounded-2xl bg-teal-50 text-teal-700 mb-5">
          <HeartPulse className="w-9 h-9" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
          {isEnglish ? 'Healthcare, in your mother tongue' : 'स्वास्थ्य सेवा, आपकी मातृभाषा में'}
        </p>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 mt-3">
          {isEnglish ? 'Tell us how you feel.' : 'बताइए, आप कैसा महसूस कर रहे हैं।'}
        </h2>
        <p className="max-w-xl mx-auto mt-4 text-slate-600">
          {isEnglish
            ? 'Speak or type your symptoms, review the captured details, and share them with a clinician.'
            : 'अपने लक्षण बोलें या लिखें, दर्ज जानकारी जाँचें और चिकित्सक के साथ साझा करें।'}
        </p>
        <button
          type="button"
          onClick={onStartIntake}
          className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md"
        >
          {isEnglish ? 'Start symptom intake' : 'लक्षण बताना शुरू करें'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={onDoctorLogin}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
        >
          <Stethoscope className="w-4 h-4" />
          {isEnglish ? 'Clinician review' : 'चिकित्सक समीक्षा'}
        </button>
      </div>
    </div>
  );
}
