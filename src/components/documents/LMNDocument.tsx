import type { OrderState } from "@/types/order";
import { BILLABLE_GENES, MEDICATION_DATABASE } from "@/data/constants";

function formatDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return d;
}

function getDrugClass(generic: string): string {
  const entry = MEDICATION_DATABASE.find((m) => m.generic === generic.toLowerCase().trim());
  return entry?.class || "medication";
}

function getBrandName(generic: string): string {
  const entry = MEDICATION_DATABASE.find((m) => m.generic === generic.toLowerCase().trim());
  return entry?.brand || "";
}

// CPIC/FDA evidence summaries for the three Z-coded genes.
// These are stable canonical citations — drug-specific evidence rows can be
// added as a structured table in Sprint 2.
const GENE_EVIDENCE: Record<string, { cpt: string; summary: string }> = {
  CYP2C19: {
    cpt: "81225",
    summary:
      "CPIC Level A guidelines apply to CYP2C19 phenotype-guided dosing for tricyclic antidepressants, SSRIs, voriconazole, clopidogrel, and proton pump inhibitors.",
  },
  CYP2D6: {
    cpt: "81226",
    summary:
      "CPIC Level A guidelines apply to CYP2D6 phenotype-guided dosing for tricyclic antidepressants, ondansetron, atomoxetine, codeine, tramadol, and tetrabenazine; FDA labels include CYP2D6 information for additional substrates.",
  },
  CYP2C9: {
    cpt: "81227",
    summary:
      "CPIC Level A guidelines apply to CYP2C9 phenotype-guided dosing for warfarin, NSAIDs (celecoxib, meloxicam, piroxicam), and phenytoin.",
  },
};

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
      {/* Body */}
      <div className="space-y-3">
        <p className="font-semibold text-foreground">DEAR CLAIMS SPECIALIST:</p>

        <p>
          This letter requests coverage of pharmacogenomic genotyping for the specific genes listed below for the
          patient identified in this letter. The test will be performed by Firmalab Bio-Diagnostics, a CLIA-certified
          high-complexity clinical laboratory (CLIA# 05D0992853, NPI# 1922459577).
        </p>

        {/* Tests requested — only billable Z-coded genes for this order */}
        <div>
          <p className="font-medium text-foreground">Tests Requested:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            {state.qualification.billableCPTs.map((cpt) => {
              const gene = Object.entries(BILLABLE_GENES).find(([, g]) => g.cpt === cpt)?.[0];
              return (
                <li key={cpt}>
                  CPT {cpt} — {gene} genotype
                </li>
              );
            })}
          </ul>
        </div>

        {/* Patient-specific drug-gene rationale */}
        <div>
          <p className="font-medium text-foreground">Drug-Gene Rationale (Patient-Specific):</p>
          {state.medications
            .filter((m) => m.isBillable && m.geneMatches.length > 0)
            .map((med) => {
              const drugClass = getDrugClass(med.generic);
              const brand = getBrandName(med.generic);
              const linkedDx = state.diagnoses.find((d) => d.code === med.linkedDiagnosis);
              const dxText = linkedDx ? ` for ${linkedDx.description.toLowerCase()} (${linkedDx.code})` : "";
              const geneList = med.geneMatches.map((g) => g.gene).join(" and ");
              return (
                <p key={med.id} className="mt-1">
                  <span className="font-medium">
                    {med.generic}
                    {brand ? ` (${brand})` : ""}
                  </span>{" "}
                  — {drugClass}
                  {med.dose ? `, ${med.dose}` : ""}
                  {dxText}. PGx testing of {geneList} is medically necessary to guide dosing and agent selection for
                  this patient per CPIC guidelines and FDA labeling.
                </p>
              );
            })}
        </div>

        {/* Per-gene evidence summary — only for genes actually being billed */}
        <div>
          <p className="font-medium text-foreground">Evidence for Requested Genes:</p>
          {state.qualification.billableCPTs.map((cpt) => {
            const gene = Object.entries(BILLABLE_GENES).find(([, g]) => g.cpt === cpt)?.[0];
            if (!gene || !GENE_EVIDENCE[gene]) return null;
            return (
              <p key={cpt} className="mt-1">
                <span className="font-semibold">
                  {gene} ({cpt}):
                </span>{" "}
                {GENE_EVIDENCE[gene].summary}
              </p>
            );
          })}
        </div>

        <p>
          Pharmacogenomic genotyping for the genes above will be used by the ordering provider to guide therapeutic
          decisions for the medications identified, in accordance with CPIC guidelines and FDA labeling. The test
          ordered consists only of the specific Z-coded gene assays listed above and is not a combinatorial multi-gene
          algorithmic panel.
        </p>

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
            <div>
              Name: {pat.firstName} {pat.lastName}
            </div>
            <div>DOB: {formatDate(pat.dob)}</div>
            <div>Gender: {pat.gender}</div>
            <div>
              Address: {pat.address1}, {pat.city}, {pat.state} {pat.zip}
            </div>
            <div>Phone: {pat.phone}</div>
          </div>
        </div>
        <div className="border border-border rounded p-2">
          <div className="text-[10px] font-semibold text-foreground mb-1">Ordering Physician</div>
          <div className="space-y-0.5 text-[10px]">
            <div>Name: {prov.name}</div>
            <div>NPI: {prov.npi}</div>
            <div>Facility: {prov.facilityName}</div>
            <div>
              Address: {prov.address}, {prov.city}, {prov.state} {prov.zip}
            </div>
          </div>
        </div>
      </div>

      {/* ICD-10 Table */}
      <div className="mb-4">
        <div className="text-[10px] font-semibold text-foreground mb-1">ICD-10 Codes</div>
        <table className="w-full border-collapse border border-border text-[10px]">
          <tbody>
            {diagnoses.map((d) => (
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
            style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
          />
        ) : (
          <div className="h-14" />
        )}
        <div className="border-b border-foreground mb-1" />
        <div className="text-[10px]">Provider Signature</div>
        <div className="text-[10px] text-muted-foreground">
          Date: {state.signatures?.physicianDate || formatDate(col.date)}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-2 mt-6 text-[9px] text-muted-foreground text-center">
        Firmalab PGx Gene Variation Panel Requisition Form | Lab Director: Dr. Emeka Ajemba | 870 Vine St. Los Angeles,
        CA 90038 | www.Firmalab.com Phone: 1 (800)799-7248 Email: info@firmalab.com
      </div>
    </div>
  );
}
