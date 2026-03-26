import { useState, useRef, useCallback } from 'react';
import { useOrder } from '@/context/OrderContext';
import { ClinicalNoteDocument } from '@/components/documents/ClinicalNoteDocument';
import { RequisitionDocument } from '@/components/documents/RequisitionDocument';
import { LMNDocument } from '@/components/documents/LMNDocument';
import { Printer, Download, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';

type DocTab = 'note' | 'requisition' | 'lmn';

const TABS: { key: DocTab; label: string }[] = [
  { key: 'note', label: 'Clinical note' },
  { key: 'requisition', label: 'Requisition' },
  { key: 'lmn', label: 'Medical necessity letter' },
];

const DOC_NAMES: Record<DocTab, string> = {
  note: 'Clinical-Note',
  requisition: 'Requisition',
  lmn: 'Medical-Necessity-Letter',
};

export function DocumentsScreen() {
  const { order, setStep, resetOrder } = useOrder();
  const [activeTab, setActiveTab] = useState<DocTab>('note');
  const [printAll, setPrintAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const orderNumRef = useRef(
    order.orderNumber || 'FRP-' + Math.floor(1000000 + Math.random() * 9000000).toString()
  );
  const orderNum = orderNumRef.current;

  // Loading state
  useState(() => {
    setTimeout(() => setLoading(false), 300);
  });

  const getPdfOptions = useCallback((filename: string) => ({
    margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }), []);

  const handleDownload = useCallback(async () => {
    if (!docRef.current || downloading) return;
    setDownloading(true);
    try {
      const patientName = `${order.patient.lastName || 'Patient'}`.replace(/\s+/g, '-');
      const filename = `${DOC_NAMES[activeTab]}_${patientName}_${orderNum}.pdf`;
      await html2pdf().set(getPdfOptions(filename)).from(docRef.current).save();
    } finally {
      setDownloading(false);
    }
  }, [activeTab, order.patient.lastName, orderNum, downloading, getPdfOptions]);

  const handleDownloadAll = useCallback(async () => {
    if (!docRef.current || downloading) return;
    setDownloading(true);
    setPrintAll(true);
    // Wait for React to render all docs
    await new Promise(r => setTimeout(r, 200));
    try {
      const patientName = `${order.patient.lastName || 'Patient'}`.replace(/\s+/g, '-');
      const filename = `All-Documents_${patientName}_${orderNum}.pdf`;
      if (docRef.current) {
        await html2pdf().set(getPdfOptions(filename)).from(docRef.current).save();
      }
    } finally {
      setPrintAll(false);
      setDownloading(false);
    }
  }, [order.patient.lastName, orderNum, downloading, getPdfOptions]);

  const handlePrint = () => {
    setPrintAll(false);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintAll = () => {
    setPrintAll(true);
    setTimeout(() => window.print(), 100);
  };

  const handleNewOrder = () => {
    resetOrder();
    setStep(0);
  };

  if (loading) {
    return (
      <div className="py-8 flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
        <Loader2 size={32} className="text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Generating documents...</p>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Title */}
      <div className="no-print mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Documents</h1>
        <p className="text-sm text-text-secondary mt-1">Your order documents are ready. Print or save as PDF.</p>
      </div>

      {/* Action bar */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-3 mb-4">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-card border border-border font-medium text-foreground shadow-sm'
                  : 'bg-surface text-muted-foreground hover:text-text-secondary cursor-pointer'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadAll}
            disabled={downloading}
            className="h-10 px-4 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download all
          </button>
          <button
            onClick={handlePrintAll}
            className="h-10 px-4 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            Print all
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </button>
        </div>
      </div>

      {/* Document viewer */}
      <div className="document-viewer bg-card rounded-xl border border-border p-4 sm:p-8 max-w-[800px] mx-auto mb-6"
        style={{ minHeight: printAll ? 'auto' : '900px' }}
      >
        {printAll ? (
          <>
            <div className="print-page-after">
              <ClinicalNoteDocument state={order} />
            </div>
            <div className="page-break my-8 border-t-2 border-dashed border-border print:hidden" />
            <div className="print-page-after">
              <RequisitionDocument state={order} orderNumber={orderNum} />
            </div>
            <div className="page-break my-8 border-t-2 border-dashed border-border print:hidden" />
            <LMNDocument state={order} />
          </>
        ) : (
          <>
            {activeTab === 'note' && <ClinicalNoteDocument state={order} />}
            {activeTab === 'requisition' && <RequisitionDocument state={order} orderNumber={orderNum} />}
            {activeTab === 'lmn' && <LMNDocument state={order} />}
          </>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="no-print flex items-center justify-between mb-8">
        <button
          onClick={() => setStep(3)}
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          ← Back to review
        </button>
        <button
          onClick={handleNewOrder}
          className="h-10 px-6 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          Start new order
        </button>
      </div>
    </div>
  );
}
