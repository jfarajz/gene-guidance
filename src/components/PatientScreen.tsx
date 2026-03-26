import { useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const ETHNICITIES = ['African American', 'Asian', 'Caucasian', 'Hispanic', 'Other'];

function PillRadio({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
              selected
                ? 'bg-accent-light border-primary text-primary font-medium'
                : 'bg-surface border-border text-text-secondary hover:border-border-hover'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const inputCls = 'w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';
const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

export function PatientScreen() {
  const { order, updatePatient, updateInsurance, updateCollection, setStep } = useOrder();
  const pat = order.patient;
  const ins = order.insurance;
  const col = order.collection;

  // Default collection date/time
  useEffect(() => {
    if (!col.date || !col.time) {
      const now = new Date();
      const date = col.date || now.toISOString().split('T')[0];
      const time = col.time || now.toTimeString().slice(0, 5);
      const method = col.method || 'Buccal Swab';
      updateCollection({ date, time, method });
    }
  }, []);

  // Auto-set insurance provider for Medicare
  useEffect(() => {
    if (ins.type === 'Medicare' && ins.provider !== 'Medicare Part A and B') {
      updateInsurance({ ...ins, provider: 'Medicare Part A and B' });
    }
  }, [ins.type]);

  const patientValid = pat.firstName && pat.lastName && pat.dob && pat.gender && pat.address1 && pat.city && pat.state && pat.zip && pat.phone && pat.email;
  const insValid = ins.type && ins.relationshipToInsured && ins.policyId;
  const colValid = col.date && col.time && col.method;
  const canContinue = patientValid && insValid && colValid;

  return (
    <div className="py-8 flex flex-col gap-6">
      {/* Card 1: Patient Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Patient information</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>First name <span className="text-destructive">*</span></label>
              <input type="text" value={pat.firstName} onChange={e => updatePatient({ ...pat, firstName: e.target.value })} placeholder="First name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Last name <span className="text-destructive">*</span></label>
              <input type="text" value={pat.lastName} onChange={e => updatePatient({ ...pat, lastName: e.target.value })} placeholder="Last name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date of birth <span className="text-destructive">*</span></label>
              <input type="date" value={pat.dob} onChange={e => updatePatient({ ...pat, dob: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Gender <span className="text-destructive">*</span></label>
              <PillRadio options={['Male', 'Female']} value={pat.gender} onChange={v => updatePatient({ ...pat, gender: v })} />
            </div>
            <div>
              <label className={labelCls}>Ethnicity</label>
              <select value={pat.ethnicity} onChange={e => updatePatient({ ...pat, ethnicity: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">Select...</option>
                {ETHNICITIES.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>Address 1 <span className="text-destructive">*</span></label>
              <input type="text" value={pat.address1} onChange={e => updatePatient({ ...pat, address1: e.target.value })} placeholder="Street address" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Address 2</label>
              <input type="text" value={pat.address2} onChange={e => updatePatient({ ...pat, address2: e.target.value })} placeholder="Apt, Suite, etc." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City <span className="text-destructive">*</span></label>
              <input type="text" value={pat.city} onChange={e => updatePatient({ ...pat, city: e.target.value })} placeholder="City" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State <span className="text-destructive">*</span></label>
              <select value={pat.state} onChange={e => updatePatient({ ...pat, state: e.target.value })} className={`${inputCls} appearance-none cursor-pointer`}>
                <option value="">Select...</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Zip <span className="text-destructive">*</span></label>
              <input type="text" value={pat.zip} onChange={e => updatePatient({ ...pat, zip: e.target.value })} placeholder="Zip code" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone <span className="text-destructive">*</span></label>
              <input type="tel" value={pat.phone} onChange={e => updatePatient({ ...pat, phone: e.target.value })} placeholder="(555) 555-0000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-destructive">*</span></label>
              <input type="email" value={pat.email} onChange={e => updatePatient({ ...pat, email: e.target.value })} placeholder="patient@email.com" className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Insurance Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Insurance information</h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Insurance type <span className="text-destructive">*</span></label>
            <PillRadio options={['Commercial', 'Medicare', 'Medicaid', 'Other Ins.']} value={ins.type} onChange={v => updateInsurance({ ...ins, type: v })} />
          </div>
          <div>
            <label className={labelCls}>Relationship to insured <span className="text-destructive">*</span></label>
            <PillRadio options={['Self', 'Spouse', 'Dependent', 'Other']} value={ins.relationshipToInsured} onChange={v => updateInsurance({ ...ins, relationshipToInsured: v })} />
          </div>
          <div>
            <label className={labelCls}>Primary insurance provider</label>
            <input type="text" value={ins.provider} onChange={e => updateInsurance({ ...ins, provider: e.target.value })} placeholder="Insurance provider" className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Policy ID <span className="text-destructive">*</span></label>
              <input type="text" value={ins.policyId} onChange={e => updateInsurance({ ...ins, policyId: e.target.value })} placeholder="Policy ID" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Group ID</label>
              <input type="text" value={ins.groupId} onChange={e => updateInsurance({ ...ins, groupId: e.target.value })} placeholder="Group ID" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Insurance phone</label>
              <input type="tel" value={ins.phoneNumber} onChange={e => updateInsurance({ ...ins, phoneNumber: e.target.value })} placeholder="Phone number" className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Specimen Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Specimen information</h3>
        <div className="grid grid-cols-3 gap-4 items-end">
          <div>
            <label className={labelCls}>Date of collection <span className="text-destructive">*</span></label>
            <input type="date" value={col.date} onChange={e => updateCollection({ ...col, date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Time of collection <span className="text-destructive">*</span></label>
            <input type="time" value={col.time} onChange={e => updateCollection({ ...col, time: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Collection method <span className="text-destructive">*</span></label>
            <PillRadio options={['Buccal Swab', 'Blood']} value={col.method} onChange={v => updateCollection({ ...col, method: v })} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-2">
        <button
          onClick={() => setStep(0)}
          className="h-10 px-6 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          ← Back
        </button>
        <button
          disabled={!canContinue}
          onClick={() => setStep(2)}
          className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}
