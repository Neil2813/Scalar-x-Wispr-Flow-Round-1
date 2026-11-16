import assert from 'assert';
import http from 'http';
import express from '../backend/node_modules/express/index.js';
import cors from '../backend/node_modules/cors/lib/index.js';
import authRoutes from '../backend/routes/authRoutes.js';
import orgRoutes from '../backend/routes/orgRoutes.js';
import patientRoutes from '../backend/routes/patientRoutes.js';
import doctorRoutes from '../backend/routes/doctorRoutes.js';
import adminRoutes from '../backend/routes/adminRoutes.js';
import { mockMySQLStore } from '../backend/config/mysql.js';

console.log('🏥 Starting VIORA V0.2 Hospital & Organization Foundation Test Suite...');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);

const server = http.createServer(app);

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
  console.log(`📡 Test server active on port ${port}`);

  try {
    // 1. Check seeded organizations and accounts
    console.log('Test 1: Verification of Seeded Organizations and Dual Roles');
    assert.ok(mockMySQLStore.organizations instanceof Map, 'organizations map must exist');
    assert.ok(mockMySQLStore.organizations.has('org-001'), 'Apex City Hospital must be seeded');
    assert.strictEqual(mockMySQLStore.organizations.get('org-001').status, 'APPROVED');
    assert.ok(mockMySQLStore.organizations.has('org-002'), 'CityCare Hospital must be seeded');
    assert.strictEqual(mockMySQLStore.organizations.get('org-002').status, 'PENDING');
    console.log('   ✅ Passed: Seeded organizations verified (Apex = APPROVED, CityCare = PENDING)');

    // 2. Hospital / Clinic Registration Form Submission
    console.log('Test 2: Dynamic Hospital / Clinic Registration');
    const testAdminEmail = `admin.jodhpur.${Date.now()}@viora.org`;
    const regHospitalRes = await request(port, 'POST', '/api/organizations/register', {
      name: 'Marwar Multi-Specialty Clinic',
      type: 'Clinic',
      address: 'Near Clock Tower, Nai Sarak',
      city: 'Jodhpur',
      state: 'Rajasthan',
      pincode: '342001',
      officialPhone: '+91 291 2510000',
      officialEmail: 'info@marwarclinic.org',
      adminName: 'Dr. Om Prakash Rao',
      adminEmail: testAdminEmail,
      adminPhone: '+91 94140 12345',
      password: 'AdminSecure2026',
      confirmPassword: 'AdminSecure2026'
    });

    assert.strictEqual(regHospitalRes.status, 201);
    assert.strictEqual(regHospitalRes.body.status, 'PENDING');
    assert.strictEqual(regHospitalRes.body.organization.name, 'Marwar Multi-Specialty Clinic');
    const newOrgId = regHospitalRes.body.organization.id;
    console.log('   ✅ Passed: Hospital/Clinic registration successfully created in PENDING status');

    // 3. Hospital Admin Login while PENDING must be rejected
    console.log('Test 3: Hospital Admin Login Restriction While Pending');
    const pendingLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: testAdminEmail,
      password: 'AdminSecure2026'
    });
    assert.strictEqual(pendingLoginRes.status, 403);
    assert.strictEqual(pendingLoginRes.body.status, 'PENDING');
    assert.ok(pendingLoginRes.body.error.includes('PENDING'));
    console.log('   ✅ Passed: Unapproved Hospital Admin login correctly blocked (403 Forbidden)');

    // 4. Public Doctor Self-Registration Disabled Check
    console.log('Test 4: Disabling Public Doctor Self-Registration');
    const docSelfRegRes = await request(port, 'POST', '/api/auth/register', {
      name: 'Dr. Self Register',
      email: `rogue.doc.${Date.now()}@viora.org`,
      password: 'DocPassword123',
      role: 'doctor'
    });
    assert.strictEqual(docSelfRegRes.status, 400);
    assert.ok(docSelfRegRes.body.error.includes('Doctor self-registration is disabled'));
    console.log('   ✅ Passed: Public doctor signup is strictly rejected (400 Bad Request)');

    // 5. Platform Admin Login & Verification Queue Inspection
    console.log('Test 5: Platform Admin Login & Organization Verification Queue');
    const adminLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: 'admin@viora.org',
      password: 'admin123'
    });
    assert.strictEqual(adminLoginRes.status, 200);
    assert.strictEqual(adminLoginRes.body.user.role, 'PLATFORM_ADMIN');
    const platformAdminToken = adminLoginRes.body.token;

    const listOrgsRes = await request(port, 'GET', '/api/admin/organizations', null, platformAdminToken);
    assert.strictEqual(listOrgsRes.status, 200);
    assert.ok(listOrgsRes.body.total >= 3);
    const targetOrg = listOrgsRes.body.organizations.find(o => o.id === newOrgId);
    assert.ok(targetOrg, 'New organization must be present in Platform Admin list');
    assert.strictEqual(targetOrg.status, 'PENDING');
    console.log('   ✅ Passed: Platform Admin successfully inspected the pending verification queue');

    // 6. Platform Admin Organization Inspection & Status Update (Approve)
    console.log('Test 6: Platform Admin Organization Approval');
    const viewOrgRes = await request(port, 'GET', `/api/admin/organizations/${newOrgId}`, null, platformAdminToken);
    assert.strictEqual(viewOrgRes.status, 200);
    assert.strictEqual(viewOrgRes.body.organization.city, 'Jodhpur');

    const approveRes = await request(port, 'PUT', `/api/admin/organizations/${newOrgId}/status`, {
      status: 'APPROVED'
    }, platformAdminToken);
    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.body.organization.status, 'APPROVED');
    console.log('   ✅ Passed: Organization successfully transitioned from PENDING to APPROVED');

    // 7. Approved Hospital Admin Login
    console.log('Test 7: Approved Hospital Admin Login & Token Acquisition');
    const approvedLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: testAdminEmail,
      password: 'AdminSecure2026'
    });
    assert.strictEqual(approvedLoginRes.status, 200);
    assert.strictEqual(approvedLoginRes.body.user.role, 'HOSPITAL_ADMIN');
    assert.strictEqual(approvedLoginRes.body.user.organization.status, 'APPROVED');
    const hospitalAdminToken = approvedLoginRes.body.token;
    console.log('   ✅ Passed: Approved Hospital Admin successfully logged in with HOSPITAL_ADMIN role');

    // 8. Hospital Admin Dashboard Data Access
    console.log('Test 8: Hospital Admin Dashboard Access (Profile, Departments, Doctors)');
    const myOrgRes = await request(port, 'GET', '/api/organizations/my-org', null, hospitalAdminToken);
    assert.strictEqual(myOrgRes.status, 200);
    assert.strictEqual(myOrgRes.body.organization.name, 'Marwar Multi-Specialty Clinic');
    assert.ok(Array.isArray(myOrgRes.body.departments));
    console.log('   ✅ Passed: Hospital Admin fetched profile, roster, and department data');

    // 9. Hospital Admin Adds a Doctor to Organization Roster
    console.log('Test 9: Hospital Admin Adds Doctor to Hospital Roster [Add Doctor Action]');
    const newDocEmail = `dr.geeta.${Date.now()}@marwarclinic.org`;
    const addDoctorRes = await request(port, 'POST', '/api/organizations/my-org/doctors', {
      name: 'Geeta Choudhary',
      email: newDocEmail,
      phone: '+91 94140 99887',
      specialization: 'Pediatrics',
      registrationNumber: 'RAJ-MED-2026-1122',
      qualifications: 'MBBS, MD (Pediatrics)',
      password: 'DoctorPass2026'
    }, hospitalAdminToken);

    assert.strictEqual(addDoctorRes.status, 201);
    assert.strictEqual(addDoctorRes.body.doctor.specialization, 'Pediatrics');
    assert.strictEqual(addDoctorRes.body.doctor.hospitalAffiliation, 'Marwar Multi-Specialty Clinic');
    console.log('   ✅ Passed: Hospital Admin successfully provisioned doctor account on hospital roster');

    // 10. Provisioned Doctor Login
    console.log('Test 10: Doctor Login with Provisioned Credentials');
    const doctorLoginRes = await request(port, 'POST', '/api/auth/login', {
      email: newDocEmail,
      password: 'DoctorPass2026'
    });
    assert.strictEqual(doctorLoginRes.status, 200);
    assert.strictEqual(doctorLoginRes.body.user.role, 'DOCTOR');
    console.log('   ✅ Passed: Provisioned doctor successfully authenticated into Doctor Portal');

    // 11. Patient Registration & Login Intact
    console.log('Test 11: Preservation of Patient Registration & Login Flow');
    const patEmail = `patient.flow.${Date.now()}@viora.org`;
    const regPatRes = await request(port, 'POST', '/api/auth/register', {
      name: 'Sunita Devi',
      email: patEmail,
      password: 'PatientPass2026',
      role: 'patient',
      age: 34,
      gender: 'Female',
      bloodGroup: 'B+'
    });
    assert.strictEqual(regPatRes.status, 201);
    assert.strictEqual(regPatRes.body.user.role, 'PATIENT');
    console.log('   ✅ Passed: Patient registration and access remained completely intact');

    console.log('================================================================');
    console.log('🎉 ALL V0.2 HOSPITAL & ORGANIZATION FOUNDATION TESTS PASSED (100%)!');
    console.log('================================================================');

    server.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    server.close();
    process.exit(1);
  }
});
