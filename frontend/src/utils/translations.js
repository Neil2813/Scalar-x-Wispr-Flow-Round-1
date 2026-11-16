export const SPEECH_LANG_CODES = {
  en: 'en-IN',
  hi: 'hi-IN'
};

const TRANSLATIONS = {
  en: {
    emergencyTitle: 'Emergency alert',
    emergencySub: 'Symptoms were flagged for urgent clinician attention.',
    emergencyAction: 'Seek emergency care now if symptoms are severe or worsening.',
    ackBtn: 'Acknowledge',
    callEr: 'Call emergency services'
  },
  hi: {
    emergencyTitle: 'आपातकालीन चेतावनी',
    emergencySub: 'लक्षणों की तत्काल चिकित्सकीय समीक्षा आवश्यक है।',
    emergencyAction: 'लक्षण गंभीर हों या बिगड़ें तो तुरंत आपातकालीन सहायता लें।',
    ackBtn: 'समझ गया',
    callEr: 'आपातकालीन सेवा पर कॉल करें'
  }
};

export const getTranslation = (language = 'en') =>
  TRANSLATIONS[language] || TRANSLATIONS.en;
