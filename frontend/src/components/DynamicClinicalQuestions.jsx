import React, { useMemo } from 'react';
import { Activity, Brain, HeartPulse, Stethoscope, Wind } from 'lucide-react';

const QUESTION_GROUPS = [
  {
    id: 'cardiac',
    keywords: ['chest', 'heart', 'cardiac', 'pressure', 'palpitation', 'सीने', 'हार्ट', 'धड़कन', 'नेञ्जु'],
    icon: HeartPulse,
    title: 'Cardiovascular Assessment (Socrates 10-Point)',
    questions: [
      { id: 'radiation', label: 'Does the discomfort spread to your left arm, jaw, neck, shoulder, or back?', options: ['No', 'Yes', 'Not sure'] },
      { id: 'breathlessness', label: 'Are you short of breath, cold-sweaty, dizzy, or nauseated with it?', options: ['No', 'Yes', 'Some of these symptoms'] },
      { id: 'exertion', label: 'Did the discomfort begin or worsen with physical exertion, and improve with rest?', options: ['No', 'Yes', 'Not sure'] },
      { id: 'character', label: 'How would you describe the feeling (tight band, heavy pressure, burning, sharp)?', options: ['Heavy pressure / Squeezing', 'Burning sensation', 'Sharp / Stabbing', 'Fluttering'] },
      { id: 'duration', label: 'How long does each episode typically last?', options: ['Under 5 minutes', '5 to 20 minutes', 'Over an hour / Continuous'] },
      { id: 'palpitations', label: 'Do you feel fluttering, racing, or irregularly skipping heartbeats?', options: ['No', 'Yes, racing fast', 'Yes, skipping beats'] },
      { id: 'syncope', label: 'Have you had any lightheadedness, dizziness, or fainting spells?', options: ['No', 'Lightheaded only', 'Yes, fainted'] },
      { id: 'swelling', label: 'Have you noticed swelling or fluid retention in your ankles, feet, or legs?', options: ['No', 'Mild swelling', 'Significant pitting swelling'] },
      { id: 'history', label: 'Do you have a personal or family history of high blood pressure, cholesterol, or heart disease?', options: ['No', 'Yes, personal history', 'Yes, family history', 'Both'] },
      { id: 'medications', label: 'Are you currently taking any blood pressure pills, blood thinners (aspirin), or cardiac medications?', options: ['No', 'Yes', 'Not sure'] }
    ]
  },
  {
    id: 'respiratory',
    keywords: ['cough', 'breath', 'breathing', 'wheeze', 'asthma', 'lung', 'फेफ', 'खांसी', 'सांस', 'दमा', 'कफ'],
    icon: Wind,
    title: 'Respiratory & Pulmonary Assessment (Socrates 10-Point)',
    questions: [
      { id: 'onset', label: 'Did your breathing difficulty or cough start suddenly or develop gradually?', options: ['Suddenly', 'Gradually over days', 'Chronic over weeks'] },
      { id: 'coughType', label: 'Is your cough completely dry, or does it produce phlegm or sputum?', options: ['Dry / Hacking', 'Clear / White phlegm', 'Yellow / Green phlegm', 'Blood-tinged'] },
      { id: 'wheezing', label: 'Do you hear or feel an audible whistling or wheezing sound when breathing out?', options: ['No', 'Yes, audible wheeze', 'Not sure'] },
      { id: 'nocturnal', label: 'Do your symptoms worsen at night, waking you up, or in the early morning?', options: ['No', 'Yes, worse at night', 'Equal throughout day'] },
      { id: 'triggers', label: 'Are symptoms provoked by dust, cold weather, physical exercise, smoke, or pollen?', options: ['No clear trigger', 'Dust or cold air', 'Exercise / exertion', 'Smoke or scents'] },
      { id: 'exertionLimit', label: 'Can you walk on flat ground or climb stairs without stopping to catch your breath?', options: ['Yes, normal breathing', 'Mildly breathless', 'Severely breathless after few steps'] },
      { id: 'fever', label: 'Do you have accompanying fever, chills, body aches, or night sweats?', options: ['No fever', 'Low-grade fever', 'High fever with chills'] },
      { id: 'chestPain', label: 'Does taking a deep breath or coughing cause sharp stabbing pain in your chest side?', options: ['No', 'Yes, sharp with breath', 'Dull ache'] },
      { id: 'inhalers', label: 'Have you used an asthma inhaler or nebulizer, and does it relieve symptoms?', options: ['Never used', 'Relieves symptoms', 'Does not relieve symptoms'] },
      { id: 'redFlags', label: 'Are you struggling to speak full sentences, or noticing blue discoloration around lips/nails?', options: ['No', 'Struggling to speak', 'Not sure'] }
    ]
  },
  {
    id: 'gastrointestinal',
    keywords: ['stomach', 'abdominal', 'abdomen', 'vomit', 'nausea', 'diarrhea', 'constipation', 'acid', 'burn', 'पेट', 'दस्त', 'उल्टी', 'एसिडिटी'],
    icon: Activity,
    title: 'Gastrointestinal & Digestive Assessment (Socrates 10-Point)',
    questions: [
      { id: 'location', label: 'Where is the abdominal discomfort located?', options: ['Upper middle / epigastric', 'Right upper under ribs', 'Right lower quadrant', 'Generalized / diffuse'] },
      { id: 'foodRelation', label: 'Is the pain related to food intake or specific types of meals (oily, spicy, dairy)?', options: ['No relation', 'Worse immediately after meals', 'Better after eating', 'Worse hours later'] },
      { id: 'nauseaVomit', label: 'Are you experiencing persistent nausea, vomiting, or retching?', options: ['No nausea', 'Nausea only', 'Vomiting food contents', 'Frequent vomiting'] },
      { id: 'bowelHabits', label: 'Have you had diarrhea, severe constipation, or watery loose stools?', options: ['Normal bowel movements', 'Watery diarrhea', 'Severe constipation', 'Alternating'] },
      { id: 'bloodInStool', label: 'Have you noticed red blood in stool, black tarry stools, or blood in vomit?', options: ['No', 'Yes, red blood', 'Yes, black tarry stool', 'Not sure'] },
      { id: 'burnReflux', label: 'Do you suffer from sour acid regurgitation, burning in throat, or painful swallowing?', options: ['No', 'Heartburn / acid regurgitation', 'Painful swallowing'] },
      { id: 'hydration', label: 'Are you able to keep down oral fluids and passing normal light-colored urine?', options: ['Yes, drinking normally', 'Struggling to hold fluids', 'Very dark / infrequent urine'] },
      { id: 'feverJaundice', label: 'Have you noticed yellowish tint in eyes/skin (jaundice) or dark tea-colored urine?', options: ['No', 'Yellowing noticed', 'Not sure'] },
      { id: 'durationSeverity', label: 'Is the pain continuous and worsening, or coming in crampy spasmodic waves?', options: ['Crampy waves (colic)', 'Continuous dull ache', 'Severe unbearable pain'] },
      { id: 'priorEpisodes', label: 'Have you had gallstones, ulcers, pancreatitis, or prior abdominal surgeries?', options: ['No prior issues', 'Gallstones or ulcers', 'Prior abdominal surgery', 'Not sure'] }
    ]
  },
  {
    id: 'neurological',
    keywords: ['headache', 'head pain', 'dizzy', 'weakness', 'numb', 'seizure', 'vision', 'migraine', 'सिर', 'चक्कर', 'माइग्रेन'],
    icon: Brain,
    title: 'Neurological & Headache Assessment (Socrates 10-Point)',
    questions: [
      { id: 'onsetSudden', label: 'Did the headache or symptom reach peak severity within seconds (thunderclap)?', options: ['No, gradual build-up', 'Yes, explosive peak in seconds', 'Not sure'] },
      { id: 'sideLocation', label: 'Is the headache throbbing on one side of your head, or pressing like a tight band all over?', options: ['One-sided throbbing', 'Bilateral tight band', 'Behind eye/face', 'Back of head/neck'] },
      { id: 'sensoryTrigger', label: 'Is it accompanied by sensitivity to bright light (photophobia) or loud sound?', options: ['No', 'Yes, light sensitivity', 'Yes, sound sensitivity', 'Both light & sound'] },
      { id: 'nauseaAura', label: 'Do you get visual zig-zags, blind spots (aura), nausea, or vomiting before the headache?', options: ['No', 'Visual aura before headache', 'Nausea and vomiting', 'Both'] },
      { id: 'weaknessNumbness', label: 'Do you have new facial drooping, arm/leg weakness, numbness, or tingling?', options: ['No', 'One-sided arm/leg weakness', 'Facial drooping', 'Tingling / numbness'] },
      { id: 'speechConfusion', label: 'Have you or family noticed slurred speech, confusion, or difficulty finding words?', options: ['No', 'Slurred speech', 'Confusion / word finding trouble'] },
      { id: 'dizzinessBalance', label: 'Are you feeling spinning vertigo, room-spinning dizziness, or unsteadiness walking?', options: ['No', 'Spinning vertigo', 'Lightheadedness', 'Loss of balance'] },
      { id: 'neckStiffness', label: 'Do you have a stiff neck that hurts when touching your chin to your chest, plus fever?', options: ['No', 'Yes, neck stiffness and fever', 'Not sure'] },
      { id: 'worseningStrain', label: 'Does the headache worsen with coughing, bending forward, sneezing, or straining?', options: ['No change', 'Worsens significantly with strain', 'Not sure'] },
      { id: 'frequencyHistory', label: 'How often do these headache episodes occur, and do standard painkillers relieve them?', options: ['First time ever', 'Occasional episodes (relieved by OTC)', 'Frequent/chronic (poor relief)'] }
    ]
  },
  {
    id: 'musculoskeletal',
    keywords: ['knee', 'joint', 'back', 'neck', 'shoulder', 'muscle', 'bone', 'pain', 'घुटने', 'हड्डी', 'कमर', 'जोड़'],
    icon: Stethoscope,
    title: 'Musculoskeletal & Orthopedic Assessment (Socrates 10-Point)',
    questions: [
      { id: 'injuryPreceding', label: 'Did this pain start following an acute injury, fall, sports twist, or heavy lifting?', options: ['No injury, started spontaneously', 'Direct fall / impact', 'Twisting injury', 'Heavy lifting'] },
      { id: 'morningStiffness', label: 'Is there joint or back stiffness in the morning, and how long does it take to loosen up?', options: ['No stiffness', 'Less than 30 minutes', 'Over 1 hour of stiffness'] },
      { id: 'weightBearing', label: 'Does the pain worsen when putting weight on it, walking, or climbing stairs?', options: ['No pain on walking', 'Moderate pain on walking', 'Cannot bear weight'] },
      { id: 'swellingWarmth', label: 'Is there visible swelling, warmth, redness, or fluid accumulation in the joint?', options: ['No visible swelling', 'Mild puffiness', 'Marked swelling and warmth'] },
      { id: 'jointLocking', label: 'Do you hear clicking/grinding, or feel the joint giving way or locking completely?', options: ['No mechanical sounds', 'Clicking / grinding', 'Joint gives way or locks'] },
      { id: 'radiationNumbness', label: 'Does pain shoot down your leg (sciatica) or arm, with tingling or numbness?', options: ['No radiation', 'Radiates down leg', 'Radiates down arm'] },
      { id: 'restRelief', label: 'Does resting, lying down, or elevating the limb provide noticeable relief?', options: ['Yes, relieves pain', 'No relief with rest', 'Hurts worse when resting'] },
      { id: 'nightPain', label: 'Does the joint or bone ache wake you from sleep at night?', options: ['No, sleep is undisturbed', 'Yes, wakes me from sleep'] },
      { id: 'bladderBowel', label: 'For back pain: Have you noticed any loss of bowel or bladder control, or groin numbness?', options: ['No, normal control', 'Yes, bowel/bladder changes (Urgent)', 'Not sure'] },
      { id: 'priorTreatment', label: 'Have you tried physical therapy, pain relievers, knee braces, or prior joint surgery?', options: ['None yet', 'Taking pain medication', 'Physical therapy', 'Prior surgery/injections'] }
    ]
  },
  {
    id: 'pediatric',
    keywords: ['child', 'baby', 'infant', 'kid', 'newborn', 'pediatric', 'बच्च', 'शिशु', 'बालक'],
    icon: Activity,
    title: 'Pediatric Health Assessment (Socrates 10-Point)',
    questions: [
      { id: 'ageTemp', label: 'What is the child\'s exact age, and what is the highest recorded temperature?', options: ['Under 6 months', '6 to 24 months', '2 to 5 years', 'Above 5 years'] },
      { id: 'duration', label: 'How many days has the fever or illness lasted?', options: ['Started today (<24h)', '2 to 3 days', 'More than 4 days'] },
      { id: 'alertness', label: 'Is the child alert, making eye contact and playful, or unusually drowsy and hard to wake?', options: ['Alert and active', 'Fussy but consolable', 'Abnormally drowsy / hard to wake'] },
      { id: 'feeding', label: 'How is the child feeding: taking feeds eagerly, refusing feeds, or vomiting everything?', options: ['Drinking / eating well', 'Reduced intake by half', 'Refusing all fluids / vomiting'] },
      { id: 'urineDiapers', label: 'How many wet diapers or urine voids has the child had in the past 24 hours?', options: ['Normal (4+ wet diapers)', 'Reduced (1-3 wet diapers)', 'None for over 8-12 hours'] },
      { id: 'breathingEffort', label: 'Have you noticed fast breathing, flaring nostrils, or chest pulling in (retractions)?', options: ['Normal quiet breathing', 'Mild fast breathing', 'Severe chest indrawing / grunting'] },
      { id: 'coughStridor', label: 'Is there a harsh barking cough, noisy whistling (stridor), or runny nose?', options: ['No cough', 'Mild runny nose and cough', 'Barking / harsh cough'] },
      { id: 'stoolVomit', label: 'Is the child having watery loose stools or repeated vomiting episodes?', options: ['No diarrhea or vomiting', 'Occasional loose stool', 'Frequent vomiting & diarrhea'] },
      { id: 'rashSkin', label: 'Has a skin rash appeared (flat red spots, hives, or non-blanching purple spots)?', options: ['No rash', 'Mild red rash', 'Purple / dark spots that don\'t fade'] },
      { id: 'vaccinesSeizures', label: 'Are routine vaccinations up to date, and has the child had any febrile seizures?', options: ['Vaccines up to date, no seizures', 'Missed vaccines', 'Had a seizure / body stiffening'] }
    ]
  },
  {
    id: 'urology',
    keywords: ['kidney', 'stone', 'urinary', 'urine', 'bladder', 'burning', 'prostate', 'पेशाब', 'जलन', 'पथरी', 'गुर्दा'],
    icon: Activity,
    title: 'Urology & Renal Assessment (Socrates 10-Point)',
    questions: [
      { id: 'dysuria', label: 'Do you experience scalding, stinging, or burning pain while passing urine?', options: ['No burning', 'Mild burning', 'Severe scalding pain'] },
      { id: 'locationPain', label: 'Where is the pain located: one-sided flank/back, lower abdomen, or radiating to groin?', options: ['One-sided lower back / flank', 'Lower belly over bladder', 'Radiating into groin / genitals'] },
      { id: 'spasmsColic', label: 'Is the pain steady and dull, or coming in intense, agonizing waves of spasms (colic)?', options: ['Steady dull ache', 'Intense spasmodic waves', 'Burning during urination only'] },
      { id: 'hematuria', label: 'Have you noticed red, pink, cola-colored, or cloudy urine, or visible blood clots?', options: ['Normal clear yellow', 'Cloudy urine', 'Pink or red-tinged urine', 'Visible blood clots'] },
      { id: 'frequencyUrgency', label: 'Do you feel an irresistible sudden urge to urinate, or urinating very frequently in small drops?', options: ['Normal frequency', 'Increased frequency', 'Sudden uncontrollable urgency'] },
      { id: 'stonePassage', label: 'Have you noticed any gritty sand, gravel, or solid stone fragments passed in your urine?', options: ['No stones observed', 'Yes, gritty sand passed', 'Yes, solid stone passed'] },
      { id: 'nauseaVomit', label: 'Are you experiencing severe nausea, retching, or vomiting with the flank pain?', options: ['No nausea', 'Mild nausea', 'Frequent vomiting'] },
      { id: 'feverChills', label: 'Do you have high fever with shivering or shaking chills (rigors)?', options: ['No fever', 'Low-grade fever', 'High fever with shaking chills'] },
      { id: 'outputChanges', label: 'Have you noticed a sharp drop in your daily urine volume, or inability to pass urine?', options: ['Normal urine volume', 'Noticeably reduced urine', 'Unable to pass urine (Retention)'] },
      { id: 'stoneHistory', label: 'Do you have a personal or family history of kidney stones or recurrent urinary tract infections?', options: ['No prior history', 'Personal history of stones', 'Family history of stones', 'Recurrent UTIs'] }
    ]
  }
];

