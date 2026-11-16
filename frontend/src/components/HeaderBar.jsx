import { HeartPulse, Languages, LogOut, Stethoscope } from 'lucide-react';

export default function HeaderBar({ user, language, onLanguageChange, onOpenAuth, onLogout }) {
  const isEnglish = language === 'en';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3.5 shadow-lg sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2.5 rounded-xl text-white">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight">Viora</h1>
            <p className="text-[11px] text-slate-400">
              {isEnglish ? 'Care starts in your language' : 'देखभाल आपकी भाषा में'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-xl text-xs">
            <Languages className="w-4 h-4 text-teal-400" />
            <select
              aria-label={isEnglish ? 'Language' : 'भाषा'}
              value={language}
              onChange={(event) => onLanguageChange(event.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="en" className="bg-slate-900">English</option>
              <option value="hi" className="bg-slate-900">हिन्दी</option>
            </select>
          </label>

          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl text-xs font-bold hover:bg-slate-700"
            >
              <span>{user.name}</span>
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold"
            >
              <Stethoscope className="w-4 h-4" />
              {isEnglish ? 'Clinician sign in' : 'चिकित्सक लॉगिन'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
