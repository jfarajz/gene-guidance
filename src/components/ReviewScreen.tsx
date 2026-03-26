import { useEffect, useRef } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Check, X } from 'lucide-react';

function generateOrderNumber() {
  return 'FRP-' + Math.floor(1000000 + Math.random() * 9000000).toString();
}

function Section({ title, editStep, children }: { title: string; editStep: number; children: React.ReactNode }) {
  const { setStep } = useOrder();
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <button onClick={() => setStep(editStep)} className="text-sm text-primary hover:underline cursor-pointer">Edit</button>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value || '—'}</div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === 'green') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-tier-green-bg text-tier-green border border-tier-green-border font-medium">MolDx listed</span>;
  if (tier === 'yellow') return <span className="text-[10px] px-1.5 py-0.5 rounded bg-tier-yellow-bg text-tier-yellow border border-tier-yellow-border font-medium">LCD covered</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded bg-tier-red-bg text-destructive border border-tier-red-border font-medium">Not covered</span>;
}

export function ReviewScreen() {
  const { order, setStep } = useOrder();
  const orderNumRef = useRef(order.orderNumber);

  useEffect(() => {
    if (!orderNumRef.current) {
      orderNumRef.current = generateOrderNumber();
    }
  }, []);

  const orderNum = orderNumRef.current || generateOrderNumber();
  const { provider: prov, patient: pat, insurance: ins, collection: col, diagnoses, medications, qualification: qual } = order;

  const prescribed = medications.filter(m => m.type === 'prescribed');
  const considered = medications.filter(m => m.type === 'considered');

  const formatDate = (d: string) => {
    if (!d) return '—';
    const parts = d.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
    return d;
  };

  return (
    <div className="py-8">
      {/* Title */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Review & confirm</h1>
          <p className="text-sm text-text-secondary mt-1">Review all information before generating documents.</p>
        </div>
        <span className="text-sm text-muted-foreground font-mono">{orderNum}</span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Card 1: Provider */}
        <Section title="Provider" editStep={0}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Provider" value={prov.name} />
            <Field label="NPI" value={prov.npi} />
            <Field label="Facility" value={prov.facilityName} />
            <Field label="Address" value={[prov.address, prov.city, prov.state, prov.zip].filter(Boolean).join(', ')} />
          </div>
        </Section>

        {/* Card 2: Patient */}
        <Section title="Patient" editStep={1}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Name" value={`${pat.firstName} ${pat.lastName}`} />
            <Field label="DOB" value={formatDate(pat.dob)} />
            <Field label="Gender" value={pat.gender} />
            <Field label="Ethnicity" value={pat.ethnicity} />
            <Field label="Address" value={[pat.address1, pat.address2, pat.city, pat.state, pat.zip].filter(Boolean).join(', ')} />
            <Field label="Phone" value={pat.phone} />
            <Field label="Email" value={pat.email} />
          </div>
        </Section>

        {/* Card 3: Insurance */}
        <Section title="Insurance" editStep={1}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Type" value={ins.type} />
            <Field label="Provider" value={ins.provider} />
            <Field label="Policy ID" value={ins.policyId} />
            <Field label="Group ID" value={ins.groupId} />
            <Field label="Relationship" value={ins.relationshipToInsured} />
          </div>
        </Section>

        {/* Card 4: Specimen */}
        <Section title="Specimen" editStep={1}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Collection date" value={formatDate(col.date)} />
            <Field label="Collection time" value={col.time} />
            <Field label="Method" value={col.method} />
          </div>
        </Section>

        {/* Card 5: Clinical Summary */}
        <Section title="Clinical summary" editStep={2}>
          {/* Diagnoses */}
          <div className="mb-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Diagnoses</div>
            <div className="flex flex-col gap-1">
              {diagnoses.map(d => (
                <div key={d.code} className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{d.code}</span>
                  <span className="text-text-secondary">{d.description}</span>
                  <TierBadge tier={d.tier} />
                </div>
              ))}
            </div>
          </div>

          {/* Medications */}
          <div className="mb-4">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Medications</div>
            {prescribed.length > 0 && (
              <div className="mb-2">
                <div className="text-xs text-muted-foreground mb-1">Prescribed</div>
                {prescribed.map(med => <MedLine key={med.id} med={med} />)}
              </div>
            )}
            {considered.length > 0 && (
              <>
                {prescribed.length > 0 && <div className="border-t border-border my-2" />}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Considered</div>
                  {considered.map(med => <MedLine key={med.id} med={med} />)}
                </div>
              </>
            )}
          </div>

          {/* Qualification mini-dashboard */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              {(['CYP2C19', 'CYP2D6', 'CYP2C9'] as const).map(gene => {
                const g = qual.genes[gene];
                const ok = g.qualified;
                return (
                  <span key={gene} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${
                    ok ? 'bg-tier-green-bg text-tier-green border border-tier-green-border' : 'bg-muted text-muted-foreground border border-border'
                  }`}>
                    {g.cpt} {gene} {ok ? <Check size={12} /> : <X size={12} />}
                  </span>
                );
              })}
            </div>
            <div className="font-mono text-xs text-text-secondary">
              Box 19: {qual.box19.text || '(empty)'}
              <span className={`ml-2 ${qual.box19.overLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                ({qual.box19.charCount}/80 chars{qual.box19.overLimit ? ' — over limit!' : ''})
              </span>
            </div>
          </div>
        </Section>

        {/* Card 6: Order Summary */}
        <div className="bg-surface rounded-xl border border-border border-l-4 border-l-primary p-5">
          <h3 className="text-base font-semibold text-foreground mb-3">Order summary</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <Field label="Order #" value={orderNum} />
            <Field label="Date of service" value={formatDate(col.date)} />
            <Field label="Panel" value="Comprehensive Metabolic PGx Panel (36 genes)" />
            <Field label="Billable CPTs" value={qual.billableCPTs.join(', ') || 'None'} />
            <Field label="Panel code" value={qual.panelEligible ? '81418 (Panel eligible)' : qual.billableCPTs.join(', ') || 'Individual CPTs'} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6 mb-8">
        <button
          onClick={() => setStep(2)}
          className="h-10 px-6 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          ← Back to clinical
        </button>
        <button
          onClick={() => setStep(4)}
          className="h-12 px-8 rounded-lg bg-primary text-primary-foreground text-base font-medium hover:bg-primary/90 transition-colors"
        >
          Generate documents →
        </button>
      </div>
    </div>
  );
}

function MedLine({ med }: { med: import('@/types/order').Medication }) {
  return (
    <div className="flex items-center gap-1.5 text-sm py-0.5">
      <span className={`font-medium ${med.isBillable ? 'text-foreground' : 'text-destructive'}`}>{med.generic}</span>
      {med.isBillable ? (
        <>
          {med.geneMatches.map(gm => (
            <span key={gm.gene} className="bg-gene-badge-bg text-gene-badge-text text-[10px] px-1.5 py-0.5 rounded font-medium">{gm.gene}</span>
          ))}
          {med.geneMatches.map(gm => (
            <span key={gm.cpt} className="bg-gene-badge-bg text-gene-badge-text text-[10px] px-1.5 py-0.5 rounded font-medium">{gm.cpt}</span>
          ))}
        </>
      ) : (
        <span className="text-[10px] text-destructive">Not in MolDx</span>
      )}
    </div>
  );
}