const GENERAL_QUESTIONS = [
  { id: 'onset', label: 'When did this problem first begin, and has it progressed over time?', options: ['Started today', 'Started within past week', 'Ongoing for weeks/months', 'Not sure'] },
  { id: 'intensity', label: 'How would you rate the current severity of your symptoms on a scale?', options: ['Mild (noticeable but manageable)', 'Moderate (interferes with routine)', 'Severe (cannot perform daily tasks)'] },
  { id: 'impact', label: 'How much is this affecting your normal daily routine, work, or sleep?', options: ['Minimal impact', 'Moderate disruption', 'Severe / bedbound'] },
  { id: 'triggers', label: 'Are there clear triggers (meals, physical exertion, stress, cold air) that make it worse?', options: ['No obvious trigger', 'Physical exertion or movement', 'Food or meals', 'Emotional stress'] },
  { id: 'relieving', label: 'Does rest, hydration, changing posture, or taking over-the-counter medicine provide relief?', options: ['Rest brings relief', 'Medication helps temporarily', 'No relief from anything', 'Not sure'] },
  { id: 'chronicConditions', label: 'Do you have any chronic health conditions such as diabetes, high blood pressure, or asthma?', options: ['No chronic conditions', 'Hypertension (High BP)', 'Diabetes', 'Multiple chronic conditions'] },
  { id: 'currentMeds', label: 'Are you currently taking any prescription medications, supplements, or blood thinners?', options: ['No medications', 'Prescription medications', 'Over-the-counter supplements'] },
  { id: 'feverChills', label: 'Are you having fever, shivering chills, night sweats, or unexplained weight loss?', options: ['No systemic symptoms', 'Fever or chills', 'Night sweats / fatigue'] },
  { id: 'redFlags', label: 'Are you experiencing sudden fainting, shortness of breath, chest pain, or confusion?', options: ['No red flags', 'Shortness of breath', 'Chest pain or fainting', 'Confusion / extreme weakness'] },
  { id: 'priorHistory', label: 'Have you ever had a similar health problem or hospitalization for this issue before?', options: ['First time occurrence', 'Had similar episodes in past', 'Previously hospitalized for this'] }
];

