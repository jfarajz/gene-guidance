import { useState, useRef, useEffect } from 'react';
import { useOrder } from '@/context/OrderContext';
import { ICD10_DATABASE } from '@/data/constants';
import type { Diagnosis } from '@/types/order';
import { X } from 'lucide-react';

export function DiagnosisPanel() {
  const { order, setDiagnoses } = useOrder();
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
    ? ICD10_DATABASE.filter(d =>
        d.code.toLowerCase().includes(query) || d.description.toLowerCase().includes(query)
      ).filter(d => !order.diagnoses.some(existing => existing.code === d.code)).slice(0, 8)
    : [];

  const addDiagnosis = (d: Diagnosis) => {
    setDiagnoses([...order.diagnoses, d]);
    setSearch('');
    setShowDropdown(false);
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
      <div ref={wrapperRef} className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search ICD-10 code or description..."
          className="w-full h-10 rounded-lg border border-border px-3 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        />
        {showDropdown && results.length > 0 && (
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
          </div>
        )}
      </div>

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
