export default function DynamicClinicalQuestions({ answers, onChange, questions = [] }) {
  const updateAnswer = (id, value) => {
    onChange({ ...answers, [id]: value });
  };

  if (!questions.length) return null;

  return (
    <section className="space-y-4" aria-live="polite">
      {questions.map((question, index) => (
        <fieldset key={question.id} className="rounded-2xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-800">
            {index + 1}. {question.label}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateAnswer(question.id, option)}
                aria-pressed={answers[question.id] === option}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  answers[question.id] === option
                    ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/10'
                    : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      <p className="text-xs text-slate-500">
        These questions support documentation only. A qualified clinician must review the report.
      </p>
    </section>
  );
}
