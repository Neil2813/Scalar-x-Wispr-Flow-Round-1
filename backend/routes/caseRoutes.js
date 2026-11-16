import express from 'express';
import {
  structureCase,
  getClinicalQuestions,
  getAllCases,
  verifyCase
} from '../controllers/caseController.js';
import { protect, optionalAuth, authorize } from '../middleware/authMiddleware.js';
import { piiSanitizerMiddleware } from '../middleware/piiSanitizer.js';

const router = express.Router();

router.post('/structure', optionalAuth, piiSanitizerMiddleware, structureCase);
router.post('/questions', optionalAuth, getClinicalQuestions);
router.get('/all', protect, authorize('doctor'), getAllCases);
router.put('/:id/verify', protect, authorize('doctor'), verifyCase);

export default router;
