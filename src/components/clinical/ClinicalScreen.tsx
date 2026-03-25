import { useOrder } from '@/context/OrderContext';
import { DiagnosisPanel } from '@/components/clinical/DiagnosisPanel';
import { MedicationPanel } from '@/components/clinical/MedicationPanel';
import { QualificationDashboard } from '@/components/clinical/QualificationDashboard';

export function ClinicalScreen() {
  const { order, setStep } = useOrder();
  const { patient, insurance, qualification } = order;
  const hasQualified = qualification.billableCPTs.length > 0;

  return (
    <div className="py-6">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-foreground">Diagnoses & medications</h1>
      {patient.firstName && (
        <p className="text-sm text-text-secondary mt-1">
          {patient.firstName} {patient.lastName} · DOB {patient.dob} · {insurance.type || 'No insurance'}
        </p>
      )}

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-6 mt-5">
        <DiagnosisPanel />
        <MedicationPanel />
      </div>

      {/* Qualification Dashboard */}
      <QualificationDashboard />

      {/* Navigation */}
      <div className="flex justify-between mt-6 mb-8">
        <button
          onClick={() => setStep(1)}
          className="h-10 px-5 rounded-lg border border-border bg-card text-text-secondary text-sm hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => hasQualified && setStep(3)}
          disabled={!hasQualified}
          className={`h-10 px-5 rounded-lg text-primary-foreground text-sm font-medium transition-colors ${
            hasQualified
              ? 'bg-primary hover:bg-primary-hover cursor-pointer'
              : 'bg-primary opacity-50 cursor-not-allowed'
          }`}
        >
          Review & generate documents →
        </button>
      </div>
    </div>
  );
}
