import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { OrderState, Diagnosis, Medication } from "@/types/order";
import { qualifyOrder } from "@/engine/qualification";

const emptyState: OrderState = {
  currentStep: 0,
  orderNumber: "",
  provider: { npi: "", name: "", facilityName: "", address: "", city: "", state: "", zip: "" },
  patient: {
    firstName: "",
    lastName: "",
    dob: "",
    gender: "",
    ethnicity: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
  },
  insurance: { type: "", provider: "", policyId: "", groupId: "", phoneNumber: "", relationshipToInsured: "" },
  collection: { date: "", time: "", method: "" },
  diagnoses: [],
  medications: [],
  qualification: {
    genes: {
      CYP2C19: { qualified: false, cpt: "81225", medications: [] },
      CYP2D6: { qualified: false, cpt: "81226", medications: [] },
      CYP2C9: { qualified: false, cpt: "81227", medications: [] },
    },
    billableCPTs: [],
    box19: { text: "", charCount: 0, overLimit: false },
    panelEligible: false,
    nonBillableMeds: [],
    suggestions: [],
  },
  signatures: { physician: "", patient: "", physicianDate: "", patientDate: "" },
};

interface OrderContextType {
  order: OrderState;
  setStep: (step: number) => void;
  updateProvider: (p: OrderState["provider"]) => void;
  updatePatient: (p: OrderState["patient"]) => void;
  updateInsurance: (i: OrderState["insurance"]) => void;
  updateCollection: (c: OrderState["collection"]) => void;
  setDiagnoses: (d: Diagnosis[]) => void;
  setMedications: (m: Medication[]) => void;
  addMedication: (m: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  removeMedication: (id: string) => void;
  updateSignatures: (s: Partial<OrderState["signatures"]>) => void;
  loadDemo: (state: OrderState) => void;
  resetOrder: () => void;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [order, setOrder] = useState<OrderState>(emptyState);

  const requalify = useCallback((meds: Medication[], diags: Diagnosis[]) => qualifyOrder(meds, diags), []);

  const setStep = (step: number) => setOrder((prev) => ({ ...prev, currentStep: step }));

  const updateProvider = (provider: OrderState["provider"]) => setOrder((prev) => ({ ...prev, provider }));
  const updatePatient = (patient: OrderState["patient"]) => setOrder((prev) => ({ ...prev, patient }));
  const updateInsurance = (insurance: OrderState["insurance"]) => setOrder((prev) => ({ ...prev, insurance }));
  const updateCollection = (collection: OrderState["collection"]) => setOrder((prev) => ({ ...prev, collection }));

  const setDiagnoses = (diagnoses: Diagnosis[]) =>
    setOrder((prev) => ({ ...prev, diagnoses, qualification: requalify(prev.medications, diagnoses) }));

  const setMedications = (medications: Medication[]) =>
    setOrder((prev) => ({ ...prev, medications, qualification: requalify(medications, prev.diagnoses) }));

  const addMedication = (med: Medication) =>
    setOrder((prev) => {
      const meds = [...prev.medications, med];
      return { ...prev, medications: meds, qualification: requalify(meds, prev.diagnoses) };
    });

  const updateMedication = (id: string, updates: Partial<Medication>) =>
    setOrder((prev) => {
      const meds = prev.medications.map((m) => (m.id === id ? { ...m, ...updates } : m));
      return { ...prev, medications: meds, qualification: requalify(meds, prev.diagnoses) };
    });

  const removeMedication = (id: string) =>
    setOrder((prev) => {
      const meds = prev.medications.filter((m) => m.id !== id);
      return { ...prev, medications: meds, qualification: requalify(meds, prev.diagnoses) };
    });

  const updateSignatures = (sigs: Partial<OrderState["signatures"]>) =>
    setOrder((prev) => ({ ...prev, signatures: { ...prev.signatures, ...sigs } }));

  const loadDemo = (state: OrderState) => setOrder(state);
  const resetOrder = () => setOrder(emptyState);

  return (
    <OrderContext.Provider
      value={{
        order,
        setStep,
        updateProvider,
        updatePatient,
        updateInsurance,
        updateCollection,
        setDiagnoses,
        setMedications,
        addMedication,
        updateMedication,
        removeMedication,
        updateSignatures,
        loadDemo,
        resetOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrder must be used within OrderProvider");
  return ctx;
}
