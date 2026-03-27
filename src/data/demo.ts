import type { OrderState } from "@/types/order";
import { getGeneMatches } from "@/engine/qualification";
import { qualifyOrder } from "@/engine/qualification";

function makeMed(
  id: string,
  generic: string,
  brand: string,
  dose: string,
  frequency: string,
  type: "prescribed" | "considered",
  linkedDiagnosis: string,
) {
  const geneMatches = getGeneMatches(generic);
  return {
    id,
    generic,
    brand,
    dose,
    frequency,
    type,
    linkedDiagnosis,
    geneMatches,
    isBillable: geneMatches.length > 0,
  };
}

const sharedBase: Omit<OrderState, "medications" | "qualification"> = {
  currentStep: 2,
  orderNumber: "",
  provider: {
    npi: "1528419710",
    name: "Dr. Saeid Karandish",
    facilityName: "Dr. Saeid Karandish",
    address: "16661 Ventura Boulevard Suite 313",
    city: "Encino",
    state: "CA",
    zip: "91436",
  },
  patient: {
    firstName: "Fatemeh",
    lastName: "K. Tahmasb",
    dob: "1939-12-14",
    gender: "Female",
    ethnicity: "Other",
    address1: "20528 Ventura Blvd Apt #110",
    address2: "",
    city: "Woodland Hills",
    state: "CA",
    zip: "91364",
    phone: "(516) 407-0043",
    email: "newderm2023@gmail.com",
  },
  insurance: {
    type: "Medicare",
    provider: "Medicare Part A and B",
    policyId: "6NE6J27AV78",
    groupId: "",
    phoneNumber: "",
    relationshipToInsured: "Self",
  },
  signatures: { physician: '', patient: '', physicianDate: '', patientDate: '' },
  collection: {
    date: "2025-06-20",
    time: "14:00",
    method: "Buccal Swab",
  },
  diagnoses: [
    { code: "F41.1", description: "Generalized anxiety disorder", tier: "green" },
    { code: "E78.2", description: "Mixed hyperlipidemia", tier: "yellow" },
    { code: "I10", description: "Essential (primary) hypertension", tier: "yellow" },
  ],
};

const completeMeds = [
  makeMed("m1", "empagliflozin", "Jardiance", "10mg", "daily", "prescribed", "E78.2"),
  makeMed("m2", "escitalopram", "Lexapro", "10mg", "daily", "prescribed", "F41.1"),
  makeMed("m3", "losartan", "Cozaar", "100mg", "daily", "prescribed", "I10"),
  makeMed("m4", "hydrochlorothiazide", "Microzide", "12.5mg", "daily", "prescribed", "I10"),
  makeMed("m5", "triazolam", "Halcion", "0.25mg", "at bedtime", "prescribed", "F41.1"),
  makeMed("m6", "clonazepam", "Klonopin", "0.25mg", "BID", "prescribed", "F41.1"),
  makeMed("m7", "clopidogrel", "Plavix", "75mg", "daily", "prescribed", "I10"),
  makeMed("m8", "meloxicam", "Mobic", "15mg", "daily", "prescribed", "I10"),
  makeMed("m9", "codeine", "Codeine", "30mg", "PRN", "considered", "F41.1"),
  makeMed("m10", "tramadol", "Ultram", "50mg", "PRN", "considered", "F41.1"),
  makeMed("m11", "sertraline", "Zoloft", "50mg", "daily", "considered", "F41.1"),
  makeMed("m12", "metoprolol succinate", "Toprol XL", "25mg", "daily", "considered", "I10"),
  makeMed("m13", "ondansetron", "Zofran", "4mg", "PRN", "considered", "F41.1"),
];

export const DEMO_COMPLETE: OrderState = {
  ...sharedBase,
  medications: completeMeds,
  qualification: qualifyOrder(completeMeds, sharedBase.diagnoses),
};

const emptyMeds: OrderState["medications"] = [];
export const DEMO_INTERACTIVE: OrderState = {
  ...sharedBase,
  medications: emptyMeds,
  qualification: qualifyOrder(emptyMeds, sharedBase.diagnoses),
};
