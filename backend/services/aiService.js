import { GoogleGenerativeAI } from '@google/generative-ai';

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-3.6-flash' });
};

const cleanJson = (text) => JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

const asString = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

const asStringArray = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean) : [];

export const structureClinicalCase = async (rawInput, language = 'en', clinicalAnswers = {}) => {
  const model = getModel();
  if (model) {
    try {
      const prompt = `
You are a clinical documentation assistant. Summarize only what the patient reported and the answers provided.
Do not diagnose, suggest possible diseases, prescribe medicines, recommend tests, or invent examination findings.
Keep the patient's original report separate from the neutral summary. Return valid JSON only:
{
  "aiSummary": "Short neutral summary in the requested language",
  "reportedSymptoms": ["Symptoms explicitly reported"],
  "duration": "Reported duration, or Not specified",
  "associatedSymptoms": ["Other explicitly reported symptoms"]
}

Requested language: ${language}
Patient report: ${rawInput}
Follow-up answers: ${JSON.stringify(clinicalAnswers)}`;
      const result = await model.generateContent(prompt);
      const parsed = cleanJson(result.response.text());
      return {
        patientReport: rawInput,
        aiSummary: asString(parsed.aiSummary, rawInput),
        reportedSymptoms: asStringArray(parsed.reportedSymptoms),
        duration: asString(parsed.duration, 'Not specified'),
        associatedSymptoms: asStringArray(parsed.associatedSymptoms),
        summarySource: 'ai'
      };
    } catch (error) {
      console.warn('Clinical summary generation failed; preserving the patient report:', error.message);
    }
  }

  return {
    patientReport: rawInput,
    aiSummary: rawInput,
    reportedSymptoms: [],
    duration: 'Not specified',
    associatedSymptoms: [],
    summarySource: 'fallback'
  };
};

const FALLBACK_QUESTIONS = {
  en: [
    'When did this problem begin?',
    'Has it changed or worsened since it began?',
    'Where do you feel the symptom?',
    'How does it affect your usual activities?',
    'What seems to make it better or worse?',
    'Have you noticed any other symptoms?',
    'Have you had this problem before?',
    'Are you experiencing severe or rapidly worsening symptoms right now?'
  ],
  hi: [
    'यह समस्या कब शुरू हुई?',
    'शुरू होने के बाद से क्या यह बदली है या बढ़ी है?',
    'आपको यह लक्षण शरीर में कहाँ महसूस होता है?',
    'इससे आपकी रोज़मर्रा की गतिविधियों पर क्या असर पड़ता है?',
    'किस बात से यह बेहतर या बदतर होता है?',
    'क्या आपने कोई अन्य लक्षण महसूस किए हैं?',
    'क्या यह समस्या पहले भी हुई है?',
    'क्या अभी कोई गंभीर या तेज़ी से बिगड़ता लक्षण है?'
  ]
};

export const generateClinicalQuestions = async (rawInput, language = 'en') => {
  const model = getModel();
  if (model) {
    try {
      const prompt = `
Generate 6 to 8 short, neutral follow-up questions for a healthcare intake.
Ask only for information that helps document the patient's report. Do not diagnose or suggest treatment.
Return valid JSON only: {"questions":[{"id":"shortId","label":"Question","options":["No","Yes","Not sure"]}]}

Requested language: ${language}
Patient report: ${rawInput}`;
      const result = await model.generateContent(prompt);
      const parsed = cleanJson(result.response.text());
      if (Array.isArray(parsed.questions)) {
        const questions = parsed.questions
          .filter((question) => question && typeof question.label === 'string')
          .slice(0, 8)
          .map((question, index) => ({
            id: asString(question.id, `question${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40),
            label: question.label.trim().slice(0, 240),
            options: asStringArray(question.options).slice(0, 5)
          }))
          .filter((question) => question.id && question.label && question.options.length >= 2);
        if (questions.length >= 6) return questions;
      }
    } catch (error) {
      console.warn('Clinical question generation failed; using the local question set:', error.message);
    }
  }

  const questions = FALLBACK_QUESTIONS[language] || FALLBACK_QUESTIONS.en;
  return questions.map((label, index) => ({
    id: `question${index + 1}`,
    label,
    options: ['No', 'Yes', 'Not sure']
  }));
};
