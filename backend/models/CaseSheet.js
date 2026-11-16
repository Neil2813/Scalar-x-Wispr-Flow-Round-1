import mongoose from 'mongoose';

const caseSheetSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  language: { type: String, required: true, default: 'en' },
  rawInput: { type: String, required: true },
  clinicalAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
  clinicalQuestions: { type: [mongoose.Schema.Types.Mixed], default: [] },
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

export const CaseSheetModel = {
  create: async (data) => {
    const record = { ...data, createdAt: new Date(), updatedAt: new Date() };
    return MongooseCaseSheet.create(record);
  },

  findByCaseId: async (caseId) => {
    return MongooseCaseSheet.findOne({ caseId }).lean();
  },

  findAll: async () => {
    return MongooseCaseSheet.find().sort({ createdAt: -1 }).lean();
  },

  updateByCaseId: async (caseId, updateData) => {
    return MongooseCaseSheet.findOneAndUpdate(
      { caseId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
  }
};
