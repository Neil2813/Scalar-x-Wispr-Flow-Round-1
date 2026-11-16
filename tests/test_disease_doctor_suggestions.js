// Test script to verify demo doctors for every problem in demo hospital (CityCare Hospital)
// and AI doctor suggestion according to disease

const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 VIORA: Testing Demo Doctors & AI Disease Suggestion');
  console.log('=======================================================');

  let passed = 0;
  let failed = 0;

  // 1. Check doctors list
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/doctors/list',
      method: 'GET'
    });

    const doctors = res.body.doctors || [];
    console.log(`\n📋 Doctors Found in System: ${doctors.length}`);
    doctors.forEach(d => {
      console.log(`  • ${d.fullName.padEnd(22)} | ${d.department.padEnd(22)} | Fee: ₹${d.consultationFee} | ${d.hospitalAffiliation}`);
    });

    if (doctors.length >= 14) {
      console.log(`✅ TEST 1 PASSED: Found all ${doctors.length} demo doctors for every clinical department.`);
      passed++;
    } else {
      console.error(`❌ TEST 1 FAILED: Expected at least 14 doctors, found ${doctors.length}`);
      failed++;
    }
  } catch (err) {
    console.error('❌ TEST 1 ERROR:', err.message);
    failed++;
  }

  // 2. Test AI Disease-to-Doctor Suggestions for each problem area
  const testCases = [
    {
      problem: 'Heart & Chest Pain',
      concern: 'I have severe chest pain with exertional pressure and palpitations for 2 days',
      expectedDept: 'Cardiology',
      expectedDoc: 'Dr. Rahul Sharma'
    },
    {
      problem: 'Asthma & Cough (Respiratory)',
      concern: 'Mujhe 10 din se bahut tez khansi ho rahi hai aur saans phoolti hai, asthma jaisa lag raha hai',
      expectedDept: 'Pulmonology',
      expectedDoc: 'Dr. Priya Nair'
    },
    {
      problem: 'Stomach Pain & Acidity (Gastro)',
      concern: 'Pet me bahut tez dard aur acidity ho rahi hai khana khane ke baad ulti hoti hai',
      expectedDept: 'Gastroenterology',
      expectedDoc: 'Dr. Rajesh Verma'
    },
    {
      problem: 'Joint & Knee Pain (Orthopedics)',
      concern: 'Both knees are severely swollen with arthritis and intense back pain making walking difficult',
      expectedDept: 'Orthopedics',
      expectedDoc: 'Dr. Amit Patel'
    },
    {
      problem: 'Migraine & Dizziness (Neurology)',
      concern: 'Sir me aadhe hisse me tez dard hota hai aur subah uthne par chakkar aate hain',
      expectedDept: 'Neurology',
      expectedDoc: 'Dr. Sunita Rao'
    },
    {
      problem: 'Skin Rash & Itching (Dermatology)',
      concern: 'Tvacha par laal daane aur bahut tez khujli ho rahi hai fungal infection lag raha hai',
      expectedDept: 'Dermatology',
      expectedDoc: 'Dr. Ananya Sen'
    },
    {
      problem: 'Ear & Throat Infection (ENT)',
      concern: 'Kaan me tez dard hai aur gale me tonsils me kharash hai nigalne me dikkat ho rahi hai',
      expectedDept: 'ENT',
      expectedDoc: 'Dr. Vikram Malhotra'
    },
    {
      problem: 'Child Fever (Pediatrics)',
      concern: 'Bacche ko kal raat se 102 bukhar hai aur ulti sardi ho rahi hai',
      expectedDept: 'Pediatrics',
      expectedDoc: 'Dr. Meera Joshi'
    },
    {
      problem: 'Menstrual Issues (Gynecology)',
      concern: 'Severe irregular menstrual cycles with painful cramps and PCOS symptoms',
      expectedDept: 'Gynecology',
      expectedDoc: 'Dr. Kavita Desai'
    },
    {
      problem: 'Eye Pain & Blurry Vision (Ophthalmology)',
      concern: 'Aankh me tez jalan hai, laal ho gayi hai aur dhundhla dikh raha hai',
      expectedDept: 'Ophthalmology',
      expectedDoc: 'Dr. Rohan Mehta'
    },
    {
      problem: 'Anxiety & Sleeplessness (Psychiatry)',
      concern: 'Bahut zyada tanav aur anxiety hoti hai, panic attacks aate hain aur raat bhar neend nahi aati',
      expectedDept: 'Psychiatry',
      expectedDoc: 'Dr. Shalini Kapoor'
    },
    {
      problem: 'Diabetes & High Sugar (Endocrinology)',
      concern: 'Mera fasting sugar 280 aaya hai aur thyroid ki problem me weight badh raha hai',
      expectedDept: 'Endocrinology',
      expectedDoc: 'Dr. Arun Saxena'
    },
    {
      problem: 'Kidney Stone & Burning Urine (Nephrology/Urology)',
      concern: 'Peshab me bahut tez jalan ho rahi hai aur kamar ke piche gurde me pathri ka dard hai',
      expectedDept: 'Nephrology & Urology',
      expectedDoc: 'Dr. Deepak Mishra'
    },
    {
      problem: 'Fever & Weakness (General Medicine)',
      concern: 'Tez bukhar, thakan, kamzori aur shareer me dard hai dengue ya viral bukhar lag raha hai',
      expectedDept: 'General Medicine',
      expectedDoc: 'Dr. Sanjay Gupta'
    }
  ];

  console.log('\n🧠 Testing AI Disease-to-Doctor Suggestions:');
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    try {
      const res = await makeRequest(
        {
          hostname: 'localhost',
          port: 5000,
          path: '/api/patients/suggest-specialty',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        },
        { concern: tc.concern, language: 'en' }
      );

      const dept = res.body.department;
      const condition = res.body.suspectedCondition;
      const recDoc = res.body.recommendedDoctor?.fullName || (res.body.doctors && res.body.doctors[0]?.fullName);

      const deptMatches = dept.toLowerCase() === tc.expectedDept.toLowerCase();
      const docMatches = recDoc && recDoc.includes(tc.expectedDoc);

      if (deptMatches && docMatches) {
        console.log(`  ✅ [${i + 1}/${testCases.length}] ${tc.problem}:`);
        console.log(`     Condition: "${condition}"`);
        console.log(`     AI Suggested: ${recDoc} (${dept}) ✓`);
        passed++;
      } else {
        console.error(`  ❌ [${i + 1}/${testCases.length}] ${tc.problem}:`);
        console.error(`     Expected: ${tc.expectedDept} / ${tc.expectedDoc}`);
        console.error(`     Got:      ${dept} / ${recDoc}`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [${i + 1}/${testCases.length}] ${tc.problem} ERROR:`, err.message);
      failed++;
    }
  }

  console.log('\n=======================================================');
  console.log(`📊 SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed}`);
  console.log('=======================================================');
}

runTests();
