import crypto from 'crypto';
import { CaseSheetModel } from '../models/CaseSheet.js';
import { generateClinicalQuestions, structureClinicalCase } from '../services/aiService.js';
import { checkTriage } from '../utils/triage.js';
import { sanitizeText } from '../middleware/piiSanitizer.js';

const sanitizeAnswers = (answers) =>
  Object.fromEntries(
    Object.entries(answers && typeof answers === 'object' ? answers : {})
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [sanitizeText(key), sanitizeText(value)])
  );

export const structureCase = async (req, res) => {
  try {
    const rawInput = req.body.rawText || req.body.chiefComplaint || '';
    if (typeof rawInput !== 'string' || !rawInput.trim()) {
      return res.status(400).json({ error: 'A symptom description is required.' });
    }

    const patientReport = sanitizeText(rawInput);
    const clinicalAnswers = sanitizeAnswers(req.body.clinicalAnswers);
    const triage = checkTriage(patientReport, Object.values(clinicalAnswers));
    const summary = await structureClinicalCase(patientReport, req.body.language || 'en', clinicalAnswers);
    const caseSheet = await CaseSheetModel.create({
      caseId: `CASE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      language: req.body.language || 'en',
      rawInput: patientReport,
      clinicalAnswers,
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
    const complaint = req.body.rawText || req.body.complaint || req.body.chiefComplaint || '';
    if (typeof complaint !== 'string' || !complaint.trim()) {
      return res.status(400).json({ error: 'A symptom description is required.' });
    }

    const questions = await generateClinicalQuestions(
      sanitizeText(complaint),
      req.body.language || 'en'
    );
    return res.json({ questions });
  } catch (error) {
    console.error('Clinical question generation failed:', error);
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
