# Viora Multilingual Intake — Lean Build Plan

## Goal

Make it easy for a patient to describe symptoms in a familiar language, review what was captured, and give a clinician a safe, structured account to verify. Use the supplied healthcare image as the visual direction: human, welcoming, and focused on mother-tongue access.

## Working assumptions

- Wispr Flow is for dictating development notes/prompts, not a required runtime service. Do not add a production dependency on it unless an approved SDK/API and the intended integration are confirmed.
- Build on this Viora repository rather than starting over.
- Patients can submit intake without an account; clinician access requires sign-in.
- MongoDB is the persistence path; the in-memory store is only a local/demo fallback, not a second production database.
- Pilot English and Hindi first; expand to other languages only after speech and clinical-language quality is evaluated.
- This repository has no `LICENSE` file. Confirm ownership and permission to reuse it before distributing a derivative product.

## MVP scope

1. Patient chooses a language and enters or speaks their concern.
2. Patient can review and correct the transcript before submitting.
3. Intake asks a small set of relevant follow-up questions.
4. The system produces a structured summary that distinguishes the patient's report from generated interpretation.
5. Clear emergency escalation is shown when red flags are detected.
6. A clinician reviews and confirms the summary; the system does not diagnose or prescribe.

### Defer from the first release

- Platform and hospital administration workflows.
- Appointments, queues, and advanced scheduling.
- SQL and multi-database support; MongoDB is the selected persistence path.
- Document uploads, PDF exports, and nonessential profile/identity fields.
- Expanding to every advertised language before quality checks.

Deferred feature code has been removed from the application source. Existing uploaded files are preserved as data and are not deleted by this cleanup.

## Reuse and change decisions

- **Reuse:** React/Express app structure, patient intake flow, English/Hindi UI, existing case APIs/models, triage rules, and clinician sign-off where they meet the MVP.
- **Modify:** patient intake is guest-accessible and clinician access is authenticated; simplify navigation to intake/review; make speech capture replaceable; preserve the patient report separately from any generated summary.
- **Research before replacing:** browser speech recognition, the current hosted Gemini integration, language translation, and any speech-to-text or text-to-speech model. Do not select models or claim language accuracy without testing and license review.
- **Do not rewrite:** the frontend, backend, or database solely for technology fashion.

## Phases and completion checks

### 0. Baseline and reuse gate

Map the current intake-to-clinician flow, data stored/transmitted, authentication, deployment, tests, and dependency/license constraints.

**Complete when:** reuse decisions are documented, ownership/permission is confirmed, and patient data flows are understood.

### 1. Product and UX cut

Reduce the first-run journey to language selection, symptom capture, transcript review, follow-up, and clinician handoff. Keep admin and scheduling work out of the MVP.

**Complete when:** a patient can understand each step and correct captured text before it is sent.

### 2. Language and technology evaluation

Compare at least three viable options where practical for speech recognition, translation, and structured extraction. Check language coverage, real-world accents/code-switching, latency, hardware/hosting cost, maintenance, security, and license. Evaluate Wispr Flow separately as a development tool versus any proposed runtime integration.

**Complete when:** choices have source links, trade-offs, licensing notes, and a small representative test set; uncertain performance is marked for validation.

### 3. MVP implementation

Implement the focused patient intake, reliable speech/text fallback, adaptive follow-up, structured case handoff, and clinician confirmation using the selected options. Keep the existing backend modular rather than introducing microservices.

**Complete when:** the end-to-end patient-to-clinician flow works without a mandatory paid AI service and handles unavailable microphone/network/model paths explicitly.

### 4. Safety, privacy, and quality validation

Test supported languages and noisy/code-switched examples; verify emergency escalation, authentication/authorization, data minimization, retention, and auditability. Preserve patient-reported content separately from generated summaries.

**Complete when:** no AI-generated diagnosis or prescription is presented as fact; urgent cases get clear escalation; clinician review is required; failures are visible; targeted tests pass.

### 5. Pilot and deployment

Deploy a limited pilot, measure transcription correction rate, language-specific failures, completion time, escalation behavior, and operating cost. Fix high-impact issues before adding languages or deferred features.

**Complete when:** pilot findings support safe expansion and the service can be operated within the agreed privacy and cost constraints.

## First implementation priorities

1. Confirm repository ownership/license and the Wispr Flow use case.
2. Trace the patient-to-clinician journey and validate MongoDB plus the local/demo fallback.
3. Agree on pilot languages, sample evaluation scenarios, and safety acceptance criteria.
4. Then implement the MVP; do not begin with a broad rewrite or model integration.