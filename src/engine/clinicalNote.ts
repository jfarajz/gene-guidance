import type { OrderState } from "@/types/order";
import { BILLABLE_GENES, MEDICATION_DATABASE } from "@/data/constants";

// Derive drug → gene mapping from the canonical BILLABLE_GENES source-of-truth.
// This ensures the clinical note generator and the qualification engine always
// agree on drug-gene pairings.
function getGenesForDrug(generic: string): string[] {
  const name = generic.toLowerCase().trim();
  const genes: string[] = [];
  for (const [gene, data] of Object.entries(BILLABLE_GENES)) {
    if (data.medications.some((m) => m === name)) {
      genes.push(gene);
    }
  }
  return genes;
}

function getDrugClass(generic: string): string {
  const entry = MEDICATION_DATABASE.find((m) => m.generic === generic.toLowerCase().trim());
  return entry?.class || "medication";
}

function geneStr(generic: string): string {
  const genes = getGenesForDrug(generic);
  if (genes.length === 0) return "";
  if (genes.length === 1) return `the ${genes[0]} gene`;
  return `the ${genes.join(" and ")} genes`;
}
const PSYCH_GENERICS = new Set([
  "citalopram",
  "escitalopram",
  "sertraline",
  "paroxetine",
  "fluvoxamine",
  "venlafaxine",
  "vortioxetine",
  "amitriptyline",
  "clomipramine",
  "doxepin",
  "imipramine",
  "trimipramine",
  "nortriptyline",
  "desipramine",
  "aripiprazole",
  "brexpiprazole",
  "clozapine",
  "iloperidone",
  "perphenazine",
  "pimozide",
  "thioridazine",
]);
const BETA_BLOCKERS = new Set([
  "metoprolol tartrate",
  "metoprolol succinate",
  "metoprolol",
  "carvedilol",
  "propafenone",
]);
const STATINS = new Set([
  "fluvastatin",
  "rosuvastatin",
  "atorvastatin",
  "simvastatin",
  "lovastatin",
  "pitavastatin",
  "pravastatin",
]);
const OPIOIDS = new Set(["codeine", "tramadol", "oliceridine"]);
const NSAIDS = new Set(["meloxicam", "celecoxib", "piroxicam"]);
const NON_BILLABLE = new Set([
  "rosuvastatin",
  "atorvastatin",
  "simvastatin",
  "lovastatin",
  "pitavastatin",
  "pravastatin",
  "losartan",
  "lisinopril",
  "enalapril",
  "ramipril",
  "amlodipine",
  "hydrochlorothiazide",
  "triazolam",
  "clonazepam",
  "lorazepam",
  "empagliflozin",
  "metformin",
  "glyburide",
  "dapagliflozin",
  "levothyroxine",
  "alendronate",
  "aspirin",
  "apixaban",
  "trazodone",
  "bupropion",
  "fluoxetine",
  "duloxetine",
  "donepezil",
  "propranolol",
  "atenolol",
  "hydrocortisone",
]);

function formatDate(d: string): string {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
  return d;
}

