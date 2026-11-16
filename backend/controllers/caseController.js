import crypto from 'crypto';
import { CaseSheetModel } from '../models/CaseSheet.js';
import { AiServiceError, generateClinicalQuestions, structureClinicalCase } from '../services/aiService.js';
import { checkTriage } from '../utils/triage.js';
import { sanitizeText } from '../middleware/piiSanitizer.js';

const sanitizeAnswers = (answers) =>
  Object.fromEntries(
    Object.entries(answers && typeof answers === 'object' ? answers : {})
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [sanitizeText(key), sanitizeText(value)])
  );

const isSupportedLanguage = (language) => language === 'en' || language === 'hi';

export const structureCase = async (req, res) => {
  try {
    const rawInput = req.body.rawText || req.body.chiefComplaint || '';
    if (typeof rawInput !== 'string' || !rawInput.trim()) {
      return res.status(400).json({ error: 'A symptom description is required.' });
    }

    const language = req.body.language || 'en';
    if (!isSupportedLanguage(language)) {
      return res.status(400).json({ error: 'Language must be en or hi.' });
    }

    const patientReport = sanitizeText(rawInput);
    const clinicalAnswers = sanitizeAnswers(req.body.clinicalAnswers);
    const triage = checkTriage(patientReport, Object.values(clinicalAnswers));
    const clinicalQuestions = Array.isArray(req.body.clinicalQuestions)
      ? req.body.clinicalQuestions
        .filter((question) => question && typeof question.id === 'string' && typeof question.label === 'string')
        .map((question) => ({ id: sanitizeText(question.id), label: sanitizeText(question.label) }))
        .slice(0, 5)
      : [];
    let summary = { patientReport, summarySource: 'patient_report' };
    if (req.body.allowAiProcessing === true) {
      try {
        summary = await structureClinicalCase(patientReport, language, clinicalAnswers);
      } catch (error) {
        console.warn('AI summary unavailable:', error.code || 'AI_UNAVAILABLE');
      }
    }

    const caseSheet = await CaseSheetModel.create({
      caseId: `CASE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      language,
      rawInput: patientReport,
      clinicalAnswers,
      clinicalQuestions,
      summary,
      isRedFlag: triage.isRedFlag,
      redFlagReason: triage.reason,
      isVerified: false,
      doctorNotes: '',
      verifiedBy: { doctorName: '', verifiedAt: null }
    });

    return res.status(201).json({
      message: 'Patient report saved for clinician review.',
      caseId: caseSheet.caseId,
      caseData: caseSheet
    });
  } catch (error) {
    console.error('Case structuring failed:', error);
    return res.status(500).json({ error: 'The patient report could not be processed.' });
  }
};

export const getClinicalQuestions = async (req, res) => {
  try {
    if (req.body.allowAiProcessing !== true) {
      return res.status(403).json({ error: 'Patient consent is required for AI processing.' });
    }

    const complaint = req.body.rawText || req.body.complaint || req.body.chiefComplaint || '';
    if (typeof complaint !== 'string' || !complaint.trim()) {
      return res.status(400).json({ error: 'A symptom description is required.' });
    }

    const language = req.body.language || 'en';
    if (!isSupportedLanguage(language)) {
      return res.status(400).json({ error: 'Language must be en or hi.' });
    }

    const questions = await generateClinicalQuestions(
      sanitizeText(complaint),
      language
    );
    return res.json({ questions });
  } catch (error) {
    if (error instanceof AiServiceError) {
      console.warn('Clinical question generation unavailable:', error.code);
      return res.status(503).json({ error: 'AI follow-up questions are unavailable.', code: error.code });
    }
    console.error('Clinical question generation failed:', error.message);
    return res.status(500).json({ error: 'Follow-up questions could not be prepared.' });
  }
};

export const getAllCases = async (_req, res) => {
  try {
    return res.json({ cases: await CaseSheetModel.findAll() });
  } catch (error) {
    console.error('Case list retrieval failed:', error);
    return res.status(500).json({ error: 'Cases could not be loaded.' });
  }
};

export const verifyCase = async (req, res) => {
  try {
    const existing = await CaseSheetModel.findByCaseId(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Case not found.' });
    }
    if (existing.isVerified) {
      return res.status(409).json({ error: 'Case has already been verified.' });
    }

    const caseSheet = await CaseSheetModel.updateByCaseId(req.params.id, {
      isVerified: true,
      doctorNotes: typeof req.body.doctorNotes === 'string' ? sanitizeText(req.body.doctorNotes) : '',
      verifiedBy: {
        doctorName: req.user.name || req.user.email,
        verifiedAt: new Date()
      }
    });

    return res.json({ message: 'Case verified by clinician.', caseSheet });
  } catch (error) {
    console.error('Case verification failed:', error);
    return res.status(500).json({ error: 'The case could not be verified.' });
  }
};
