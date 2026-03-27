import { useState, useRef, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { MEDICATION_DATABASE } from '@/data/constants';
import { getGeneMatches, getTestedGenes } from '@/engine/qualification';
import type { Medication, Diagnosis } from '@/types/order';
import { X, Check, AlertTriangle, Info, ChevronDown, ChevronUp, ChevronRight, Pill } from 'lucide-react';

const MEDICATION_CATEGORIES = [
  { label: "SSRIs & SNRIs", meds: ["escitalopram","sertraline","citalopram","paroxetine","fluvoxamine","venlafaxine","vortioxetine"] },
  { label: "Tricyclic Antidepressants", meds: ["amitriptyline","nortriptyline","doxepin","desipramine","clomipramine","imipramine","trimipramine"] },
  { label: "Antipsychotics", meds: ["aripiprazole","brexpiprazole","clozapine","iloperidone","perphenazine","pimozide","thioridazine"] },
  { label: "Beta Blockers", meds: ["metoprolol tartrate","metoprolol succinate","carvedilol","propafenone"] },
  { label: "Antiplatelet & Anticoagulant", meds: ["clopidogrel","warfarin"] },
  { label: "Statins", meds: ["fluvastatin","rosuvastatin","atorvastatin","simvastatin","lovastatin","pitavastatin","pravastatin"] },
  { label: "NSAIDs", meds: ["meloxicam","celecoxib","piroxicam"] },
  { label: "Opioids & Pain", meds: ["codeine","tramadol","oliceridine"] },
  { label: "PPIs", meds: ["omeprazole","pantoprazole","lansoprazole","dexlansoprazole"] },
  { label: "ADHD Medications", meds: ["amphetamine","atomoxetine"] },
  { label: "Anticonvulsants", meds: ["phenytoin","fosphenytoin","brivaracetam","clobazam"] },
  { label: "Other Billable", meds: ["ondansetron","tamoxifen","valbenazine","deutetrabenazine","eliglustat","tolterodine","cevimeline","metoclopramide","lofexidine","siponimod","nateglinide","voriconazole"] },
  { label: "Common Non-Billable", meds: ["losartan","lisinopril","amlodipine","hydrochlorothiazide","metformin","empagliflozin","trazodone","bupropion","fluoxetine","duloxetine","clonazepam","lorazepam","triazolam","atenolol","propranolol","aspirin","apixaban","levothyroxine","donepezil"] },
];

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
  const [browserOpen, setBrowserOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
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

  const alreadyAdded = order.medications.some(m => m.generic.toLowerCase() === query);
  const showFreeText = query.length >= 2 && results.length === 0 && !alreadyAdded;

  const tabMeds = order.medications.filter(m => m.type === activeTab);

  const handleSelect = (med: typeof MEDICATION_DATABASE[0]) => {
    const geneMatches = getGeneMatches(med.generic);
    const testedGenes = getTestedGenes(med.generic);
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
      isTested: testedGenes.length > 0,
      testedGenes,
    };
    addMedication(newMed);
    setSearch('');
    setShowDropdown(false);
  };

  const handleFreeTextAdd = () => {
    const name = search.trim();
    if (!name || alreadyAdded) return;
    const geneMatches = getGeneMatches(name);
    const testedGenes = getTestedGenes(name);
    const newMed: Medication = {
      id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      generic: name.toLowerCase(),
      brand: '',
      dose: '',
      frequency: '',
      type: activeTab,
      linkedDiagnosis: order.diagnoses.length > 0 ? order.diagnoses[0].code : '',
      geneMatches,
      isBillable: geneMatches.length > 0,
      isTested: testedGenes.length > 0,
      testedGenes,
    };
    addMedication(newMed);
    setSearch('');
    setShowDropdown(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (results.length > 0) handleSelect(results[0]);
      else if (showFreeText) handleFreeTextAdd();
    }
    if (e.key === 'Escape') setShowDropdown(false);
  };

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-2">Medications</div>
      <div className="flex items-center gap-4 mb-3 text-[10px]">
        <span className="flex items-center gap-1"><Check size={12} className="text-tier-green" /> Billable (Z-code gene)</span>
        <span className="flex items-center gap-1"><Info size={12} className="text-tier-purple" /> Tested · not separately billable</span>
        <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-destructive" /> No gene interaction</span>
      </div>

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
            {results.map(r => {
              const testedGs = getTestedGenes(r.generic);
              const isTested = testedGs.length > 0;
              return (
                <button
                  key={r.generic}
                  onClick={() => handleSelect(r)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      r.billable ? 'bg-primary' : isTested ? 'border-2 border-tier-purple bg-transparent' : 'bg-destructive'
                    }`} />
                    <span className="font-medium text-sm text-foreground">{r.generic}</span>
                    <span className="text-text-tertiary text-sm">({r.brand})</span>
                    <span className="text-xs text-text-tertiary">{r.class}</span>
                  </div>
                  {r.billable ? null : isTested ? (
                    <span className="text-[10px] text-tier-purple">Tested gene: {testedGs.join(', ')}</span>
                  ) : (
                    <span className="text-xs text-destructive">No gene interaction</span>
                  )}
                </button>
              );
            })}
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

      {/* Browse by class */}
      <button
        onClick={() => setBrowserOpen(!browserOpen)}
        className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline mb-2"
      >
        <Pill size={12} />
        Browse by drug class
        {browserOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {browserOpen && (
        <div className="bg-surface/50 border border-border rounded-lg p-2 mb-3 max-h-[200px] overflow-y-auto">
          {MEDICATION_CATEGORIES.map(cat => {
            const isOpen = openCategory === cat.label;
            return (
              <div key={cat.label}>
                <button
                  onClick={() => setOpenCategory(isOpen ? null : cat.label)}
                  className="w-full text-xs font-medium text-text-secondary px-2 py-1.5 hover:bg-muted rounded cursor-pointer flex items-center justify-between"
                >
                  {cat.label}
                  {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {isOpen && (
                  <div className="flex flex-wrap gap-1 px-2 py-1.5">
                    {cat.meds.map(generic => {
                      const dbEntry = MEDICATION_DATABASE.find(m => m.generic === generic);
                      const added = order.medications.some(m => m.generic === generic);
                      const gm = getGeneMatches(generic);
                      const tg = getTestedGenes(generic);
                      const dotCls = gm.length > 0
                        ? 'bg-primary'
                        : tg.length > 0
                          ? 'border border-tier-purple bg-transparent'
                          : 'bg-destructive';
                      return (
                        <button
                          key={generic}
                          disabled={added}
                          onClick={() => {
                            const testedGenes = tg;
                            const newMed: Medication = {
                              id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                              generic,
                              brand: dbEntry?.brand || '',
                              dose: '',
                              frequency: '',
                              type: activeTab,
                              linkedDiagnosis: order.diagnoses.length > 0 ? order.diagnoses[0].code : '',
                              geneMatches: gm,
                              isBillable: gm.length > 0,
                              isTested: testedGenes.length > 0,
                              testedGenes,
                            };
                            addMedication(newMed);
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors ${
                            added
                              ? 'bg-primary/10 border border-primary text-primary opacity-60 cursor-default'
                              : 'bg-surface border border-border text-text-secondary hover:bg-muted cursor-pointer'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
                          {generic}{dbEntry ? ` (${dbEntry.brand})` : ''}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

  const rowStyle = med.isBillable
    ? 'bg-card border-border'
    : med.isTested
      ? 'bg-tier-purple-bg border-tier-purple-border'
      : 'bg-tier-red-bg border-tier-red-border';

  return (
    <div className={`group rounded-lg px-3 py-2 border ${rowStyle}`}>
      {/* Top row: name + badges */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-foreground">{med.generic}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          {med.isBillable && (
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
            </>
          )}
          {med.testedGenes.length > 0 && med.testedGenes.map(g => (
            <span key={g} className="bg-tier-purple-border text-tier-purple text-[10px] px-1.5 py-0.5 rounded font-medium">
              {g}
            </span>
          ))}
          {med.isBillable ? (
            <Check size={14} className="text-tier-green" />
          ) : med.isTested ? (
            <>
              <span className="text-[10px] text-tier-purple">Tested · not separately billable</span>
              <Info size={14} className="text-tier-purple" />
            </>
          ) : (
            <>
              <span className="text-destructive bg-tier-red-bg border border-tier-red-border text-[10px] px-1.5 py-0.5 rounded font-medium">
                No gene interaction
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
