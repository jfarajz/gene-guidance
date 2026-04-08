import { useState, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Check } from 'lucide-react';
import { PdfDropZone } from '@/components/PdfDropZone';

const NPI_LOOKUP: Record<string, { name: string; facilityName: string; address: string; city: string; state: string; zip: string }> = {
  '1528419710': {
    name: 'Dr. Saeid Karandish',
    facilityName: 'Dr. Saeid Karandish',
    address: '16661 Ventura Boulevard Suite 313',
    city: 'Encino',
    state: 'CA',
    zip: '91436',
  },
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export function ProviderScreen() {
  const { order, updateProvider, setStep } = useOrder();
  const [npiVerified, setNpiVerified] = useState(false);
  const [flashFields, setFlashFields] = useState(false);
  const p = order.provider;

  useEffect(() => {
    if (p.npi && NPI_LOOKUP[p.npi]) setNpiVerified(true);
  }, []);

  const handleNpiLookup = () => {
    const match = NPI_LOOKUP[p.npi];
    if (match) {
      updateProvider({ ...p, ...match });
      setNpiVerified(true);
      setFlashFields(true);
      setTimeout(() => setFlashFields(false), 800);
    } else {
      setNpiVerified(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) setStep(1);
  };

  const isValid = p.npi && p.name && p.facilityName && p.address && p.city && p.state && p.zip;

  const inputCls = (flash = true) =>
    `w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
      flash && flashFields ? 'ring-2 ring-tier-green bg-tier-green-bg' : ''
    }`;

  return (
    <div className="py-8" onKeyDown={handleKeyDown}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground">PGx Smart Order</h1>
        <p className="text-sm text-muted-foreground mt-1">Order a pharmacogenomic test and generate all required documentation in under 3 minutes.</p>
      </div>
      <div className="max-w-lg mx-auto bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Provider information</h2>

        {/* NPI */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-foreground mb-1.5">NPI number <span className="text-destructive">*</span></label>
          <div className="relative">
            <input
              type="text"
              value={p.npi}
              onChange={e => { updateProvider({ ...p, npi: e.target.value }); setNpiVerified(false); }}
              onBlur={handleNpiLookup}
              onKeyDown={e => e.key === 'Enter' && handleNpiLookup()}
              placeholder="Enter NPI number"
              className={inputCls(false)}
            />
            {npiVerified && (
              <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-tier-green" />
            )}
          </div>
        </div>

        {/* Provider name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">Provider name <span className="text-destructive">*</span></label>
          <input type="text" value={p.name} onChange={e => updateProvider({ ...p, name: e.target.value })} placeholder="Full name" className={inputCls()} />
        </div>

        {/* Facility name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">Facility name <span className="text-destructive">*</span></label>
          <input type="text" value={p.facilityName} onChange={e => updateProvider({ ...p, facilityName: e.target.value })} placeholder="Facility name" className={inputCls()} />
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1.5">Address <span className="text-destructive">*</span></label>
          <input type="text" value={p.address} onChange={e => updateProvider({ ...p, address: e.target.value })} placeholder="Street address" className={inputCls()} />
        </div>

        {/* City / State / Zip */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">City <span className="text-destructive">*</span></label>
            <input type="text" value={p.city} onChange={e => updateProvider({ ...p, city: e.target.value })} placeholder="City" className={inputCls()} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">State <span className="text-destructive">*</span></label>
            <select value={p.state} onChange={e => updateProvider({ ...p, state: e.target.value })} className={`${inputCls()} w-full sm:w-[80px] appearance-none cursor-pointer`}>
              <option value="">—</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Zip <span className="text-destructive">*</span></label>
            <input type="text" value={p.zip} onChange={e => updateProvider({ ...p, zip: e.target.value })} placeholder="Zip" className={`${inputCls()} w-full sm:w-[100px]`} />
          </div>
        </div>

        {/* Continue */}
        <div className="flex justify-end">
          <button
            disabled={!isValid}
            onClick={() => setStep(1)}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>

      {/* PDF Import Drop Zone */}
      <div className="max-w-lg mx-auto">
        <PdfDropZone />
      </div>
    </div>
  );
}
