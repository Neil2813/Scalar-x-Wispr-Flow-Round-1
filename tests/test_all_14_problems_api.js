import http from 'http';

const testCases = [
  {
    category: 'Cardiology',
    expectedDoctor: 'Dr. Rahul Sharma',
    query: 'severe chest pain radiating to left arm with rapid heart palpitations'
  },
  {
    category: 'Pulmonology',
    expectedDoctor: 'Dr. Priya Nair',
    query: 'severe asthma attack wheezing shortness of breath and chronic cough'
  },
  {
    category: 'Gastroenterology',
    expectedDoctor: 'Dr. Rajesh Verma',
    query: 'severe stomach abdominal pain acidity acid reflux and vomiting'
  },
  {
    category: 'Orthopedics',
    expectedDoctor: 'Dr. Amit Patel',
    query: 'severe knee joint pain and swelling unable to walk osteoarthritis'
  },
  {
    category: 'Neurology',
    expectedDoctor: 'Dr. Sunita Rao',
    query: 'one sided severe migraine headache with nausea dizziness and vertigo'
  },
  {
    category: 'Dermatology',
    expectedDoctor: 'Dr. Ananya Sen',
    query: 'red itchy skin rash with fungal infection ringworm on arms'
  },
  {
    category: 'ENT',
    expectedDoctor: 'Dr. Vikram Malhotra',
    query: 'ear infection with intense earache sinus pain and sore throat'
  },
  {
    category: 'Pediatrics',
    expectedDoctor: 'Dr. Meera Joshi',
    query: 'bachhe ko bohot tez bukhar hai chhota baccha ro raha hai aur ulti ho rahi hai'
  },
  {
    category: 'Gynecology',
    expectedDoctor: 'Dr. Kavita Desai',
    query: 'irregular menstrual cycle severe periods pain and PCOS symptoms'
  },
  {
    category: 'General Medicine',
    expectedDoctor: 'Dr. Sanjay Gupta',
    query: 'high grade viral fever chills body ache fatigue and weakness'
  },
  {
    category: 'Ophthalmology',
    expectedDoctor: 'Dr. Rohan Mehta',
    query: 'eye pain red eyes blurry vision and discharge'
  },
  {
    category: 'Psychiatry',
    expectedDoctor: 'Dr. Shalini Kapoor',
    query: 'severe anxiety panic attacks depression and chronic insomnia'
  },
  {
    category: 'Endocrinology',
    expectedDoctor: 'Dr. Arun Saxena',
    query: 'high blood sugar levels hbA1c 10 diabetes and thyroid imbalance'
  },
  {
    category: 'Nephrology & Urology',
    expectedDoctor: 'Dr. Deepak Mishra',
    query: 'kidney stone sharp back flank pain and burning in urine'
  }
];

function testApi(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ concern: query, language: 'en' });
    const req = http.request('http://localhost:5000/api/patients/suggest-specialty', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ error: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getDoctorsList() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:5000/api/doctors/list', res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch(e) { resolve({ error: body }); }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING 14 CLINICAL PROBLEMS & AI DOCTOR SUGGESTIONS ON HTTP');
  console.log('================================================================\n');

  let passed = 0;
  for (const tc of testCases) {
    const res = await testApi(tc.query);
    const deptMatch = res.department && res.department.toLowerCase().includes(tc.category.toLowerCase().split(' ')[0]);
    const docMatch = res.recommendedDoctor && res.recommendedDoctor.fullName === tc.expectedDoctor;
    const questionsCount = res.suggestedQuestions ? res.suggestedQuestions.length : 0;
    const hasSufficientQuestions = questionsCount >= 8 && questionsCount <= 10;

    if (deptMatch && docMatch && hasSufficientQuestions) {
      console.log(`✅ [PASS] ${tc.category}:`);
      console.log(`   Query: "${tc.query.substring(0, 50)}..."`);
      console.log(`   AI Suspected Condition: ${res.suspectedCondition}`);
      console.log(`   Questions Generated: ${questionsCount} clinical questions (Target: 8-10)`);
      console.log(`   Specialist: ${res.recommendedDoctor.fullName} (${res.recommendedDoctor.specialization})\n`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${tc.category}:`);
      console.error(`   Expected Dept: ${tc.category} | Got: ${res.department}`);
      console.error(`   Expected Doctor: ${tc.expectedDoctor} | Got: ${res.recommendedDoctor?.fullName}`);
      console.error(`   Questions Count: ${questionsCount} (Expected 8-10)\n`);
    }
  }

  // Explicit user prompts test
  console.log('\n--- Testing Exact User Prompts for 8-10 Consultation Questions ---');
  const userPrompts = [
    { query: 'kidney stone burning pain', expectedDept: 'Nephrology & Urology' },
    { query: 'severe asthma and wheezing', expectedDept: 'Pulmonology' },
    { query: 'bachhe ko bukhar', expectedDept: 'Pediatrics' }
  ];

  let userPromptsPassed = 0;
  for (const up of userPrompts) {
    const res = await testApi(up.query);
    const qCount = res.suggestedQuestions?.length || 0;
    console.log(`Query: "${up.query}" -> Dept: ${res.department} | Condition: ${res.suspectedCondition}`);
    console.log(`Questions (${qCount}):`);
    res.suggestedQuestions?.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
    if (qCount >= 8 && res.department.toLowerCase().includes(up.expectedDept.toLowerCase().split(' ')[0])) {
      console.log(`✅ [PASS] Exact Prompt: "${up.query}" returned ${qCount} questions and correct specialist: ${res.recommendedDoctor?.fullName}\n`);
      userPromptsPassed++;
    } else {
      console.error(`❌ [FAIL] Exact Prompt: "${up.query}" had ${qCount} questions (need 8-10)\n`);
    }
  }

  console.log('\n--- Checking CityCare Hospital Roster via /api/doctors/list ---');
  const docsRes = await getDoctorsList();
  const doctors = docsRes.doctors || [];
  console.log(`Total verified doctors available in hospital roster: ${doctors.length}`);
  const all14Found = testCases.every(tc => doctors.some(d => d.fullName === tc.expectedDoctor));
  if (all14Found) {
    console.log('✅ All 14 specialized demo doctors exist in the CityCare Hospital directory!');
  } else {
    console.error('❌ Missing some specialized demo doctors in the directory.');
  }

  console.log('\n================================================================');
  console.log(`RESULTS: ${passed}/${testCases.length} Clinical Problems Passed (${Math.round(passed/testCases.length * 100)}%)`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Error running test suite:', err);
});
