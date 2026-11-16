const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class AiServiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
  }
}

const getConfig = () => {
  const { GROQ_API_KEY, GROQ_MODEL } = process.env;
  if (!GROQ_API_KEY || !GROQ_MODEL) {
    throw new AiServiceError('AI_NOT_CONFIGURED', 'Groq API credentials are not configured.');
  }
  return { apiKey: GROQ_API_KEY, model: GROQ_MODEL };
};

const parseJson = (text) => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) {
    throw new AiServiceError('AI_INVALID_RESPONSE', 'The AI response was not valid JSON.');
  }

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AiServiceError('AI_INVALID_RESPONSE', 'The AI response was not valid JSON.');
  }
};

const requestJson = async (prompt) => {
  const { apiKey, model } = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new AiServiceError('AI_REQUEST_FAILED', `Groq API returned status ${response.status}.`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new AiServiceError('AI_INVALID_RESPONSE', 'The AI response was empty.');
    }
    return parseJson(content);
  } catch (error) {
    if (error instanceof AiServiceError) throw error;
    if (error.name === 'AbortError') {
      throw new AiServiceError('AI_TIMEOUT', 'The AI request timed out.');
    }
    throw new AiServiceError('AI_UNAVAILABLE', 'The AI service could not be reached.');
  } finally {
    clearTimeout(timeout);
  }
};

const asString = (value) => typeof value === 'string' ? value.trim() : '';

const asStringArray = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : [];

export const structureClinicalCase = async (rawInput, language, clinicalAnswers = {}) => {
  const parsed = await requestJson(`
You are a clinical documentation assistant. Only restate facts explicitly provided by the patient.
Do not diagnose, suggest diseases, prescribe medicines, recommend tests, or invent findings.
Write the summary in the requested language. Return a JSON object with:
{"aiSummary":"brief neutral summary","reportedSymptoms":["explicitly reported symptoms"],"duration":null,"associatedSymptoms":["other explicitly reported symptoms"]}
Use null for duration when it was not stated. Do not infer missing information.

Language: ${language}
Patient report: ${rawInput}
Follow-up answers: ${JSON.stringify(clinicalAnswers)}`);

  if (!asString(parsed.aiSummary)) {
    throw new AiServiceError('AI_INVALID_RESPONSE', 'The AI response did not contain a summary.');
  }

  return {
    patientReport: rawInput,
    aiSummary: asString(parsed.aiSummary),
    reportedSymptoms: asStringArray(parsed.reportedSymptoms),
    duration: asString(parsed.duration) || null,
    associatedSymptoms: asStringArray(parsed.associatedSymptoms),
    summarySource: 'groq'
  };
};

export const generateClinicalQuestions = async (rawInput, language) => {
  const parsed = await requestJson(`
Generate 3 to 5 short, neutral follow-up questions for a healthcare intake.
Ask only questions that clarify the patient's own report. Do not diagnose or suggest treatment.
Return a JSON object with a questions array. Each question must have a unique short id,
a label in the requested language, and 2 to 5 short answer options in that language.
Do not add questions about details not relevant to the patient report.

Language: ${language}
Patient report: ${rawInput}`);

  if (!Array.isArray(parsed.questions)) {
    throw new AiServiceError('AI_INVALID_RESPONSE', 'The AI response did not contain questions.');
  }

  const seenIds = new Set();
  const questions = parsed.questions
    .filter((question) => question && typeof question.label === 'string')
    .slice(0, 5)
    .map((question, index) => {
      const id = asString(question.id)
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 40) || `question${index + 1}`;
      const uniqueId = seenIds.has(id) ? `question${index + 1}` : id;
      seenIds.add(uniqueId);
      return {
        id: uniqueId,
        label: asString(question.label).slice(0, 240),
        options: asStringArray(question.options).slice(0, 5)
      };
    })
    .filter((question) => question.label && question.options.length >= 2);

  if (questions.length < 3) {
    throw new AiServiceError('AI_INVALID_RESPONSE', 'The AI response did not contain enough valid questions.');
  }
  return questions;
};
