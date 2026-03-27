import { useEffect, useState, useRef } from 'react';
import { useOrder } from '@/context/OrderContext';
import { Camera, X, RefreshCw } from 'lucide-react';

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

const labelCls = 'block text-sm font-medium text-foreground mb-1.5';

function ValidatedInput({ value, onChange, required = false, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { required?: boolean; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  const [touched, setTouched] = useState(false);
  const showError = required && touched && !value;
  return (
    <div>
      <input
        {...props}
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        className={`w-full h-10 rounded-lg border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors bg-background ${
          showError ? 'border-destructive' : 'border-input'
        }`}
      />
      {showError && <p className="text-xs text-destructive mt-1">Required</p>}
    </div>
  );
}

function ValidatedSelect({ value, onChange, required = false, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { required?: boolean; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) {
  const [touched, setTouched] = useState(false);
  const showError = required && touched && !value;
  return (
    <div>
      <select
        {...props}
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        className={`w-full h-10 rounded-lg border px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors bg-background appearance-none cursor-pointer ${
          showError ? 'border-destructive' : 'border-input'
        }`}
      >
        {children}
      </select>
      {showError && <p className="text-xs text-destructive mt-1">Required</p>}
    </div>
  );
}

const inputCls = 'w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

function InsuranceCardUpload({ photo, side, sideLabel, onCapture, onRemove }: {
  photo: string;
  side: string;
  sideLabel: string;
  onCapture: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onCapture(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setShowCamera(true);
      // Wait for video element to mount
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } catch {
      setCameraError('Camera not available');
      // Fallback to file picker
      inputRef.current?.click();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL('image/jpeg', 0.9));
    stopCamera();
  };

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  if (showCamera) {
    return (
      <div>
        <div className="relative aspect-[8/5] rounded-lg overflow-hidden border border-border bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-lg bg-background/80 text-xs text-foreground border border-border cursor-pointer hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={capturePhoto}
              className="w-10 h-10 rounded-full bg-white border-4 border-primary cursor-pointer hover:bg-primary/10 transition-colors"
              aria-label="Take photo"
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-1">{sideLabel}</p>
      </div>
    );
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      {photo ? (
        <div className="relative aspect-[8/5] rounded-lg overflow-hidden border border-border">
          <img src={photo} alt={sideLabel} className="object-cover w-full h-full" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center cursor-pointer hover:bg-destructive/90"
          >
            <X size={12} />
          </button>
          <button
            type="button"
            onClick={() => { onRemove(); setTimeout(startCamera, 100); }}
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-background/80 text-xs text-foreground border border-border cursor-pointer hover:bg-background flex items-center gap-1"
          >
            <RefreshCw size={10} /> Retake
          </button>
        </div>
      ) : (
        <div className="w-full aspect-[8/5] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted/30 transition-colors">
          <Camera size={24} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{side}</span>
          {cameraError && <span className="text-[10px] text-destructive">{cameraError}</span>}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={startCamera}
              className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Camera
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1 rounded-md border border-input bg-background text-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
            >
              Upload
            </button>
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center mt-1">{sideLabel}</p>
    </div>
  );
}

export function PatientScreen() {
  const { order, updatePatient, updateInsurance, updateCollection, updateInsuranceCards, setStep } = useOrder();
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canContinue) setStep(2);
  };

  return (
    <div className="py-8 flex flex-col gap-6" onKeyDown={handleKeyDown}>
      {/* Card 1: Patient Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Patient information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          {/* Left column */}
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelCls}>First name <span className="text-destructive">*</span></label>
              <ValidatedInput required type="text" value={pat.firstName} onChange={e => updatePatient({ ...pat, firstName: e.target.value })} placeholder="First name" />
            </div>
            <div>
              <label className={labelCls}>Last name <span className="text-destructive">*</span></label>
              <ValidatedInput required type="text" value={pat.lastName} onChange={e => updatePatient({ ...pat, lastName: e.target.value })} placeholder="Last name" />
            </div>
            <div>
              <label className={labelCls}>Date of birth <span className="text-destructive">*</span></label>
              <ValidatedInput required type="date" value={pat.dob} onChange={e => updatePatient({ ...pat, dob: e.target.value })} />
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
              <ValidatedInput required type="text" value={pat.address1} onChange={e => updatePatient({ ...pat, address1: e.target.value })} placeholder="Street address" />
            </div>
            <div>
              <label className={labelCls}>Address 2</label>
              <input type="text" value={pat.address2} onChange={e => updatePatient({ ...pat, address2: e.target.value })} placeholder="Apt, Suite, etc." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>City <span className="text-destructive">*</span></label>
              <ValidatedInput required type="text" value={pat.city} onChange={e => updatePatient({ ...pat, city: e.target.value })} placeholder="City" />
            </div>
            <div>
              <label className={labelCls}>State <span className="text-destructive">*</span></label>
              <ValidatedSelect required value={pat.state} onChange={e => updatePatient({ ...pat, state: e.target.value })}>
                <option value="">Select...</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </ValidatedSelect>
            </div>
            <div>
              <label className={labelCls}>Zip <span className="text-destructive">*</span></label>
              <ValidatedInput required type="text" value={pat.zip} onChange={e => updatePatient({ ...pat, zip: e.target.value })} placeholder="Zip code" />
            </div>
            <div>
              <label className={labelCls}>Phone <span className="text-destructive">*</span></label>
              <ValidatedInput required type="tel" value={pat.phone} onChange={e => updatePatient({ ...pat, phone: e.target.value })} placeholder="(555) 555-0000" />
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-destructive">*</span></label>
              <ValidatedInput required type="email" value={pat.email} onChange={e => updatePatient({ ...pat, email: e.target.value })} placeholder="patient@email.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Insurance Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Insurance information</h3>
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6">
          {/* Left column: fields */}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Policy ID <span className="text-destructive">*</span></label>
                <ValidatedInput required type="text" value={ins.policyId} onChange={e => updateInsurance({ ...ins, policyId: e.target.value })} placeholder="Policy ID" />
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

          {/* Right column: card photos */}
          <div>
            <label className={labelCls}>Insurance card</label>
            <div className="flex flex-col gap-3">
              <InsuranceCardUpload
                photo={order.insuranceCards.front}
                side="Front of card"
                sideLabel="Front"
                onCapture={(url) => updateInsuranceCards({ front: url })}
                onRemove={() => updateInsuranceCards({ front: '' })}
              />
              <InsuranceCardUpload
                photo={order.insuranceCards.back}
                side="Back of card"
                sideLabel="Back"
                onCapture={(url) => updateInsuranceCards({ back: url })}
                onRemove={() => updateInsuranceCards({ back: '' })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Specimen Information */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Specimen information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
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
