import type { OrderState, Diagnosis, Medication } from '@/types/order';
import { ICD10_DATABASE, MEDICATION_DATABASE } from '@/data/constants';
import { getGeneMatches, getTestedGenes } from '@/engine/qualification';

/**
 * Parse a Firmalab requisition PDF and extract structured order data.
 * Uses pdf.js for text extraction + regex for field parsing.
 */
export async function parseRequisitionPdf(file: File): Promise<Partial<OrderState>> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
  }

  return extractFromText(fullText);
}

function grab(text: string, label: string): string {
  // Match "Label: Value" or "Label : Value" patterns
  const patterns = [
    new RegExp(`${label}\\s*:\\s*([^\\n]+?)(?=\\s+(?:[A-Z][a-z]+\\s*(?:Name|#|Id|No|Type|Code)|$))`, 'i'),
    new RegExp(`${label}\\s*:\\s*(.+?)(?=\\s{2,}|$)`, 'im'),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return '';
}

function parseDate(d: string): string {
  if (!d) return '';
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const m = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  return d;
}

function parseTime(t: string): string {
  if (!t) return '';
  // Convert "01:21:00 PM" to "13:21"
  const m = t.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (m) {
    let h = parseInt(m[1]);
    if (m[4].toUpperCase() === 'PM' && h < 12) h += 12;
    if (m[4].toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${m[2]}`;
  }
  return t;
}

function extractFromText(text: string): Partial<OrderState> {
  // --- Order Number ---
  const orderNumMatch = text.match(/Order\s*#?\s*:\s*(FRP-?\d+)/i);
  const orderNumber = orderNumMatch?.[1] || '';

  // --- Patient ---
  const firstName = grab(text, 'First Name');
  const lastName = grab(text, 'Last Name');
  const dob = parseDate(grab(text, 'DOB'));
  const gender = grab(text, 'Gender');
  const email = grab(text, 'Email(?:\\s*ID)?');
  const phone = grab(text, 'Phone\\s*No');

  // Address parsing - look for patient address fields
  const address1 = grab(text, 'Address 1') || grab(text, 'Address');
  const address2 = grab(text, 'Address 2');
  const city = grab(text, 'City');
  const state = grab(text, 'State');
  const zip = grab(text, 'Zip\\s*Code') || grab(text, 'Zip');

  // --- Provider ---
  const npi = grab(text, 'NPI');
  const physicianName = grab(text, 'Physician(?:\\s*Name)?');
  const facilityName = grab(text, 'Facility(?:\\s*Name)?');

  // Provider address - look near "Ventura" or a second address block
  const provAddressMatch = text.match(/Address\s*:\s*(\d+[^,\n]+?)(?=\s+Address\s+1)/i);
  const provAddress = provAddressMatch?.[1]?.trim() || '';

  // --- Insurance ---
  const insType = grab(text, 'Insurance Type');
  const insProvider = grab(text, 'Insurance Provider');
  const relationship = grab(text, 'Relationship to Insured');
  const groupId = grab(text, 'Group\\s*Id');
  const policyId = grab(text, 'Policy\\s*Id');
  const insPhone = grab(text, 'Insurance Phone\\s*No');

  // --- Collection ---
  const collDate = parseDate(grab(text, 'Date Collected'));
  const collTime = parseTime(grab(text, 'Time of Collection'));
  const specimen = grab(text, 'Specimen Type');

  // --- ICD-10 Codes ---
  const icdMatches = text.matchAll(/([A-Z]\d{2}(?:\.\d{1,4})?)\s*[-–—]\s*([^\n,]+?)(?=\s+[A-Z]\d{2}[\.\s]|\s+MEDICATIONS|\s*$)/gi);
  const diagnoses: Diagnosis[] = [];
  const seenCodes = new Set<string>();
  for (const m of icdMatches) {
    const code = m[1].toUpperCase();
    if (seenCodes.has(code)) continue;
    seenCodes.add(code);
    const dbEntry = ICD10_DATABASE.find(d => d.code === code);
    diagnoses.push({
      code,
      description: dbEntry?.description || m[2].trim(),
      tier: dbEntry?.tier || 'red',
    });
  }

  // --- Medications ---
  const medications: Medication[] = [];
  // Match medication rows: Type | Medication name
  const medSection = text.match(/MEDICATIONS[\s\S]*?(?=Insurance Details|Collection|Tests|MEDICAL NECESSITY|$)/i);
  if (medSection) {
    const medLines = medSection[0].matchAll(/(Prescribed|Considered)\s+([A-Za-z][A-Za-z\s-]+?)(?=\s+(?:Prescribed|Considered|$|\d|Insurance|Collection|Tests))/gi);
    for (const ml of medLines) {
      const type = ml[1].toLowerCase() as 'prescribed' | 'considered';
      const rawName = ml[2].trim().toLowerCase();
      // Look up in MEDICATION_DATABASE
      const dbEntry = MEDICATION_DATABASE.find(
        m => m.generic.toLowerCase() === rawName || m.brand.toLowerCase() === rawName
      );
      const generic = dbEntry?.generic || rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const brand = dbEntry?.brand || '';
      const geneMatches = getGeneMatches(generic);
      const testedGenes = getTestedGenes(generic);

      medications.push({
        id: crypto.randomUUID(),
        generic,
        brand,
        dose: '',
        frequency: '',
        type,
        linkedDiagnosis: '',
        geneMatches,
        isBillable: geneMatches.length > 0,
        isTested: testedGenes.length > 0,
        testedGenes,
      });
    }
  }

  return {
    orderNumber,
    provider: {
      npi,
      name: physicianName,
      facilityName,
      address: provAddress,
      city: '', // Provider city often not separately listed
      state: '',
      zip: '',
    },
    patient: {
      firstName,
      lastName,
      dob,
      gender,
      ethnicity: '',
      address1,
      address2,
      city,
      state,
      zip,
      phone,
      email,
    },
    insurance: {
      type: insType,
      provider: insProvider,
      policyId,
      groupId,
      phoneNumber: insPhone,
      relationshipToInsured: relationship,
    },
    collection: {
      date: collDate,
      time: collTime,
      method: specimen || 'Buccal Swab',
    },
    diagnoses,
    medications,
  };
}
