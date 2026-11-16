import assert from 'node:assert/strict';
import { sanitizeText } from '../backend/middleware/piiSanitizer.js';
import {
  AiServiceError,
  generateClinicalQuestions,
  structureClinicalCase
} from '../backend/services/aiService.js';
import { checkTriage } from '../backend/utils/triage.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GROQ_API_KEY;
const originalModel = process.env.GROQ_MODEL;

try {
  const rawPiiText = 'My phone is 9876543210 and Aadhaar is 1234 5678 9012. I have chest pain.';
  const sanitized = sanitizeText(rawPiiText);
  assert.ok(!sanitized.includes('9876543210'));
  assert.ok(!sanitized.includes('1234 5678 9012'));
  assert.ok(sanitized.includes('[REDACTED PHONE]'));
  assert.ok(sanitized.includes('[REDACTED AADHAAR]'));
  console.log('Passed: PII sanitization');

  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_MODEL;
  await assert.rejects(
    generateClinicalQuestions('Cough', 'en'),
    (error) => error instanceof AiServiceError && error.code === 'AI_NOT_CONFIGURED'
  );
  console.log('Passed: AI configuration errors are explicit');

  process.env.GROQ_API_KEY = 'test-key';
  process.env.GROQ_MODEL = 'test-model';
  const prompts = [];
  globalThis.fetch = async (_url, options) => {
    const request = JSON.parse(options.body);
    prompts.push(request.messages[0].content);
    const content = request.messages[0].content.includes('Generate 3 to 5')
      ? JSON.stringify({
        questions: [
          { id: 'onset', label: 'When did it start?', options: ['Today', 'Earlier'] },
          { id: 'change', label: 'Has it changed?', options: ['Yes', 'No'] },
          { id: 'other', label: 'Any other symptoms?', options: ['Yes', 'No'] }
        ]
      })
      : JSON.stringify({
        aiSummary: 'The patient reports a cough.',
        reportedSymptoms: ['cough'],
        duration: null,
        associatedSymptoms: []
      });

    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content } }] })
    };
  };

  const questions = await generateClinicalQuestions('I have a cough.', 'en');
  assert.equal(questions.length, 3);
  assert.equal(questions[0].id, 'onset');

  const summary = await structureClinicalCase('I have a cough.', 'en', { onset: 'Today' });
  assert.equal(summary.patientReport, 'I have a cough.');
  assert.equal(summary.summarySource, 'groq');
  assert.equal(summary.aiSummary, 'The patient reports a cough.');
  assert.equal(summary.duration, null);
  assert.ok(prompts.every((prompt) => prompt.includes('I have a cough.')));
  console.log('Passed: Groq question and neutral summary handling');

  assert.equal(checkTriage('severe chest pain radiating to left arm', []).isRedFlag, true);
  assert.equal(checkTriage('सीने में दर्द और सांस नहीं आ रही', []).isRedFlag, true);
  console.log('Passed: English and Hindi red-flag checks');
  console.log('ALL focused Viora tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.GROQ_MODEL;
  else process.env.GROQ_MODEL = originalModel;
}
