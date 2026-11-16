import assert from 'assert';
import http from 'http';
import express from '../backend/node_modules/express/index.js';
import cors from '../backend/node_modules/cors/lib/index.js';
import authRoutes from '../backend/routes/authRoutes.js';
import patientRoutes from '../backend/routes/patientRoutes.js';
import doctorRoutes from '../backend/routes/doctorRoutes.js';
import adminRoutes from '../backend/routes/adminRoutes.js';
import caseRoutes from '../backend/routes/caseRoutes.js';

console.log('🩺 Starting End-to-End API Integration Test Suite...');

// Setup isolated express test server
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/case', caseRoutes);

const server = http.createServer(app);

// Helper for HTTP requests
const request = (port, method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch (e) {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', (e) => reject(e));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port;
  console.log(`📡 Test server listening on ephemeral port ${port}`);

  try {
    // 1. Patient Registration
    console.log('Test 1: Dynamic Patient Registration with personal details');
    const patEmail = `test.pat.${Date.now()}@viora.org`;
    const regPatientRes = await request(port, 'POST', '/api/auth/register', {
      name: 'Sneha Sharma',
      email: patEmail,
      password: 'SnehaPass2026',
      role: 'patient',
      phone: '+91 91122 33445',
      age: 28,
      gender: 'Female',
      bloodGroup: 'O+',
      abhaId: '91-4433-2211-0099',
      allergies: ['Dust']
    });

    assert.strictEqual(regPatientRes.status, 201, `Patient registration status should be 201, got ${regPatientRes.status}`);
    assert.ok(regPatientRes.body.token, 'Registration should return token');
    assert.strictEqual(regPatientRes.body.user.role.toUpperCase(), 'PATIENT');
    assert.strictEqual(regPatientRes.body.profile.bloodGroup, 'O+');
    console.log('   ✅ Passed: Patient registered dynamically');

    const patientToken = regPatientRes.body.token;

    // 2. Patient Login
    console.log('Test 2: Patient Login');
    const loginPatientRes = await request(port, 'POST', '/api/auth/login', {
      email: patEmail,
      password: 'SnehaPass2026'
    });
    assert.strictEqual(loginPatientRes.status, 200);
    assert.ok(loginPatientRes.body.token);
    assert.strictEqual(loginPatientRes.body.profile.fullName, 'Sneha Sharma');
    console.log('   ✅ Passed: Patient authenticated and profile retrieved');

    // 3. Patient Profile View & Update
    console.log('Test 3: Patient Profile Update');
    const updatePatRes = await request(port, 'PUT', '/api/patients/profile', {
      phone: '+91 99999 11111',
      bloodGroup: 'A+',
      emergencyContact: '+91 98888 22222 (Brother)'
    }, patientToken);

    assert.strictEqual(updatePatRes.status, 200);
    assert.strictEqual(updatePatRes.body.profile.phone, '+91 99999 11111');
    assert.strictEqual(updatePatRes.body.profile.bloodGroup, 'A+');
    console.log('   ✅ Passed: Patient personal profile updated');

    // 4. Password Security: Change Password
    console.log('Test 4: Password Security & Change Password');
    const changePassRes = await request(port, 'PUT', '/api/auth/change-password', {
      currentPassword: 'SnehaPass2026',
      newPassword: 'SnehaNewPass2026'
    }, patientToken);
    assert.strictEqual(changePassRes.status, 200);

    // Old password should fail
    const failOldLogin = await request(port, 'POST', '/api/auth/login', {
      email: patEmail,
      password: 'SnehaPass2026'
    });
    assert.strictEqual(failOldLogin.status, 401);

    // New password should succeed
    const successNewLogin = await request(port, 'POST', '/api/auth/login', {
      email: patEmail,
      password: 'SnehaNewPass2026'
    });
    assert.strictEqual(successNewLogin.status, 200);
    console.log('   ✅ Passed: Password changed and old password invalidated');

    // 5. Doctor Registration with Professional Details
    console.log('Test 5: Doctor Registration with Professional Details');
    const docEmail = `test.doc.${Date.now()}@viora.org`;
    const regDocRes = await request(port, 'POST', '/api/auth/register', {
      name: 'Dr. Arjun Verma',
      email: docEmail,
      password: 'DoctorPass2026',
      role: 'doctor',
      phone: '+91 97777 66666',
      specialization: 'Neurology',
      registrationNumber: 'MED-NEURO-8877',
      qualifications: 'MBBS, MD, DM',
      hospitalAffiliation: 'Fortis Healthcare',
      experienceYears: 10
    });

    assert.strictEqual(regDocRes.status, 201);
    assert.strictEqual(regDocRes.body.user.role, 'doctor');
    assert.strictEqual(regDocRes.body.profile.specialization, 'Neurology');
    assert.strictEqual(regDocRes.body.profile.registrationNumber, 'MED-NEURO-8877');
    console.log('   ✅ Passed: Doctor registered dynamically with professional credentials');

    const docToken = regDocRes.body.token;

    // 6. Doctor Profile View & Update
    console.log('Test 6: Doctor Profile Update');
    const updateDocRes = await request(port, 'PUT', '/api/doctors/profile', {
      hospitalAffiliation: 'AIIMS New Delhi',
      experienceYears: 11
    }, docToken);
    assert.strictEqual(updateDocRes.status, 200);
    assert.strictEqual(updateDocRes.body.profile.hospitalAffiliation, 'AIIMS New Delhi');
    console.log('   ✅ Passed: Doctor professional details updated');

    // 7. Protected Routes & RBAC Enforcement
    console.log('Test 7: Protected Routes & RBAC Role-Based Access Control');
    // A) No token on protected route -> 401
    const noTokenRes = await request(port, 'GET', '/api/patients/profile');
    assert.strictEqual(noTokenRes.status, 401, 'Request without token must be rejected with 401');

    // B) Patient attempting Doctor Sign-off -> 403 Forbidden
    const patientSignOffRes = await request(port, 'PUT', '/api/case/FAKE-CASE-001/verify', {
      doctorNotes: 'Illegally approved by patient'
    }, patientToken);
    assert.strictEqual(patientSignOffRes.status, 403, 'Patient must not be allowed to verify clinical cases (403)');

    // C) Patient attempting Admin users access -> 403 Forbidden
    const patientAdminRes = await request(port, 'GET', '/api/admin/users', null, patientToken);
    assert.strictEqual(patientAdminRes.status, 403, 'Patient must not be allowed to access admin routes (403)');
    console.log('   ✅ Passed: RBAC guards properly reject unauthorized roles with 401 & 403');

    // 8. Admin Authentication & Management
    console.log('Test 8: Admin Authentication & Console Metrics');
    const adminLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: 'admin@viora.org',
      password: 'admin123'
    });
    assert.strictEqual(adminLoginRes.status, 200);
    assert.strictEqual(adminLoginRes.body.user.role, 'admin');

    const adminToken = adminLoginRes.body.token;
    const adminUsersRes = await request(port, 'GET', '/api/admin/users', null, adminToken);
    assert.strictEqual(adminUsersRes.status, 200);
    assert.ok(adminUsersRes.body.totalUsers >= 3);

    const adminStatsRes = await request(port, 'GET', '/api/admin/stats', null, adminToken);
    assert.strictEqual(adminStatsRes.status, 200);
    assert.ok(adminStatsRes.body.stats.totalUsers >= 3);
    console.log('   ✅ Passed: Admin authentication and metrics retrieved');

    // 9. Existing Patient Intake Preservation
    console.log('Test 9: Patient Intake Preservation (Walk-in vs Authenticated)');
    // A) Walk-in Guest Intake
    const guestIntakeRes = await request(port, 'POST', '/api/case/structure', {
      chiefComplaint: 'Mild headache and sore throat for 2 days',
      language: 'en'
    });
    assert.strictEqual(guestIntakeRes.status, 201, 'Guest walk-in intake must succeed');
    assert.ok(guestIntakeRes.body.caseId);
    assert.strictEqual(guestIntakeRes.body.caseData.isVerified, false);

    // B) Authenticated Patient Intake
    const authIntakeRes = await request(port, 'POST', '/api/case/structure', {
      chiefComplaint: 'Knee pain while walking for 1 week',
      language: 'en',
      patientName: 'Sneha Sharma',
      abhaId: '91-4433-2211-0099'
    }, patientToken);
    assert.strictEqual(authIntakeRes.status, 201, 'Authenticated patient intake must succeed');
    assert.ok(authIntakeRes.body.caseId);
    assert.strictEqual(authIntakeRes.body.caseData.patientName, 'Sneha Sharma');

    // C) Doctor verification of case
    const docVerifyRes = await request(port, 'PUT', `/api/case/${authIntakeRes.body.caseId}/verify`, {
      doctorNotes: 'Prescribed paracetamol and warm compress. Rest recommended.'
    }, docToken);
    assert.strictEqual(docVerifyRes.status, 200, 'Doctor must be able to sign off case');
    assert.strictEqual(docVerifyRes.body.caseSheet.isVerified, true);
    console.log('   ✅ Passed: Patient intake workflow preserved for both walk-in and authenticated patients');

    console.log('================================================================');
    console.log('🎉 ALL END-TO-END HTTP API INTEGRATION TESTS PASSED (100%)!');
    console.log('================================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ E2E Test Failure:', err);
    server.close();
    process.exit(1);
  }
});
