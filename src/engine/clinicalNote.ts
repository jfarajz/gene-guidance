import type { OrderState } from "@/types/order";

// Drug → gene safety mapping
const DRUG_GENE_MAP: Record<string, string[]> = {
  paroxetine: ["CYP2D6"],
  fluvoxamine: ["CYP2D6"],
  sertraline: ["CYP2C19"],
  escitalopram: ["CYP2C19"],
  citalopram: ["CYP2C19"],
  amitriptyline: ["CYP2C19", "CYP2D6"],
  doxepin: ["CYP2C19", "CYP2D6"],
  clomipramine: ["CYP2C19", "CYP2D6"],
  imipramine: ["CYP2C19", "CYP2D6"],
  trimipramine: ["CYP2C19", "CYP2D6"],
  vortioxetine: ["CYP2D6"],
  venlafaxine: ["CYP2D6"],
  clopidogrel: ["CYP2C19"],
  codeine: ["CYP2D6"],
  tramadol: ["CYP2D6"],
  ondansetron: ["CYP2D6"],
  "metoprolol tartrate": ["CYP2D6"],
  "metoprolol succinate": ["CYP2D6"],
  metoprolol: ["CYP2D6"],
  carvedilol: ["CYP2D6"],
  propafenone: ["CYP2D6"],
  fluvastatin: ["CYP2C9"],
  meloxicam: ["CYP2C9"],
  celecoxib: ["CYP2C9"],
  piroxicam: ["CYP2C9"],
  warfarin: ["CYP2C9"],
  phenytoin: ["CYP2C9"],
  aripiprazole: ["CYP2D6"],
  brexpiprazole: ["CYP2D6"],
  atomoxetine: ["CYP2D6"],
  nortriptyline: ["CYP2D6"],
  desipramine: ["CYP2D6"],
};

function geneStr(generic: string): string {
  const genes = DRUG_GENE_MAP[generic];
  if (!genes || genes.length === 0) return "";
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
      if (parts.length === 0) {
        parts.push(
          `The patient has ${dx.description} (${dx.code}). The patient is currently taking ${med.generic} ${med.dose} for ${dx.description.toLowerCase()}. I want to use PGx testing for ${geneStr(med.generic)} to evaluate the genetic impact on this ${med.generic === "venlafaxine" || med.generic === "vortioxetine" ? "antidepressant" : "SSRI"} medication and determine if the patient will respond to therapy.`,
        );
      } else {
        parts.push(
          `The patient is also taking ${med.generic} ${med.dose}. I want to use PGx testing for ${geneStr(med.generic)} to evaluate the genetic impact on this medication and determine if the patient will respond to therapy.`,
        );
      }
    }

    if (consideredPsych.length > 0) {
      const medNames = consideredPsych.map((m) => m.generic).join(", ");
      const allGenes = [...new Set(consideredPsych.flatMap((m) => DRUG_GENE_MAP[m.generic] || []))];
      const geneText = allGenes.length === 1 ? `the ${allGenes[0]} gene` : `the genes ${allGenes.join(" and ")}`;
      if (consideredPsych.length === 1) {
        parts.push(
          `I also want to consider alternative antidepressant therapy such as ${medNames}, and to use PGx testing for ${geneText} to see the genetic impact on this medication and if the patient will respond to therapy.`,
        );
      } else {
        parts.push(
          `I also want to consider alternative antidepressant therapy including ${medNames}, and to use PGx testing for ${geneText} to see the genetic impact on these antidepressant medications and if the patient will respond to therapy.`,
        );
      }
    }

    if (parts.length > 0) {
      lines.push(parts.join(" "));
      lines.push("");
    }
  }

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
      for (const med of bbConsidered) {
        parts.push(
          `The patient also has essential primary hypertension (${htnDx.code}) and is being considered for beta blocker therapy with ${med.generic}. I want to use PGx testing for the CYP2D6 gene to investigate the genetic impact on this cardiovascular medication and ensure appropriate blood pressure control.`,
        );
      }
    }

    if (hasClopidogrel) {
      if (hasClopidogrel.type === "prescribed") {
        parts.push(
          `Additionally, the patient is taking clopidogrel ${hasClopidogrel.dose} for cardiovascular protection, which requires CYP2C19 testing to ensure proper activation of this prodrug.`,
        );
      } else {
        parts.push(
          `Additionally, the patient may benefit from antiplatelet therapy with clopidogrel for cardiovascular protection. I want to use PGx testing for the CYP2C19 gene to assess the genetic impact on clopidogrel activation, as this prodrug requires proper metabolism for therapeutic efficacy.`,
        );
      }
    }

    if (opioidMeds.length > 0) {
      const opioidNames = opioidMeds.map((m) => m.generic).join(" and ");
      parts.push(
        `The patient may also require pain management in the future, and CYP2D6 testing will help evaluate the genetic impact on opioid medications such as ${opioidNames}.`,
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
      if (currentStatin) {
        parts.push(
          `The patient has ${hasLipid.description} (${hasLipid.code}) and is currently on ${currentStatin.generic} ${currentStatin.dose}. I want to consider alternative statin therapy such as fluvastatin and use PGx testing for the CYP2C9 gene to evaluate the genetic impact on statin metabolism and determine optimal lipid management therapy.`,
        );
      } else {
        parts.push(
          `The patient has ${hasLipid.description} (${hasLipid.code}). I want to consider alternative statin therapy such as fluvastatin and use PGx testing for the CYP2C9 gene to evaluate the genetic impact on statin metabolism and determine optimal lipid management therapy.`,
        );
      }
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
      `The patient may also require antiemetic therapy with ondansetron, and CYP2D6 testing will help evaluate the genetic impact on this medication.`,
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
