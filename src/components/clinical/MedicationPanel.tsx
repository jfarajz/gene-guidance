import { useState, useRef, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { MEDICATION_DATABASE } from '@/data/constants';
import { getGeneMatches } from '@/engine/qualification';
import type { Medication, Diagnosis } from '@/types/order';
import { X, Check, AlertTriangle, ChevronDown } from 'lucide-react';

function getRecommendedDiagnosis(generic: string, diagnoses: Diagnosis[]): string {
  if (diagnoses.length <= 1) return '';
  const name = generic.toLowerCase();
  if (['metoprolol','carvedilol','propafenone','clopidogrel'].some(d => name.includes(d))) {
    const cv = diagnoses.find(d => d.code.startsWith('I'));
    if (cv) return cv.code;
  }
  if (['sertraline','escitalopram','citalopram','paroxetine','venlafaxine','fluvoxamine','doxepin','amitriptyline','aripiprazole','clozapine','vortioxetine','clomipramine','imipramine','trimipramine','nortriptyline','desipramine','atomoxetine','amphetamine'].some(d => name.includes(d))) {
    const psy = diagnoses.find(d => d.code.startsWith('F'));
    if (psy) return psy.code;
  }
  if (['fluvastatin','rosuvastatin','atorvastatin','simvastatin','lovastatin','pitavastatin','pravastatin'].some(d => name.includes(d))) {
    const lip = diagnoses.find(d => d.code.startsWith('E78'));
    if (lip) return lip.code;
  }
  if (['meloxicam','celecoxib','codeine','tramadol','piroxicam'].some(d => name.includes(d))) {
    const pain = diagnoses.find(d => d.code === 'G89.29' || d.code.startsWith('M'));
    if (pain) return pain.code;
  }
  if (['omeprazole','pantoprazole','lansoprazole','dexlansoprazole'].some(d => name.includes(d))) {
    const gi = diagnoses.find(d => d.code.startsWith('K'));
    if (gi) return gi.code;
  }
  return '';
}

export function MedicationPanel() {
  const { order, addMedication, removeMedication } = useOrder();
  const [activeTab, setActiveTab] = useState<'prescribed' | 'considered'>('prescribed');
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const query = search.toLowerCase().trim();
  const results = query.length > 0
    ? MEDICATION_DATABASE.filter(m =>
        m.generic.toLowerCase().includes(query) ||
        m.brand.toLowerCase().includes(query) ||
        m.class.toLowerCase().includes(query)
      ).filter(m => !order.medications.some(existing => existing.generic === m.generic))
      .slice(0, 8)
    : [];

  const tabMeds = order.medications.filter(m => m.type === activeTab);

  const handleSelect = (med: typeof MEDICATION_DATABASE[0]) => {
    const geneMatches = getGeneMatches(med.generic);
    const defaultDx = order.diagnoses.length > 0 ? order.diagnoses[0].code : '';
    const newMed: Medication = {
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      generic: med.generic,
      brand: med.brand,
      dose: '',
      frequency: '',
      type: activeTab,
      linkedDiagnosis: defaultDx,
      geneMatches,
      isBillable: geneMatches.length > 0,
    };
    addMedication(newMed);
    setSearch('');
    setShowDropdown(false);
  };

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-3">Medications</div>

      {/* Tabs */}
      <div className="flex gap-2 mb-3">
        {(['prescribed', 'considered'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-xs transition-colors ${
              activeTab === tab
                ? 'bg-card border border-border text-foreground font-medium shadow-sm'
                : 'bg-surface text-text-tertiary hover:text-text-secondary cursor-pointer'
            }`}
          >
            {tab === 'prescribed' ? 'Currently prescribed' : 'Being considered'}
            {order.medications.filter(m => m.type === tab).length > 0 && (
              <span className="ml-1.5 text-[10px] bg-muted rounded px-1">
                {order.medications.filter(m => m.type === tab).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div ref={wrapperRef} className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search medication name, brand, or class..."
          className="w-full h-10 rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        {showDropdown && (results.length > 0 || showFreeText) && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.generic}
                onClick={() => handleSelect(r)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${r.billable ? 'bg-primary' : 'bg-destructive'}`} />
                  <span className="font-medium text-sm text-foreground">{r.generic}</span>
                  <span className="text-text-tertiary text-sm">({r.brand})</span>
                  <span className="text-xs text-text-tertiary">{r.class}</span>
                </div>
                {!r.billable && (
                  <span className="text-xs text-destructive">No gene interaction</span>
                )}
              </button>
            ))}
            {showFreeText && (
              <button
                onClick={handleFreeTextAdd}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <span className="w-2 h-2 rounded-full shrink-0 bg-muted-foreground" />
                <span className="font-medium text-sm text-foreground">{search.trim()}</span>
                <span className="text-sm text-text-tertiary">Add custom medication (press Enter)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Medication rows */}
      {tabMeds.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 flex items-center justify-center">
          <p className="text-sm text-text-tertiary">Add medications to see qualification results</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tabMeds.map(med => (
            <MedRow key={med.id} med={med} onRemove={() => removeMedication(med.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function MedRow({ med, onRemove }: { med: Medication; onRemove: () => void }) {
  const { order, updateMedication } = useOrder();

  return (
    <div className={`group rounded-lg px-3 py-2 border ${
      med.isBillable ? 'bg-card border-border' : 'bg-tier-red-bg border-tier-red-border'
    }`}>
      {/* Top row: name + badges */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground">{med.generic}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {med.isBillable ? (
            <>
              {med.geneMatches.map(gm => (
                <span key={gm.gene} className="bg-gene-badge-bg text-gene-badge-text text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {gm.gene}
                </span>
              ))}
              {med.geneMatches.map(gm => (
                <span key={gm.cpt} className="bg-gene-badge-bg text-gene-badge-text text-[10px] px-1.5 py-0.5 rounded font-medium">
                  {gm.cpt}
                </span>
              ))}
              <Check size={14} className="text-tier-green" />
            </>
          ) : (
            <>
              <span className="text-destructive bg-tier-red-bg border border-tier-red-border text-[10px] px-1.5 py-0.5 rounded font-medium">
                Not in MolDx
              </span>
              <AlertTriangle size={14} className="text-destructive" />
            </>
          )}
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-destructive transition-all cursor-pointer ml-1"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Bottom row: dose, frequency, linked diagnosis */}
      <div className="flex items-center gap-2 mt-1.5">
        <input
          type="text"
          value={med.dose}
          onChange={e => updateMedication(med.id, { dose: e.target.value })}
          placeholder="Dose"
          className="w-[80px] h-6 rounded border border-border px-2 text-xs text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary bg-background"
        />
        <input
          type="text"
          value={med.frequency}
          onChange={e => updateMedication(med.id, { frequency: e.target.value })}
          placeholder="Frequency"
          className="w-[100px] h-6 rounded border border-border px-2 text-xs text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary bg-background"
        />
        {(() => {
          const recommended = getRecommendedDiagnosis(med.generic, order.diagnoses);
          return (
            <div className="relative ml-auto">
              <select
                value={med.linkedDiagnosis}
                onChange={e => updateMedication(med.id, { linkedDiagnosis: e.target.value })}
                className={`h-6 rounded border pl-2 pr-5 text-xs bg-background appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary ${
                  recommended && med.linkedDiagnosis !== recommended
                    ? 'border-tier-yellow text-tier-yellow'
                    : 'border-border text-text-secondary'
                }`}
              >
                {order.diagnoses.length === 0 && <option value="">No diagnoses</option>}
                {order.diagnoses.map(d => (
                  <option key={d.code} value={d.code}>
                    {d.code}{d.code === recommended ? ' ★' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              {recommended && med.linkedDiagnosis !== recommended && (
                <div className="text-[10px] text-tier-yellow mt-0.5">
                  Suggested: {recommended}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
