import assert from 'assert';
import { UserModel } from '../backend/models/User.js';
import { PatientModel } from '../backend/models/Patient.js';
import { DoctorModel } from '../backend/models/Doctor.js';
import { mockMySQLStore } from '../backend/config/mysql.js';
import bcrypt from '../backend/node_modules/bcryptjs/index.js';
import jwt from '../backend/node_modules/jsonwebtoken/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'viora_sih2026_binary_brains_secret_key_8842';

console.log('🚀 Running Viora V0.2 Authentication & User Foundation Test Suite...');

const runTests = async () => {
  try {
    // 1. Database Collections / Relational Store Check
    console.log('1. Checking Database entities (users, patients, doctors)...');
    assert.ok(mockMySQLStore.users instanceof Map, 'users store must exist');
    assert.ok(mockMySQLStore.patients instanceof Map, 'patients store must exist');
    assert.ok(mockMySQLStore.doctors instanceof Map, 'doctors store must exist');
    assert.ok(mockMySQLStore.users.has('doctor@viora.org'), 'Default seeded doctor user must exist');
    assert.ok(mockMySQLStore.users.has('patient@viora.org'), 'Default seeded patient user must exist');
    assert.ok(mockMySQLStore.users.has('admin@viora.org'), 'Default seeded admin user must exist');
    console.log('   ✅ Passed: Database entities and initial seed');

    // 2. Patient Registration with Personal Details
    console.log('2. Testing Dynamic Patient Registration...');
    const testPatientEmail = `test.patient.${Date.now()}@viora.org`;
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('PatientSecure2026', salt);

    const newPatientUser = await UserModel.create({
      name: 'Aarav Gupta',
      email: testPatientEmail,
      passwordHash: passHash,
      role: 'patient'
    });

    assert.ok(newPatientUser.id, 'User record must have an ID');
    assert.strictEqual(newPatientUser.email, testPatientEmail);
    assert.strictEqual(newPatientUser.role, 'patient');

    const newPatientProfile = await PatientModel.create({
      userId: newPatientUser.id,
      fullName: 'Aarav Gupta',
      email: testPatientEmail,
      phone: '+91 99887 76655',
      age: 29,
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: '+91 99887 00000',
      abhaId: '91-1234-5678-9012',
      address: 'Indore, MP',
      allergies: ['Dust', 'Sulfa drugs']
    });

    assert.strictEqual(newPatientProfile.userId, newPatientUser.id);
    assert.strictEqual(newPatientProfile.bloodGroup, 'O+');
    assert.strictEqual(newPatientProfile.allergies.length, 2);
    console.log('   ✅ Passed: Dynamic Patient Registration & Patient Profile Creation');

    // 3. Doctor Registration with Professional Details
    console.log('3. Testing Dynamic Doctor Registration...');
    const testDoctorEmail = `test.doctor.${Date.now()}@viora.org`;
    const docPassHash = await bcrypt.hash('DocSecure2026', salt);

    const newDocUser = await UserModel.create({
      name: 'Dr. Priya Nair',
      email: testDoctorEmail,
      passwordHash: docPassHash,
      role: 'doctor'
    });

    const newDocProfile = await DoctorModel.create({
      userId: newDocUser.id,
      fullName: 'Dr. Priya Nair',
      email: testDoctorEmail,
      phone: '+91 94455 66778',
      specialization: 'Cardiology',
      registrationNumber: 'MCI-CARD-9941',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      hospitalAffiliation: 'National Heart Center',
      experienceYears: 15,
      bio: 'Interventional cardiologist specializing in adult heart disease.'
    });

    assert.strictEqual(newDocProfile.userId, newDocUser.id);
    assert.strictEqual(newDocProfile.specialization, 'Cardiology');
    assert.strictEqual(newDocProfile.registrationNumber, 'MCI-CARD-9941');
    console.log('   ✅ Passed: Dynamic Doctor Registration & Professional Details Creation');

    // 4. Password Security & Hashing Verification
    console.log('4. Testing Password Security & Bcrypt Validation...');
    const isPatientMatch = await bcrypt.compare('PatientSecure2026', newPatientUser.passwordHash);
    const isDocMatch = await bcrypt.compare('DocSecure2026', newDocUser.passwordHash);
    const isWrongMatch = await bcrypt.compare('WrongPassword', newPatientUser.passwordHash);
    assert.strictEqual(isPatientMatch, true, 'Valid password must match hash');
    assert.strictEqual(isDocMatch, true, 'Valid doc password must match hash');
    assert.strictEqual(isWrongMatch, false, 'Invalid password must be rejected');

    // Test password update
    const updatedPassHash = await bcrypt.hash('NewPassCode2026', salt);
    await UserModel.updatePassword(newPatientUser.id, updatedPassHash);
    const updatedUser = await UserModel.findById(newPatientUser.id);
    assert.ok(await bcrypt.compare('NewPassCode2026', updatedUser.passwordHash), 'Updated password hash must verify');
    console.log('   ✅ Passed: Password Security, Hashing, & Secure Password Update');

    // 5. Patient Profile View & Update
    console.log('5. Testing Patient Profile Retrieval & Edit...');
    const fetchedPatient = await PatientModel.findByUserId(newPatientUser.id);
    assert.strictEqual(fetchedPatient.fullName, 'Aarav Gupta');

    const updatedPatient = await PatientModel.updateByUserId(newPatientUser.id, {
      phone: '+91 99999 88888',
      bloodGroup: 'AB+',
      allergies: ['Dust', 'Sulfa drugs', 'Peanuts']
    });
    assert.strictEqual(updatedPatient.phone, '+91 99999 88888');
    assert.strictEqual(updatedPatient.bloodGroup, 'AB+');
    assert.strictEqual(updatedPatient.allergies.length, 3);
    console.log('   ✅ Passed: Patient Personal Information Update');

    // 6. Doctor Professional Details View & Update
    console.log('6. Testing Doctor Professional Details Retrieval & Edit...');
    const fetchedDoc = await DoctorModel.findByUserId(newDocUser.id);
    assert.strictEqual(fetchedDoc.registrationNumber, 'MCI-CARD-9941');

    const updatedDoc = await DoctorModel.updateByUserId(newDocUser.id, {
      hospitalAffiliation: 'Apollo Super Specialty Hospital',
      experienceYears: 16
    });
    assert.strictEqual(updatedDoc.hospitalAffiliation, 'Apollo Super Specialty Hospital');
    assert.strictEqual(updatedDoc.experienceYears, 16);
    console.log('   ✅ Passed: Doctor Professional Profile Update');

    // 7. Role-Based Token Generation & Access Control
    console.log('7. Testing Role-Based Token Generation & RBAC...');
    const patientToken = jwt.sign(
      { id: newPatientUser.id, email: newPatientUser.email, role: 'patient' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const docToken = jwt.sign(
      { id: newDocUser.id, email: newDocUser.email, role: 'doctor' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminToken = jwt.sign(
      { id: 'usr-admin-003', email: 'admin@viora.org', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const decodedPatient = jwt.verify(patientToken, JWT_SECRET);
    const decodedDoc = jwt.verify(docToken, JWT_SECRET);
    const decodedAdmin = jwt.verify(adminToken, JWT_SECRET);

    assert.strictEqual(decodedPatient.role, 'patient');
    assert.strictEqual(decodedDoc.role, 'doctor');
    assert.strictEqual(decodedAdmin.role, 'admin');

    // RBAC validation logic simulation
    const checkRole = (userRole, allowedRoles) => allowedRoles.includes(userRole);
    assert.strictEqual(checkRole(decodedPatient.role, ['patient', 'admin']), true, 'Patient allowed on patient routes');
    assert.strictEqual(checkRole(decodedPatient.role, ['doctor', 'admin']), false, 'Patient forbidden on doctor routes');
    assert.strictEqual(checkRole(decodedDoc.role, ['doctor', 'admin']), true, 'Doctor allowed on doctor routes');
    assert.strictEqual(checkRole(decodedDoc.role, ['admin']), false, 'Doctor forbidden on admin routes');
    assert.strictEqual(checkRole(decodedAdmin.role, ['admin']), true, 'Admin allowed on admin routes');
    console.log('   ✅ Passed: Role-Based Authentication & Access Control Verification');

    console.log('================================================================');
    console.log('🎉 ALL V0.2 AUTHENTICATION & USER FOUNDATION TESTS PASSED!');
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

runTests();