export function generateClinicalNote(state: OrderState): string {
  const { patient, provider, diagnoses, medications, qualification, collection } = state;

  const billableMeds = medications.filter((m) => m.isBillable);
  const lines: string[] = [];

  // Header
  lines.push("PGx Documentation");
  lines.push("");
  lines.push(`Patient: ${patient.firstName} ${patient.lastName}`);
  lines.push(`ICD10 Codes: ${diagnoses.map((d) => `${d.code} (${d.description})`).join(", ")}`);
  lines.push("");
  lines.push(`DATE: ${formatDate(collection.date)}`);
  lines.push("");

  const hasPsychDx = diagnoses.some((d) => d.code.startsWith("F"));
  const hasHTN = diagnoses.some((d) => d.code === "I10");
  const hasLipid = diagnoses.find((d) => d.code.startsWith("E78"));
  const hasClopidogrel = billableMeds.find((m) => m.generic === "clopidogrel");
  const nsaidMeds = billableMeds.filter((m) => NSAIDS.has(m.generic));
  const opioidMeds = billableMeds.filter((m) => OPIOIDS.has(m.generic));
  const ondansetron = billableMeds.find((m) => m.generic === "ondansetron");

  // ── Paragraph 1: Psych (CYP2C19-centric) ──
  if (hasPsychDx) {
    const psychDx = diagnoses.filter((d) => d.code.startsWith("F"));
    const prescribedPsych = billableMeds.filter((m) => PSYCH_GENERICS.has(m.generic) && m.type === "prescribed");
    const consideredPsych = billableMeds.filter((m) => PSYCH_GENERICS.has(m.generic) && m.type === "considered");

    const parts: string[] = [];

    for (const med of prescribedPsych) {
      const dx = psychDx.find((d) => d.code === med.linkedDiagnosis) || psychDx[0];
      const drugClass = getDrugClass(med.generic).toLowerCase();
      if (parts.length === 0) {
        parts.push(
          `The patient has ${dx.description} (${dx.code}). The patient is currently taking ${med.generic} ${med.dose} for ${dx.description.toLowerCase()}. I want to use PGx testing for ${geneStr(med.generic)} to evaluate the genetic impact on this ${drugClass} and determine if the patient will respond to therapy.`,
        );
      } else {
        parts.push(
          `The patient is also taking ${med.generic} ${med.dose} (${drugClass}). I want to use PGx testing for ${geneStr(med.generic)} to evaluate the genetic impact on this medication and determine if the patient will respond to therapy.`,
        );
      }
    }

// Sprint 1: removed "considered" alternatives generation. Documents must
    // describe only medications actually present in the patient's chart, not
    // hypothetical alternatives. If the provider wants alternatives mentioned,
    // they should be added to the chart as prescribed first.

  // ── Paragraph 2: Cardio + Pain (CYP2D6-centric) ──
  {
    const parts: string[] = [];

    if (hasHTN) {
      const htnDx = diagnoses.find((d) => d.code === "I10")!;
      const bbPrescribed = billableMeds.filter((m) => BETA_BLOCKERS.has(m.generic) && m.type === "prescribed");
      const bbConsidered = billableMeds.filter((m) => BETA_BLOCKERS.has(m.generic) && m.type === "considered");

      for (const med of bbPrescribed) {
        parts.push(
          `The patient also has essential primary hypertension (${htnDx.code}) and is taking ${med.generic} ${med.dose}. I want to use PGx testing for the CYP2D6 gene to investigate the genetic impact on this cardiovascular medication and ensure appropriate blood pressure control.`,
        );
      }
// Sprint 1: removed "considered" beta-blocker therapy prose.
    }

    if (hasClopidogrel) {
      if (hasClopidogrel.type === "prescribed") {
        parts.push(
          `Additionally, the patient is taking clopidogrel ${hasClopidogrel.dose} for cardiovascular protection, which requires CYP2C19 testing to ensure proper activation of this prodrug.`,
        );
      }
      // Sprint 1: removed "may benefit from" clopidogrel prose for considered case.

    if (opioidMeds.length > 0) {
      const opioidNames = opioidMeds.map((m) => `${m.generic} ${m.dose}`).join(" and ");
      parts.push(
        `The patient is taking ${opioidNames} for pain management. CYP2D6 testing evaluates the genetic impact on opioid metabolism for these medications.`,
      );
    }

    if (parts.length > 0) {
      lines.push(parts.join(" "));
      lines.push("");
    }
  }

  // ── Paragraph 3: Lipids + NSAID (CYP2C9-centric) ──
  {
    const parts: string[] = [];

    if (hasLipid) {
      const currentStatin = medications.find((m) => STATINS.has(m.generic) && m.type === "prescribed");
      if (currentStatin && currentStatin.generic === "fluvastatin") {
        parts.push(
          `The patient has ${hasLipid.description} (${hasLipid.code}) and is currently on ${currentStatin.generic} ${currentStatin.dose}. PGx testing for the CYP2C9 gene evaluates the genetic impact on fluvastatin metabolism for this patient.`,
        );
      }
      // Sprint 1: removed prose suggesting fluvastatin as an alternative when
      // the patient is not actually taking it. Statin PGx is only ordered when
      // a CYP2C9-relevant statin is in the chart.
    }

    for (const med of nsaidMeds) {
      parts.push(
        `The patient is also taking ${med.generic} ${med.dose} for pain and inflammation management. I want to use PGx testing for the CYP2C9 gene to assess the genetic impact on this NSAID medication and ensure safe and effective therapy.`,
      );
    }

    if (parts.length > 0) {
      lines.push(parts.join(" "));
      lines.push("");
    }
  }

  // ── Paragraph 4: Ondansetron (brief) ──
  if (ondansetron) {
    lines.push(
      `The patient is currently taking ondansetron ${ondansetron.dose} for nausea/emesis. CYP2D6 testing evaluates the genetic impact on ondansetron metabolism per CPIC guideline.`,
    );
    lines.push("");
  }

  // Footer
  const cpts = qualification.billableCPTs.join("/");
  const dxCodes = diagnoses.map((d) => d.code).join(", ");

  lines.push(`CPT Code: ${cpts}`);
  lines.push(`DX Codes: ${dxCodes}`);
  lines.push("");
  lines.push("_______________________________________________");
  lines.push("");
  lines.push(`DR. ${provider.name.replace(/^Dr\.\s*/i, "").toUpperCase()}, MD`);
  lines.push(`${provider.address},`);
  lines.push(`${provider.city}, ${provider.state} ${provider.zip}`);

  return lines.join("\n");
}
