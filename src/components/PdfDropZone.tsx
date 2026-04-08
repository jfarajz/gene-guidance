import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { parseRequisitionPdf } from '@/engine/pdfParser';
import { useOrder } from '@/context/OrderContext';
import { qualifyOrder } from '@/engine/qualification';

export function PdfDropZone({ compact = false }: { compact?: boolean }) {
  const { order, loadDemo } = useOrder();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const parsed = await parseRequisitionPdf(file);
      const meds = parsed.medications || [];
      const diags = parsed.diagnoses || [];
      const qualification = qualifyOrder(meds, diags);

      const newOrder = {
        ...order,
        currentStep: 2, // Go to Clinical screen
        orderNumber: parsed.orderNumber || order.orderNumber,
        provider: { ...order.provider, ...stripEmpty(parsed.provider || {}) },
        patient: { ...order.patient, ...stripEmpty(parsed.patient || {}) },
        insurance: { ...order.insurance, ...stripEmpty(parsed.insurance || {}) },
        collection: { ...order.collection, ...stripEmpty(parsed.collection || {}) },
        diagnoses: diags,
        medications: meds,
        qualification,
        signatures: order.signatures,
        insuranceCards: order.insuranceCards,
      };
      loadDemo(newOrder as any);
    } catch (e) {
      console.error('PDF parse error:', e);
      setError('Could not parse this PDF. Make sure it\'s a Firmalab requisition.');
    } finally {
      setLoading(false);
    }
  }, [order, loadDemo]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  if (compact) {
    return (
      <>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="text-[11px] px-2 py-0.5 rounded border border-primary-foreground/20 text-primary-foreground/70 hover:text-primary-foreground hover:border-primary-foreground/40 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Import PDF
        </button>
        <input ref={inputRef} type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
      </>
    );
  }

  return (
    <div className="mt-6">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-border hover:border-primary/40 hover:bg-muted/30'
        } ${loading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input ref={inputRef} type="file" accept=".pdf" onChange={onFileChange} className="hidden" />
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={28} className="text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Parsing requisition…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText size={20} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Import existing requisition</p>
            <p className="text-xs text-muted-foreground">
              Drop a Firmalab PDF here or <span className="text-primary underline">browse</span>
            </p>
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}

function stripEmpty(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== '' && v !== undefined && v !== null) result[k] = v;
  }
  return result;
}
