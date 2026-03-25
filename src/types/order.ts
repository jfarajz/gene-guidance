export type CoverageTier = 'green' | 'yellow' | 'red';

export interface Diagnosis {
  code: string;
  description: string;
  tier: CoverageTier;
}

export interface GeneMatch {
  gene: 'CYP2C19' | 'CYP2D6' | 'CYP2C9';
  cpt: '81225' | '81226' | '81227';
}

export interface Medication {
  id: string;
  generic: string;
  brand: string;
  dose: string;
  frequency: string;
  type: 'prescribed' | 'considered';
  linkedDiagnosis: string;
  geneMatches: GeneMatch[];
  isBillable: boolean;
}

export interface QualificationResult {
  genes: {
    CYP2C19: { qualified: boolean; cpt: '81225'; medications: string[] };
    CYP2D6: { qualified: boolean; cpt: '81226'; medications: string[] };
    CYP2C9: { qualified: boolean; cpt: '81227'; medications: string[] };
  };
  billableCPTs: string[];
  box19: { text: string; charCount: number; overLimit: boolean };
  panelEligible: boolean;
  nonBillableMeds: string[];
  suggestions: Suggestion[];
}

export interface Suggestion {
  gene: 'CYP2C19' | 'CYP2D6' | 'CYP2C9';
  cpt: string;
  message: string;
  medications: { generic: string; reason: string }[];
}

export interface ProviderInfo {
  npi: string;
  name: string;
  facilityName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface PatientInfo {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  ethnicity: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
}

export interface InsuranceInfo {
  type: string;
  provider: string;
  policyId: string;
  groupId: string;
  phoneNumber: string;
  relationshipToInsured: string;
}

export interface CollectionInfo {
  date: string;
  time: string;
  method: string;
}

export interface OrderState {
  currentStep: number;
  provider: ProviderInfo;
  patient: PatientInfo;
  insurance: InsuranceInfo;
  collection: CollectionInfo;
  diagnoses: Diagnosis[];
  medications: Medication[];
  qualification: QualificationResult;
}
