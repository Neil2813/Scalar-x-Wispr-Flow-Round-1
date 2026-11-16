import assert from 'assert';
import { sanitizeText } from '../backend/middleware/piiSanitizer.js';
import { structureClinicalCase } from '../backend/services/aiService.js';
import { CaseSheetModel } from '../backend/models/CaseSheet.js';
import { checkTriage } from '../backend/utils/triage.js';

console.log('Starting Viora SIH 2026 Verification Test Suite...');

try {
  const rawPiiText = 'My phone is 9876543210 and Aadhaar is 1234 5678 9012. I have chest pain.';
  const sanitized = sanitizeText(rawPiiText);
  assert.ok(!sanitized.includes('9876543210'), 'Phone number should be redacted');
  assert.ok(!sanitized.includes('1234 5678 9012'), 'Aadhaar number should be redacted');
  assert.ok(sanitized.includes('[REDACTED PHONE]'), 'Should place redacted phone marker');
  assert.ok(sanitized.includes('[REDACTED AADHAAR]'), 'Should place redacted Aadhaar marker');
  console.log('Passed: PII Sanitization & Redaction Engine Test');

  const rawComplaint = 'Severe chest pain and difficulty breathing for two hours.';
  const clinicalAnswers = { radiation: 'Yes', breathlessness: 'Some of these symptoms', impact: 'Severe' };
  const summary = await structureClinicalCase(rawComplaint, 'en', clinicalAnswers);
  assert.strictEqual(summary.patientReport, rawComplaint, 'The patient report must be preserved');
  assert.ok(summary.aiSummary, 'A neutral summary or the patient report fallback should be available');
  assert.ok(!summary.assessment && !summary.plan, 'Automated output must not diagnose or prescribe');
  console.log('Passed: Patient Report Preservation & Non-Diagnostic Summary Test');

  const triageResult = checkTriage('severe chest pain radiating to left arm', []);
  assert.strictEqual(triageResult.isRedFlag, true, 'Cardiac chest pain should trigger emergency red flag');
  assert.strictEqual(checkTriage('सीने में दर्द और सांस नहीं आ रही', []).isRedFlag, true, 'Hindi emergency symptoms should trigger a red flag');
  console.log('Passed: Emergency Red-Flag Triage Test');

  const testCase = await CaseSheetModel.create({
    caseId: 'TEST-CASE-8842',
    language: 'en',
    rawInput: 'Severe stomach burn for 3 weeks',
    summary,
    clinicalAnswers,
    isVerified: false
  });
  assert.strictEqual(testCase.isVerified, false, 'Initial status MUST be isVerified: false');
  console.log('Passed: Case Sheet Initial Status Test');

  const updatedCase = await CaseSheetModel.updateByCaseId('TEST-CASE-8842', {
    isVerified: true,
    doctorNotes: 'Approved by Dr. Sharma',
    verifiedBy: { doctorName: 'Dr. Rajesh Sharma', registrationNumber: 'MED-2026' }
  });
  assert.strictEqual(updatedCase.isVerified, true, 'Doctor sign-off MUST update status to isVerified: true');
  console.log('Passed: Doctor Verification Sign-off Test');
  console.log('ALL Viora TESTS PASSED SUCCESSFULLY!');
} catch (err) {
  console.error('Test failed:', err);
  process.exit(1);
}