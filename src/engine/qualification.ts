import { BILLABLE_GENES } from '@/data/constants';
import type { GeneMatch, Medication, Diagnosis, QualificationResult, Suggestion } from '@/types/order';

export function getGeneMatches(genericName: string): GeneMatch[] {
  const name = genericName.toLowerCase().trim();
  const matches: GeneMatch[] = [];
  for (const [gene, data] of Object.entries(BILLABLE_GENES)) {
    if (data.medications.some(med => name === med || name.includes(med) || med.includes(name))) {
      matches.push({ gene: gene as GeneMatch['gene'], cpt: data.cpt as GeneMatch['cpt'] });
    }
  }
  return matches;
}

export function qualifyOrder(medications: Medication[], diagnoses: Diagnosis[]): QualificationResult {
  const genes = {
    CYP2C19: { qualified: false, cpt: '81225' as const, medications: [] as string[] },
    CYP2D6: { qualified: false, cpt: '81226' as const, medications: [] as string[] },
    CYP2C9: { qualified: false, cpt: '81227' as const, medications: [] as string[] },
  };

  const billableMedNames: string[] = [];
  const nonBillableMeds: string[] = [];

  for (const med of medications) {
    if (med.geneMatches.length > 0) {
      billableMedNames.push(med.generic);
      for (const match of med.geneMatches) {
        const gene = genes[match.gene];
        gene.qualified = true;
        if (!gene.medications.includes(med.generic)) {
          gene.medications.push(med.generic);
        }
      }
    } else {
      nonBillableMeds.push(med.generic);
    }
  }

  const billableCPTs = Object.values(genes).filter(g => g.qualified).map(g => g.cpt).sort();

  const box19Text = billableMedNames.join('/');
  const box19 = { text: box19Text, charCount: box19Text.length, overLimit: box19Text.length > 80 };

  const qualifiedCount = Object.values(genes).filter(g => g.qualified).length;
  const panelEligible = qualifiedCount >= 2;

  const suggestions: Suggestion[] = [];
  const hasPsych = diagnoses.some(d => d.code.startsWith('F'));
  const hasHTN = diagnoses.some(d => d.code === 'I10' || d.code.startsWith('I1'));
  const hasLipid = diagnoses.some(d => d.code.startsWith('E78'));
  const hasPain = diagnoses.some(d => d.code === 'G89.29' || d.code.startsWith('M'));

  if (!genes.CYP2C19.qualified) {
    const meds: { generic: string; reason: string }[] = [];
    if (hasPsych) meds.push({ generic: "sertraline", reason: "for anxiety/depression" }, { generic: "escitalopram", reason: "for anxiety/depression" });
    if (hasHTN || hasLipid) meds.push({ generic: "clopidogrel", reason: "for cardiovascular protection" });
    if (meds.length === 0) meds.push({ generic: "clopidogrel", reason: "for cardiovascular protection" }, { generic: "sertraline", reason: "if considering antidepressant therapy" });
    suggestions.push({ gene: "CYP2C19", cpt: "81225", message: "CYP2C19 (81225) not yet covered", medications: meds });
  }

  if (!genes.CYP2D6.qualified) {
    const meds: { generic: string; reason: string }[] = [];
    if (hasHTN) meds.push({ generic: "metoprolol tartrate", reason: "for hypertension" }, { generic: "metoprolol succinate", reason: "for hypertension" });
    if (hasPain) meds.push({ generic: "codeine", reason: "for pain management" }, { generic: "tramadol", reason: "for pain management" });
    if (meds.length === 0) meds.push({ generic: "metoprolol tartrate", reason: "if considering beta blocker therapy" }, { generic: "ondansetron", reason: "if considering antiemetic therapy" });
    suggestions.push({ gene: "CYP2D6", cpt: "81226", message: "CYP2D6 (81226) not yet covered", medications: meds });
  }

  if (!genes.CYP2C9.qualified) {
    const meds: { generic: string; reason: string }[] = [];
    if (hasLipid) meds.push({ generic: "fluvastatin", reason: "as alternative statin therapy" });
    if (hasPain) meds.push({ generic: "meloxicam", reason: "for anti-inflammatory therapy" }, { generic: "celecoxib", reason: "for anti-inflammatory therapy" });
    if (meds.length === 0) meds.push({ generic: "fluvastatin", reason: "if considering statin therapy" }, { generic: "meloxicam", reason: "if considering NSAID therapy" });
    suggestions.push({ gene: "CYP2C9", cpt: "81227", message: "CYP2C9 (81227) not yet covered", medications: meds });
  }

  return { genes, billableCPTs, box19, panelEligible, nonBillableMeds, suggestions };
}
