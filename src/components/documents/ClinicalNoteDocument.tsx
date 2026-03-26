import type { OrderState } from '@/types/order';
import { generateClinicalNote } from '@/engine/clinicalNote';

export function ClinicalNoteDocument({ state }: { state: OrderState }) {
  const noteText = generateClinicalNote(state);
  const lines = noteText.split('\n');

  return (
    <div className="font-serif text-sm leading-relaxed print-document">
      {lines.map((line, i) => {
        if (i === 0) {
          // Title
          return <div key={i} className="text-lg font-bold underline mb-3">{line}</div>;
        }
        if (line.startsWith('CPT Code:') || line.startsWith('DX Codes:')) {
          return <div key={i} className="text-sm font-semibold mt-1">{line}</div>;
        }
        if (line.startsWith('___')) {
          return <div key={i} className="border-t border-foreground mt-16 mb-2" />;
        }
        if (line.startsWith('DR.')) {
          return <div key={i} className="font-semibold text-sm">{line}</div>;
        }
        if (line === '') {
          return <div key={i} className="h-3" />;
        }
        return <p key={i} className="text-sm leading-relaxed">{line}</p>;
      })}
    </div>
  );
}
