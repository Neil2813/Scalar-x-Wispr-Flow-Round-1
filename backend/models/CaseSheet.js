import mongoose from 'mongoose';
import { mockDatabase } from '../config/db.js';

const caseSheetSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  language: { type: String, required: true, default: 'en' },
  rawInput: { type: String, required: true },
  clinicalAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
  summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRedFlag: { type: Boolean, default: false },
  redFlagReason: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  doctorNotes: { type: String, default: '' },
  verifiedBy: {
    doctorName: { type: String, default: '' },
    verifiedAt: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MongooseCaseSheet = mongoose.models.CaseSheet || mongoose.model('CaseSheet', caseSheetSchema);

const toPlainObject = (document) => document?.toObject ? document.toObject() : document;

export const CaseSheetModel = {
  create: async (data) => {
    const record = { ...data, createdAt: new Date(), updatedAt: new Date() };
    mockDatabase.caseSheets.set(record.caseId, record);

    if (mongoose.connection.readyState === 1) {
      try {
        const created = await MongooseCaseSheet.create(record);
        const saved = toPlainObject(created);
        mockDatabase.caseSheets.set(saved.caseId, saved);
        return saved;
      } catch (error) {
        console.error('Mongo case insert failed; retaining the local case:', error);
      }
    }

    return record;
  },

  findByCaseId: async (caseId) => {
    const localCase = mockDatabase.caseSheets.get(caseId);
    if (localCase) return localCase;

    if (mongoose.connection.readyState === 1) {
      const saved = await MongooseCaseSheet.findOne({ caseId }).lean();
      return saved || null;
    }

    return null;
  },

  findAll: async () => {
    const localCases = Array.from(mockDatabase.caseSheets.values());
    if (mongoose.connection.readyState !== 1) return localCases;

    const savedCases = await MongooseCaseSheet.find().sort({ createdAt: -1 }).lean();
    const casesById = new Map(savedCases.map((caseSheet) => [caseSheet.caseId, caseSheet]));
    for (const localCase of localCases) {
      casesById.set(localCase.caseId, localCase);
    }
    return Array.from(casesById.values()).sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  },

  updateByCaseId: async (caseId, updateData) => {
    const localCase = mockDatabase.caseSheets.get(caseId);
    let updated = localCase ? { ...localCase, ...updateData, updatedAt: new Date() } : null;

    if (mongoose.connection.readyState === 1) {
      const saved = await MongooseCaseSheet.findOneAndUpdate(
        { caseId },
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      ).lean();
      if (saved) updated = saved;
    }

    if (updated) mockDatabase.caseSheets.set(caseId, updated);
    return updated;
  }
};
