/**
 * VIORA V0.2 - 4-Dashboard Architecture Test Suite
 * Tests Platform Admin, Hospital Admin, Doctor, and Patient workflows + RBAC enforcement.
 */

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🏥 RUNNING VIORA 4-DASHBOARD ARCHITECTURE & RBAC TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ Passed [${total}]: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAILED [${total}]: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Authenticate All 4 Roles
  console.log('--- 1. Authenticating All 4 Account Types ---');
  
  // Platform Admin
  const adminAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@viora.org', password: 'admin123' })
  });
  assert(adminAuth.ok && (adminAuth.data.user.role === 'PLATFORM_ADMIN' || adminAuth.data.user.role === 'admin'), 'Platform Admin login succeeded');
  const adminToken = adminAuth.data.token;

  // Hospital Admin
  const hospAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'hospitaladmin@viora.org', password: 'admin123' })
  });
  assert(hospAuth.ok && hospAuth.data.user.role === 'HOSPITAL_ADMIN', 'Hospital Admin login succeeded');
  const hospToken = hospAuth.data.token;

  // Doctor
  const docAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'doctor@viora.org', password: 'doctor123' })
  });
  assert(docAuth.ok && (docAuth.data.user.role === 'DOCTOR' || docAuth.data.user.role === 'doctor'), 'Doctor login succeeded (Dr. Rahul Sharma)');
  const docToken = docAuth.data.token;

  // Patient
  const patAuth = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patient@viora.org', password: 'patient123' })
  });
  assert(patAuth.ok && (patAuth.data.user.role === 'PATIENT' || patAuth.data.user.role === 'patient'), 'Patient login succeeded');
  const patToken = patAuth.data.token;

  // 2. Platform Admin Dashboard Functionality
  console.log('\n--- 2. Testing 🛡️ Platform Admin Dashboard ---');
  const platformStats = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(platformStats.ok && platformStats.data.stats.totalOrganizations >= 42, 'Platform statistics: total organizations >= 42');
  assert(platformStats.data.stats.activeDoctors >= 186, 'Platform statistics: active doctors >= 186');
  assert(platformStats.data.stats.totalPatients >= 8420, 'Platform statistics: total patients >= 8420');

  const orgs = await request('/admin/organizations', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(orgs.ok && Array.isArray(orgs.data.organizations) && orgs.data.organizations.length > 0, 'Platform admin lists all organizations');

  const specReg = await request('/admin/specializations', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(specReg.ok && specReg.data.specializations.length >= 8, 'Specializations registry lists Cardiology, Dermatology, etc.');

  const platformReports = await request('/admin/reports', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(platformReports.ok && platformReports.data.triageAccuracy === '99.4%', 'Platform detailed reports load');

  // 3. Hospital Admin Dashboard Functionality
  console.log('\n--- 3. Testing 🏥 Hospital Admin Dashboard ---');
  const myOrg = await request('/organizations/my-org', {
    headers: { Authorization: `Bearer ${hospToken}` }
  });
  assert(myOrg.ok && myOrg.data.organization.name === 'CityCare Hospital', 'Hospital admin retrieves CityCare Hospital organization');

  // Add doctor through 7-step wizard payload
  const testDoctorEmail = `dr.anita.${Date.now()}@citycare.org`;
  const addDoc = await request('/organizations/my-org/doctors', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hospToken}` },
    body: JSON.stringify({
      name: 'Anita Desai',
      email: testDoctorEmail,
      phone: '+91 98765 11223',
      specialization: 'Cardiology',
      department: 'Cardiology',
      registrationNumber: 'MCI-99882-DL',
      qualifications: 'MBBS, MD',
      training: 'Fellowship in Non-Invasive Cardiology',
      schedule: { Monday: '10 AM – 2 PM', Tuesday: '10 AM – 2 PM' }
    })
  });
  assert(addDoc.ok && addDoc.data.doctor.email === testDoctorEmail, 'Hospital admin creates and provisions doctor account');

  // Add Department
  const addDept = await request('/organizations/my-org/departments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hospToken}` },
    body: JSON.stringify({ departmentName: 'Cardiology' })
  });
  assert(addDept.ok && Array.isArray(addDept.data.departments), 'Hospital admin manages departments');

  // View Hospital Patients (Audited)
  const hospPatients = await request('/organizations/my-org/patients', {
    headers: { Authorization: `Bearer ${hospToken}` }
  });
  assert(hospPatients.ok && Array.isArray(hospPatients.data.patients), 'Hospital admin views organization patients with audited access');

  // 4. Doctor Dashboard Functionality
  console.log('\n--- 4. Testing 👨‍⚕️ Doctor Dashboard (Dr. Rahul Sharma) ---');
  const docProfile = await request('/doctors/profile', {
    headers: { Authorization: `Bearer ${docToken}` }
  });
  assert(docProfile.ok && docProfile.data.profile.fullName.includes('Rahul'), 'Doctor retrieves verified profile');

  // Today's schedule timeline (10:00 Patient A, 10:30 Patient B, 11:00 Patient C)
  const todaySched = await request('/doctors/today-schedule', {
    headers: { Authorization: `Bearer ${docToken}` }
  });
  assert(todaySched.ok && Array.isArray(todaySched.data.schedule) && todaySched.data.schedule.length >= 3, "Doctor views Today's Schedule timeline");
  assert(todaySched.data.schedule[0].patientName.includes('Patient A'), 'Timeline includes Patient A at 10:00');

  // Doctor Queue
  const docQueue = await request('/doctors/queue', {
    headers: { Authorization: `Bearer ${docToken}` }
  });
  assert(docQueue.ok && docQueue.data.metrics.patientQueue >= 8, 'Doctor views queue with summary numbers (queue >= 8)');

  // Doctor Reviews and Signs Off on AI SOAP Case
  const soapReview = await request('/doctors/cases/CASE-001/review', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      action: 'SIGN_OFF',
      doctorNotes: 'Reviewed 12-lead ECG and symptoms. Scheduled for outpatient echo.',
      plan: 'Aspirin 75mg PO daily, Atorvastatin 20mg nocte'
    })
  });
  assert(soapReview.ok && soapReview.data.caseSheet.isVerified === true, 'Doctor reviews and signs off AI SOAP case (AI does not finalize)');

  // Doctor requests profile change
  const changeReq = await request('/doctors/profile/request-change', {
    method: 'POST',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      qualifications: 'MBBS, MD (Medicine), DM (Cardiology), FACC',
      reason: 'Conferred FACC fellowship'
    })
  });
  assert(changeReq.ok && changeReq.data.request.status === 'PENDING_HOSPITAL_ADMIN', 'Doctor requests profile change routed to Hospital Admin');

  // Hospital Admin reviews doctor change request
  const pendingRequests = await request('/organizations/my-org/doctor-requests', {
    headers: { Authorization: `Bearer ${hospToken}` }
  });
  assert(pendingRequests.ok, 'Hospital admin views pending doctor change requests');

  // 5. Patient Dashboard Functionality
  console.log('\n--- 5. Testing 👤 Patient Dashboard ---');
  // Specialty Navigation Suggestion (Non-diagnostic!)
  const navigation = await request('/patients/suggest-specialty', {
    method: 'POST',
    body: JSON.stringify({ concern: 'I have been having chest pain and palpitations for 3 days', language: 'en' })
  });
  assert(navigation.ok && navigation.data.department === 'Cardiology', 'Navigation identifies Cardiology specialty');
  assert(navigation.data.guidanceText.includes('appropriate for evaluation by a cardiology specialist'), 'VIORA outputs non-diagnostic guidance text');
  assert(Array.isArray(navigation.data.doctors) && navigation.data.doctors.length > 0, 'Navigation lists available doctors for booking');

  // Patient Books Appointment
  const newBooking = await request('/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${patToken}` },
    body: JSON.stringify({
      doctorId: docAuth.data.user.id,
      date: '2026-09-16',
      timeSlot: '11:30 AM',
      chiefComplaint: 'Mild chest discomfort during morning walks',
      department: 'Cardiology'
    })
  });
  assert(newBooking.ok && newBooking.data.appointment.doctorName.includes('Rahul'), 'Patient books appointment with Dr. Rahul Sharma');

  // Patient views reports
  const patReports = await request('/patients/reports', {
    headers: { Authorization: `Bearer ${patToken}` }
  });
  assert(patReports.ok && Array.isArray(patReports.data.reports), 'Patient views clinical reports');

  // 6. Strict RBAC Enforcement
  console.log('\n--- 6. Testing RBAC Security & Boundary Enforcement ---');
  // Patient cannot access hospital admin routes
  const unauthorizedHosp = await request('/organizations/my-org', {
    headers: { Authorization: `Bearer ${patToken}` }
  });
  assert(unauthorizedHosp.status === 403, 'Patient forbidden (403) from accessing Hospital Admin endpoints');

  // Patient cannot access platform admin routes
  const unauthorizedAdmin = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${patToken}` }
  });
  assert(unauthorizedAdmin.status === 403, 'Patient forbidden (403) from accessing Platform Admin endpoints');

  // Doctor cannot access platform admin routes
  const docUnauthorizedAdmin = await request('/admin/stats', {
    headers: { Authorization: `Bearer ${docToken}` }
  });
  assert(docUnauthorizedAdmin.status === 403, 'Doctor forbidden (403) from accessing Platform Admin endpoints');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} 4-DASHBOARD ARCHITECTURE & RBAC TESTS PASSED!`);
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Aborted:', err.message);
  process.exit(1);
});
