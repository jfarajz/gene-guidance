import { useRef, useEffect, useCallback, useState } from 'react';

type Mode = 'draw' | 'type';

interface SignaturePadProps {
  label: string;
  value: string;
  onChange: (dataUrl: string) => void;
}

function renderTypedSignature(name: string): string {
  const canvas = document.createElement('canvas');
  const w = 600;
  const h = 240;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  // Signature line
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(32, h * 0.8);
  ctx.lineTo(w - 32, h * 0.8);
  ctx.stroke();
  // Text
  ctx.fillStyle = '#0f172a';
  ctx.font = 'italic 36px "Georgia", "Times New Roman", serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, 40, h * 0.75, w - 80);
  return canvas.toDataURL('image/png');
}

export function SignaturePad({ label, value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasStrokes, setHasStrokes] = useState(!!value);
  const [mode, setMode] = useState<Mode>('draw');
  const [typedName, setTypedName] = useState('');

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    // Draw signature line
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, rect.height * 0.8);
    ctx.lineTo(rect.width - 16, rect.height * 0.8);
    ctx.stroke();
    // Restore saved value
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [value]);

  useEffect(() => {
    if (mode === 'draw') {
      setupCanvas();
      const handleResize = () => setupCanvas();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [setupCanvas, mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startStroke = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    if ('touches' in e) e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endStroke = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    setHasStrokes(true);
    const canvas = canvasRef.current;
    if (canvas) onChange(canvas.toDataURL('image/png'));
  };

  const handleClear = () => {
    setHasStrokes(false);
    setTypedName('');
    onChange('');
    if (mode === 'draw') setupCanvas();
  };

  const handleTypeChange = (name: string) => {
    setTypedName(name);
    if (name.trim()) {
      setHasStrokes(true);
      onChange(renderTypedSignature(name.trim()));
    } else {
      setHasStrokes(false);
      onChange('');
    }
  };

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    handleClear();
    setMode(newMode);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {hasStrokes && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-destructive hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-2">
        <button
          type="button"
          onClick={() => switchMode('draw')}
          className={`text-xs px-3 py-1 rounded-md transition-colors cursor-pointer ${
            mode === 'draw'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => switchMode('type')}
          className={`text-xs px-3 py-1 rounded-md transition-colors cursor-pointer ${
            mode === 'type'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="relative" style={{ touchAction: 'none' }}>
          <canvas
            ref={canvasRef}
            className="w-full bg-white border border-border rounded-lg cursor-crosshair"
            style={{ height: '120px' }}
            onMouseDown={startStroke}
            onMouseMove={draw}
            onMouseUp={endStroke}
            onMouseLeave={endStroke}
            onTouchStart={startStroke}
            onTouchMove={draw}
            onTouchEnd={endStroke}
          />
          {!hasStrokes && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm text-muted-foreground/50">Sign here</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={typedName}
            onChange={(e) => handleTypeChange(e.target.value)}
            placeholder="Type your full name"
            maxLength={100}
            className="w-full h-[120px] bg-white border border-border rounded-lg px-4 text-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
          />
          {typedName && (
            <div className="absolute bottom-3 left-4 right-4 border-t border-muted-foreground/20" />
          )}
        </div>
      )}
    </div>
  );
}
