import { useState, useRef, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { ICD10_DATABASE } from '@/data/constants';
import type { Diagnosis, CoverageTier } from '@/types/order';
import { X, ChevronDown, ChevronUp, ChevronRight, ClipboardList } from 'lucide-react';

const DIAGNOSIS_CATEGORIES = [
  { label: "Mood & Depression", codes: ["F32.0","F32.1","F32.2","F32.3","F32.4","F32.9","F33.0","F33.1","F33.2","F33.3","F33.41","F33.9"] },
  { label: "Anxiety & PTSD", codes: ["F41.0","F41.1","F41.3","F41.8","F41.9","F43.11","F43.12","F40.11"] },
  { label: "Bipolar", codes: ["F31.0","F31.11","F31.12","F31.13","F31.2","F31.31","F31.32","F31.4","F31.5","F31.61","F31.62","F31.63","F31.64","F31.71","F31.73","F31.75","F31.77"] },
  { label: "Schizophrenia & Psychotic", codes: ["F20.0","F20.1","F20.2","F20.3","F20.5","F20.81","F20.89"] },
  { label: "ADHD", codes: ["F90.0","F90.1","F90.2","F90.8"] },
  { label: "Cardiovascular", codes: ["I10","I25.10","I50.22","R00.2","Z86.73"] },
  { label: "Metabolic & Lipids", codes: ["E78.00","E78.2","E78.49","E78.5","E11.9","E11.69","E08.00","R73.03"] },
  { label: "Pain & Musculoskeletal", codes: ["G89.29","M79.10","M35.00","B02.22"] },
  { label: "GI & Other", codes: ["K21.0","K29.70","G47.00","H81.03","F03.90","F60.5"] },
];

export function DiagnosisPanel() {
  const { order, setDiagnoses } = useOrder();
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
    ? ICD10_DATABASE.filter(d =>
        d.code.toLowerCase().includes(query) || d.description.toLowerCase().includes(query)
      ).filter(d => !order.diagnoses.some(existing => existing.code === d.code)).slice(0, 8)
    : [];

  const looksLikeCode = /^[A-Za-z]\d{2,}/.test(search.trim());
  const alreadyAdded = order.diagnoses.some(d => d.code.toUpperCase() === search.trim().toUpperCase());
  const showFreeText = query.length > 0 && results.length === 0 && looksLikeCode && !alreadyAdded;

  const addDiagnosis = (d: Diagnosis) => {
    setDiagnoses([...order.diagnoses, d]);
    setSearch('');
    setShowDropdown(false);
  };

  const addFreeTextDiagnosis = () => {
    const code = search.trim().toUpperCase();
    if (!code || alreadyAdded) return;
    addDiagnosis({ code, description: 'Custom diagnosis code', tier: 'yellow' as CoverageTier });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (results.length > 0) {
        addDiagnosis(results[0]);
      } else if (showFreeText) {
        addFreeTextDiagnosis();
      }
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const removeDiagnosis = (code: string) => {
    setDiagnoses(order.diagnoses.filter(d => d.code !== code));
  };

  const tierStyles = {
    green: { card: 'bg-tier-green-bg border-tier-green-border', dot: 'bg-tier-green', badge: 'bg-tier-green', label: 'MolDx listed' },
    yellow: { card: 'bg-tier-yellow-bg border-tier-yellow-border', dot: 'bg-tier-yellow', badge: 'bg-tier-yellow', label: 'LCD covered' },
    red: { card: 'bg-tier-red-bg border-tier-red-border', dot: 'bg-tier-red', badge: 'bg-tier-red', label: 'Not covered' },
  };

  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-3">Diagnoses</div>

      {/* Search */}
      <div ref={wrapperRef} className="relative mb-2">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search ICD-10 code or description..."
          className="w-full h-10 rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        {showDropdown && (results.length > 0 || showFreeText) && (
          <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {results.map(r => {
              const style = tierStyles[r.tier];
              return (
                <button
                  key={r.code}
                  onClick={() => addDiagnosis(r)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                  <span className="font-medium text-sm text-foreground">{r.code}</span>
                  <span className="text-sm text-text-secondary truncate">{r.description}</span>
                </button>
              );
            })}
            {showFreeText && (
              <button
                onClick={addFreeTextDiagnosis}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <span className="w-2 h-2 rounded-full shrink-0 bg-tier-yellow" />
                <span className="font-medium text-sm text-foreground">{search.trim().toUpperCase()}</span>
                <span className="text-sm text-text-tertiary">Add custom code (press Enter)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick-select browser */}
      <button
        onClick={() => setBrowserOpen(!browserOpen)}
        className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline mb-2"
      >
        <ClipboardList size={12} />
        Browse common codes
        {browserOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {browserOpen && (
        <div className="bg-surface/50 border border-border rounded-lg p-2 mb-3 max-h-[200px] overflow-y-auto">
          {DIAGNOSIS_CATEGORIES.map(cat => {
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
                    {cat.codes.map(code => {
                      const entry = ICD10_DATABASE.find(d => d.code === code);
                      if (!entry) return null;
                      const added = order.diagnoses.some(d => d.code === code);
                      const dotCls = tierStyles[entry.tier]?.dot || 'bg-tier-yellow';
                      return (
                        <button
                          key={code}
                          title={entry.description}
                          disabled={added}
                          onClick={() => addDiagnosis(entry)}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-colors ${
                            added
                              ? 'bg-primary/10 border border-primary text-primary opacity-60 cursor-default'
                              : 'bg-surface border border-border text-text-secondary hover:bg-muted cursor-pointer'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotCls}`} />
                          {code} {entry.description.length > 20 ? entry.description.slice(0, 20) + '…' : entry.description}
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

      {/* Cards */}
      {order.diagnoses.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 flex items-center justify-center">
          <p className="text-sm text-text-tertiary">Add at least one diagnosis to begin</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {order.diagnoses.map(d => {
            const style = tierStyles[d.tier];
            return (
              <div key={d.code} className={`group rounded-lg px-3 py-2.5 border flex items-center gap-2 ${style.card}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                <span className="font-medium text-sm text-foreground">{d.code}</span>
                <span className="text-xs text-text-secondary truncate flex-1">{d.description}</span>
                <span className={`${style.badge} text-primary-foreground text-[10px] px-2 py-0.5 rounded font-medium shrink-0`}>
                  {style.label}
                </span>
                <button
                  onClick={() => removeDiagnosis(d.code)}
                  className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-destructive transition-all cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
