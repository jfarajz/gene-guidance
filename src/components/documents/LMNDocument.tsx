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

export function LMNDocument({ state }: { state: OrderState }) {
  const { patient: pat, provider: prov, diagnoses, collection: col } = state;

  return (
    <div className="font-sans text-[11px] leading-relaxed print-document">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-lg font-bold tracking-wide text-foreground">FIRMALAB</div>
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground">BIO-DIAGNOSTICS</div>
        </div>
        <div className="text-xl font-semibold text-primary">PGx Medical Necessity Form</div>
      </div>

      {/* Sub-header */}
      <div className="flex justify-between text-[10px] text-muted-foreground mb-4 border-b border-border pb-2">
        <span>Director: Dr. Emeka Ajemba</span>
        <span>CLIA Number: 05D0992853</span>
      </div>

      {/* Body */}
      <div className="space-y-3">
        <p className="font-semibold text-foreground">DEAR CLAIMS SPECIALIST:</p>

        <p>This letter intends to both explain the medical necessity of the ordered test and as a formal request for full coverage of Firmalab's comprehensive pharmacogenomic multi gene variation panel that was prescribed for the patient (see listed below) by their healthcare provider (see below). The patient's sample will be used for pharmacogenomic testing by Firmalab Bio-diagnostics, a CLIA-certified laboratory under CLIA#05D0992853 and NPI#1922459577.</p>

        <p>Using Firmalab's PGx gene variation panel in combination with patient medical history, clinical findings, and patient information will assist and offer guidance for patient-specific clinical decisions for medical management. Specifically, this test intends to avoid adverse drug reactions which can be costly and at times fatal. This test will also allow the physician to optimize drug dosing and better the precision and quality of successful treatment.</p>

        <p className="font-medium text-foreground">Firmalab's testing will lead to a change in the management of the patient's condition and will eliminate the need for further testing by:</p>
        <ul className="list-disc ml-5 space-y-0.5">
          <li>Reducing trial-and-error in prescribing medications</li>
          <li>Precise selection of medication that is more effective, and has fewer side effects for the patient</li>
          <li>Increase patient medication and treatment adherence</li>
          <li>Eliminate potential associated costs from adverse drug reactions</li>
          <li>Selecting the correct medication and dose for the patient</li>
          <li>Reduce the need or frequency of tests associated with the patient's condition</li>
        </ul>

        <div className="space-y-2">
          <p><span className="font-semibold">1. Personalized Medicine:</span> The CYP2D6 and CYP2C19 enzymes are responsible for metabolizing approximately 25% of commonly prescribed drugs. Genetic variations in these enzymes can significantly alter drug metabolism, leading to therapeutic failure or adverse effects.</p>
          <p><span className="font-semibold">2. Adverse Drug Reactions:</span> CYP2C9 and CYP3A4 genetic variants can affect the metabolism of many medications, increasing the risk of adverse drug reactions. Understanding a patient's genetic profile helps prevent these reactions.</p>
          <p><span className="font-semibold">3. Efficacy Concerns:</span> When standard treatments have not achieved the desired therapeutic outcomes, pharmacogenomic testing provides actionable insights to guide more effective treatment strategies.</p>
        </div>

        <p><span className="font-medium">Relevant Genes:</span> {PANEL_GENES.join(', ')}</p>

        <p>Each of the reported conditions directly influences the patient's treatment plan and underscores the necessity for a tailored pharmacogenetic approach. Understanding the genetic factors associated with these ICD-10 coded conditions will enable more precise and effective management of the patient's medication regimen.</p>

        {/* Attestation */}
        <div className="bg-tier-yellow-bg border border-tier-yellow-border rounded px-2 py-1 text-[10px] font-semibold">
          The requested genetic testing is medically necessary...
        </div>
        <div className="space-y-0.5 text-[10px]">
          <div>☑ Determine drug-gene interactions, determining how the patient will metabolize medications</div>
          <div>☑ Aid in determining the best course of therapy for my patient</div>
        </div>
      </div>

      {/* Bottom Table */}
      <div className="grid grid-cols-2 gap-4 mt-4 mb-4">
        <div className="border border-border rounded p-2">
          <div className="text-[10px] font-semibold text-foreground mb-1">Patient Information</div>
          <div className="space-y-0.5 text-[10px]">
            <div>Name: {pat.firstName} {pat.lastName}</div>
            <div>DOB: {formatDate(pat.dob)}</div>
            <div>Gender: {pat.gender}</div>
            <div>Address: {pat.address1}, {pat.city}, {pat.state} {pat.zip}</div>
            <div>Phone: {pat.phone}</div>
          </div>
        </div>
        <div className="border border-border rounded p-2">
          <div className="text-[10px] font-semibold text-foreground mb-1">Ordering Physician</div>
          <div className="space-y-0.5 text-[10px]">
            <div>Name: {prov.name}</div>
            <div>NPI: {prov.npi}</div>
            <div>Facility: {prov.facilityName}</div>
            <div>Address: {prov.address}, {prov.city}, {prov.state} {prov.zip}</div>
          </div>
        </div>
      </div>

      {/* ICD-10 Table */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-foreground mb-1">ICD-10 Codes</div>
        <table className="w-full border-collapse border border-border text-[10px]">
          <tbody>
            {diagnoses.map(d => (
              <tr key={d.code} className="border-b border-border">
                <td className="px-2 py-0.5 font-medium w-16">{d.code}</td>
                <td className="px-2 py-0.5">{d.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signature */}
      <div className="mt-6 max-w-xs">
        {state.signatures?.physician ? (
          <img
            src={state.signatures.physician}
            alt="Provider signature"
            className="h-14 object-contain max-w-[200px] mb-1"
            style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
          />
        ) : (
          <div className="h-14" />
        )}
        <div className="border-b border-foreground mb-1" />
        <div className="text-[10px]">Provider Signature</div>
        <div className="text-[10px] text-muted-foreground">Date: {state.signatures?.physicianDate || formatDate(col.date)}</div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-2 mt-6 text-[9px] text-muted-foreground text-center">
        Firmalab PGx Gene Variation Panel Requisition Form | Lab Director: Dr. Emeka Ajemba | 870 Vine St. Los Angeles, CA 90038 | www.Firmalab.com Phone: 1 (800)799-7248 Email: info@firmalab.com
      </div>
    </div>
  );
}
