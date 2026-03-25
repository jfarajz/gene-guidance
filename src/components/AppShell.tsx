import { useOrder } from '@/context/OrderContext';
import { DEMO_COMPLETE, DEMO_INTERACTIVE } from '@/data/demo';

const STEPS = ['Provider', 'Patient', 'Clinical', 'Review', 'Documents'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { order, setStep, loadDemo } = useOrder();
  const { currentStep, patient } = order;
  const hasPatient = patient.firstName && patient.lastName;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-6 bg-navy">
        <div className="leading-none">
          <div className="text-primary-foreground font-semibold tracking-widest text-sm">FIRMALAB</div>
          <div className="text-[10px] tracking-[0.15em] text-text-tertiary">BIO-DIAGNOSTICS</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => loadDemo(DEMO_COMPLETE)}
              className="text-[11px] px-2 py-0.5 rounded border border-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground hover:border-primary-foreground/40 transition-colors"
            >
              Load demo (complete)
            </button>
            <button
              onClick={() => loadDemo(DEMO_INTERACTIVE)}
              className="text-[11px] px-2 py-0.5 rounded border border-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground hover:border-primary-foreground/40 transition-colors"
            >
              Load demo (interactive)
            </button>
          </div>
          <span className="text-primary-foreground text-sm">Dr. Saeid Karandish · NPI 1528419710</span>
        </div>
      </header>

      {/* Stepper */}
      <div className="max-w-[1000px] mx-auto py-4 px-6">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${i <= currentStep ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <div className="flex mt-2">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => i < currentStep && setStep(i)}
              disabled={i >= currentStep && i !== currentStep}
              className={`flex-1 text-xs text-center transition-colors ${
                i === currentStep ? 'text-primary font-medium' : 'text-text-tertiary'
              } ${i < currentStep ? 'cursor-pointer hover:text-primary' : 'cursor-default'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Context */}
      {hasPatient && (
        <div className="max-w-[1000px] mx-auto px-6 pb-2">
          <p className="text-sm text-text-secondary">
            {patient.firstName} {patient.lastName} · DOB {patient.dob} · {order.insurance.type || 'No insurance'}
          </p>
        </div>
      )}

      {/* Content */}
      <main className="max-w-[1000px] mx-auto px-6 pb-12">
        {children}
      </main>
    </div>
  );
}
