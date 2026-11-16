import PatientIntakePortal from './PatientIntakePortal.jsx';

export default function PatientPortalPage({ language, onStructureComplete, onRedFlagDetected }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <PatientIntakePortal
        language={language}
        onStructureComplete={onStructureComplete}
        onRedFlagDetected={onRedFlagDetected}
      />
    </div>
  );
}
