import { AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function SoapCaseSheetView({ caseData, language = 'en' }) {
  if (!caseData) return null;
  const isEnglish = language === 'en';
  const summary = caseData.summary || {};
  const answers = Object.entries(caseData.clinicalAnswers || {});

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="bg-slate-900 p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xs text-teal-300">{caseData.caseId}</span>
            <h2 className="mt-1 text-lg font-bold">
              {isEnglish ? 'Patient report' : 'रोगी की रिपोर्ट'}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(caseData.createdAt || Date.now()).toLocaleString()}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            caseData.isVerified
              ? 'bg-emerald-500/20 text-emerald-200'
              : 'bg-amber-500/20 text-amber-200'
          }`}>
            {caseData.isVerified ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            {caseData.isVerified
              ? (isEnglish ? 'Clinician reviewed' : 'चिकित्सक द्वारा समीक्षित')
              : (isEnglish ? 'Pending clinician review' : 'चिकित्सक समीक्षा लंबित')}
          </span>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {caseData.isRedFlag && (
          <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">{isEnglish ? 'Urgent symptoms reported' : 'गंभीर लक्षण बताए गए हैं'}</p>
              <p className="mt-1 text-sm">{caseData.redFlagReason}</p>
            </div>
          </div>
        )}

        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <FileText className="h-4 w-4 text-teal-700" />
            {isEnglish ? 'Patient’s words' : 'रोगी की बात'}
          </h3>
          <blockquote className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-800">
            {caseData.rawInput}
          </blockquote>
        </section>

        <section>
          <h3 className="text-sm font-bold text-slate-700">
            {isEnglish ? 'Neutral summary for clinician review' : 'चिकित्सक समीक्षा के लिए सारांश'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {summary.aiSummary || caseData.rawInput}
          </p>
          {summary.summarySource === 'fallback' && (
            <p className="mt-2 text-xs text-amber-700">
              {isEnglish
                ? 'Automated summarization was unavailable; the patient’s report is shown without interpretation.'
                : 'स्वचालित सारांश उपलब्ध नहीं था; बिना व्याख्या के रोगी की बात दिखाई गई है।'}
            </p>
          )}
        </section>

        {summary.reportedSymptoms?.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-700">
              {isEnglish ? 'Reported symptoms' : 'बताए गए लक्षण'}
            </h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              {summary.reportedSymptoms.map((symptom, index) => <li key={`${symptom}-${index}`}>{symptom}</li>)}
            </ul>
          </section>
        )}

        {answers.length > 0 && (
          <section>
            <h3 className="text-sm font-bold text-slate-700">
              {isEnglish ? 'Follow-up answers' : 'आगे के उत्तर'}
            </h3>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {answers.map(([question, answer]) => (
                <div key={question} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <dt className="font-semibold text-slate-700">{question}</dt>
                  <dd className="mt-1 text-slate-600">{String(answer)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {caseData.doctorNotes && (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="text-sm font-bold text-emerald-900">
              {isEnglish ? 'Clinician notes' : 'चिकित्सक के नोट्स'}
            </h3>
            <p className="mt-1 text-sm text-emerald-900">{caseData.doctorNotes}</p>
          </section>
        )}
      </div>
    </article>
  );
}