export default function DynamicClinicalQuestions({ complaint, answers, onChange, questions: apiQuestions, isAiGenerated }) {
  const group = useMemo(() => {
    const normalized = complaint.toLowerCase();
    return QUESTION_GROUPS.find((candidate) => candidate.keywords.some((keyword) => normalized.includes(keyword))) || null;
  }, [complaint]);

  const questions = apiQuestions?.length ? apiQuestions : (group ? group.questions : GENERAL_QUESTIONS);
  const Icon = group?.icon || Stethoscope;

  const updateAnswer = (id, value) => {
    onChange({ ...answers, [id]: value });
  };

  return (
    <section className="space-y-4" aria-live="polite">
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <div className="bg-teal-100 text-teal-700 p-2.5 rounded-xl"><Icon className="w-5 h-5" /></div>
        <div>
          <p className="text-sm font-bold text-slate-800">{group?.title || 'General clinical follow-up'}</p>
          <p className="text-xs text-slate-500">{isAiGenerated ? 'Questions were generated from your symptom description for clinician intake.' : 'Questions update as your symptom description changes.'}</p>
        </div>
      </div>

      {questions.map((question, index) => (
        <div key={`${group?.id || 'general'}-${question.id}-${index}`} className="border border-slate-200 rounded-2xl p-4">
          <label className="block text-sm font-bold text-slate-800 mb-3">{index + 1}. {question.label}</label>
          <div className="flex flex-wrap gap-2">
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateAnswer(question.id, option)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  answers[question.id] === option
                    ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/10'
                    : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-slate-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-500">This interview supports clinical documentation and triage. It does not replace evaluation by a qualified clinician.</p>
    </section>
  );
}
