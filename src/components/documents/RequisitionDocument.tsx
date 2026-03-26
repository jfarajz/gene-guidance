import type { OrderState } from '@/types/order';

function formatDate(d: string): string {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return d;
}

const PANEL_GENES = [
  'ABCB1','ABCG2','ADRA2A','ADRB2','ANKK1','APOE','C11orf65','COMT','CYP1A2','CYP2B6',
  'CYP2C','CYP2C19','CYP2C8','CYP2C9','CYP2D6','CYP3A4','CYP3A5','CYP4F2','DPYD','DRD2',
  'EPHX1','F2','F5','GRIK4','HTR1A','HTR2A','HTR2C','ITGB3','MTHFR','NUDT15',
  'OPRM1','SLC6A2','SLCO1B1','TPMT','UGT2B15','VKORC1',
];
const BILLABLE_GENES = new Set(['CYP2C9', 'CYP2C19', 'CYP2D6']);

export function RequisitionDocument({ state, orderNumber }: { state: OrderState; orderNumber: string }) {
  const { patient: pat, provider: prov, insurance: ins, collection: col, diagnoses, medications } = state;

  return (
    <div className="font-sans text-[11px] leading-tight print-document">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xl font-bold tracking-wide text-foreground">FIRMALAB</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground">BIO-DIAGNOSTICS</div>
        </div>
        <div className="text-right font-mono text-sm text-muted-foreground">{orderNumber}</div>
      </div>

      {/* Two-column top */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Patient box */}
        <div className="border border-border rounded overflow-hidden">
          <div className="bg-[hsl(210,90%,94%)] px-2 py-1 font-semibold text-foreground text-xs">Patient</div>
          <div className="p-2 space-y-0.5">
            <Row label="Order #" value={orderNumber} />
            <Row label="First Name" value={pat.firstName} />
            <Row label="Last Name" value={pat.lastName} />
            <Row label="DOB" value={formatDate(pat.dob)} />
            <Row label="Gender" value={pat.gender} />
            <Row label="Address" value={`${pat.address1}${pat.address2 ? ', ' + pat.address2 : ''}`} />
            <Row label="City" value={pat.city} />
            <Row label="State" value={pat.state} />
            <Row label="Zip" value={pat.zip} />
            <Row label="Phone" value={pat.phone} />
            <Row label="Email" value={pat.email} />
            <Row label="Ethnicity" value={pat.ethnicity} />
          </div>
        </div>

        {/* Provider box */}
        <div className="border border-border rounded overflow-hidden">
          <div className="bg-primary px-2 py-1 font-semibold text-primary-foreground text-xs">Provider</div>
          <div className="p-2 space-y-0.5">
            <Row label="Insurance Type" value={ins.type} />
            <Row label="Physician" value={prov.name} />
            <Row label="NPI" value={prov.npi} />
            <Row label="Facility" value={prov.facilityName} />
            <Row label="Address" value={`${prov.address}, ${prov.city}, ${prov.state} ${prov.zip}`} />
            <Row label="Lab Code" value="PFRMIFRM" />
            <Row label="Reference Lab" value="Firma Lab Diagnostics" />
          </div>
        </div>
      </div>

      {/* Medications Table */}
      <div className="mb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-primary-foreground text-[10px]">
              <th className="px-2 py-1 text-left font-medium">Type</th>
              <th className="px-2 py-1 text-left font-medium">Medication / Drug</th>
              <th className="px-2 py-1 text-left font-medium">Frequency</th>
              <th className="px-2 py-1 text-left font-medium">Quantity</th>
              <th className="px-2 py-1 text-left font-medium">Dosages</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, i) => (
              <tr key={med.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                <td className="px-2 py-0.5 capitalize">{med.type}</td>
                <td className="px-2 py-0.5 font-medium">{med.generic} ({med.brand})</td>
                <td className="px-2 py-0.5">{med.frequency}</td>
                <td className="px-2 py-0.5">—</td>
                <td className="px-2 py-0.5">{med.dose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ICD-10 Table */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-foreground mb-1">ICD-10 Codes</div>
        <table className="w-full border-collapse border border-border">
          <tbody>
            {diagnoses.map(d => (
              <tr key={d.code} className="border-b border-border">
                <td className="px-2 py-0.5 font-medium w-20">{d.code}</td>
                <td className="px-2 py-0.5">{d.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insurance Details */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Row label="Insurance Type" value={ins.type} />
        <Row label="Provider" value={ins.provider} />
        <Row label="Relationship" value={ins.relationshipToInsured} />
        <Row label="Group ID" value={ins.groupId || '—'} />
        <Row label="Policy ID" value={ins.policyId} />
        <Row label="Phone" value={ins.phoneNumber || '—'} />
      </div>

      {/* Collection */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Row label="Collection Date" value={formatDate(col.date)} />
        <Row label="Collection Time" value={col.time} />
        <Row label="Method" value={col.method} />
      </div>

      {/* Tests Section */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-foreground mb-2">Comprehensive Metabolic PGx Panel</div>
        <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
          {PANEL_GENES.map(g => (
            <div key={g} className={BILLABLE_GENES.has(g) ? 'font-bold text-primary' : 'text-foreground'}>
              {g}
            </div>
          ))}
        </div>
      </div>

      {/* Medical Necessity Attestation */}
      <div className="mb-3">
        <div className="bg-tier-yellow-bg border border-tier-yellow-border rounded px-2 py-1 text-[10px] font-semibold mb-1">
          The requested genetic testing is medically necessary...
        </div>
        <div className="space-y-0.5 text-[10px]">
          <div>☑ Determine drug-gene interactions, determining how the patient will metabolize medications</div>
          <div>☑ Aid in determining the best course of therapy for my patient</div>
        </div>
      </div>

      {/* Application of Results */}
      <div className="mb-4">
        <div className="bg-[hsl(210,90%,94%)] border border-border rounded px-2 py-1 text-[10px] font-semibold mb-1">
          APPLICATION OF RESULTS (check all that apply)
        </div>
        <div className="space-y-0.5 text-[10px]">
          <div>☑ Prescribe clinical decision support for prescribing medications.</div>
          <div>☑ Prescribe clinical decision support for dosing and titration</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">I attest that the above genetic testing is medically necessary for this patient.</div>
          <div className="border-b border-foreground h-8 mb-1" />
          <div className="text-[10px]">Physician Signature</div>
          <div className="text-[10px] text-muted-foreground">Date: {formatDate(col.date)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">I consent to the above genetic testing.</div>
          <div className="border-b border-foreground h-8 mb-1" />
          <div className="text-[10px]">Patient Signature</div>
          <div className="text-[10px] text-muted-foreground">Date: _______________</div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-2 text-[9px] text-muted-foreground text-center">
        Firmalab PGx Gene Variation Panel Requisition Form | Lab Director: Dr. Emeka Ajemba | 870 Vine St. Los Angeles, CA 90038 | www.Firmalab.com Phone: 1 (800)799-7248 Email: info@firmalab.com
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
