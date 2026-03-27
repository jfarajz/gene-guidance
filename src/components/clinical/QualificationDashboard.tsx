import { useOrder } from '@/context/OrderContext';
import { getGeneMatches, getTestedGenes } from '@/engine/qualification';
import type { Medication, Suggestion } from '@/types/order';
import { MEDICATION_DATABASE } from '@/data/constants';

export function QualificationDashboard() {
  const { order, addMedication } = useOrder();
  const { qualification, diagnoses, medications } = order;
  const { genes, suggestions, box19, billableCPTs, panelEligible, nonBillableMeds } = qualification;

  const yellowCodes = diagnoses.filter(d => d.tier === 'yellow').map(d => d.code);

  const handleSuggestionClick = (generic: string) => {
    const dbEntry = MEDICATION_DATABASE.find(m => m.generic === generic);
    if (!dbEntry) return;
    const geneMatches = getGeneMatches(generic);
    const testedGenes = getTestedGenes(generic);
    const defaultDx = diagnoses.length > 0 ? diagnoses[0].code : '';
    const med: Medication = {
      id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      generic: dbEntry.generic,
      brand: dbEntry.brand,
      dose: '',
      frequency: '',
      type: 'considered',
      linkedDiagnosis: defaultDx,
      geneMatches,
      isBillable: geneMatches.length > 0,
      isTested: testedGenes.length > 0,
      testedGenes,
    };
    addMedication(med);
  };

  const geneEntries = [
    { key: 'CYP2C19' as const, data: genes.CYP2C19 },
    { key: 'CYP2D6' as const, data: genes.CYP2D6 },
    { key: 'CYP2C9' as const, data: genes.CYP2C9 },
  ];

  const qualifiedCount = geneEntries.filter(g => g.data.qualified).length;

  return (
    <div className="bg-background border border-border rounded-xl p-5 mt-6">
      <div className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-4">Qualification Summary</div>

      {/* Row 1: Gene cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {geneEntries.map(({ key, data }) => (
          <div
            key={key}
            className={`rounded-lg p-3 border transition-all duration-150 ${
              data.qualified
                ? 'bg-card border-border border-l-[3px] border-l-tier-green'
                : 'bg-card border-dashed border-border border-l-[3px] border-l-border'
            }`}
          >
            <div className="text-[11px] text-text-tertiary">{data.cpt} · {key}</div>
            <div className={`text-sm font-medium mt-0.5 transition-colors duration-150 ${data.qualified ? 'text-tier-green' : 'text-text-tertiary'}`}>
              {data.qualified ? '✅ Qualified' : '— Not covered'}
            </div>
            {data.medications.length > 0 && (
              <div className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                {data.medications.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 2: Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          {suggestions.map(s => (
            <SuggestionCard key={s.gene} suggestion={s} onClick={handleSuggestionClick} />
          ))}
        </div>
      )}

      {/* Row 3: Box 19 + CPT */}
      {(medications.length > 0) && (
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex-1">
            <div className="text-xs text-text-tertiary mb-1">Box 19</div>
            <div className={`font-mono text-[11px] break-all rounded-md px-3 py-2 border ${
              box19.overLimit ? 'border-tier-red-border bg-card' : 'border-border bg-card'
            }`}>
              {box19.text || '—'}
            </div>
            <div className={`text-[11px] mt-1 ${box19.overLimit ? 'text-destructive font-medium' : 'text-text-tertiary'}`}>
              {box19.charCount}/80 characters
            </div>
          </div>
          <div className="shrink-0">
            <div className="text-xs text-text-tertiary mb-1">Billing codes</div>
            <div className="font-medium text-sm text-foreground">
              {billableCPTs.length > 0 ? billableCPTs.join(', ') : '—'}
            </div>
            <div className={`text-xs mt-1 font-medium ${
              qualifiedCount === 0 ? 'text-destructive' :
              panelEligible ? 'text-primary' : 'text-text-tertiary'
            }`}>
              {qualifiedCount === 0 ? 'No billable tests' :
               panelEligible ? 'Panel 81418 eligible' : 'Single gene test'}
            </div>
          </div>
        </div>
      )}

      {/* Row 4: Warnings */}
      {(nonBillableMeds.length > 0 || yellowCodes.length > 0) && medications.length > 0 && (
        <div className="border-t border-border pt-3 mt-3 text-xs text-tier-yellow space-y-1">
          {nonBillableMeds.length > 0 && (
            <p>{nonBillableMeds.length} medication{nonBillableMeds.length > 1 ? 's' : ''} not billable: {nonBillableMeds.join(', ')}</p>
          )}
          {yellowCodes.length > 0 && (
            <p>{yellowCodes.length} ICD-10 code{yellowCodes.length > 1 ? 's' : ''} require LCD documentation: {yellowCodes.join(', ')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({ suggestion, onClick }: { suggestion: Suggestion; onClick: (generic: string) => void }) {
  return (
    <div className="bg-accent-light border border-accent-muted rounded-lg px-4 py-3 border-l-[3px] border-l-primary">
      <div className="text-sm text-foreground">
        <span className="mr-1">💡</span>
        To qualify <span className="font-medium">{suggestion.gene}</span> ({suggestion.cpt}): consider adding{' '}
        {suggestion.medications.map((m, i) => (
          <span key={m.generic}>
            {i > 0 && ' or '}
            <button
              onClick={() => onClick(m.generic)}
              className="text-primary underline cursor-pointer hover:text-primary-hover font-medium"
            >
              {m.generic}
            </button>
            <span className="text-text-secondary"> ({m.reason})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
