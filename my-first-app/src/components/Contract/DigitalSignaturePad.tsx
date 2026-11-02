import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenTool,
  RotateCcw,
  Trash2,
  Upload,
  CheckCircle,
  ShieldCheck,
  Type,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';

interface DigitalSignaturePadProps {
  value?: string | null;
  onChange: (signatureDataUrl: string | null) => void;
  fullName?: string;
  readOnly?: boolean;
}

const PEN_COLORS = [
  { name: 'Xanh mực bút ký', value: '#1d4ed8', border: 'border-blue-600' },
  { name: 'Đen truyền thống', value: '#0f172a', border: 'border-slate-800' },
  { name: 'Xanh đậm pháp lý', value: '#0369a1', border: 'border-sky-700' },
];

const PEN_SIZES = [
  { label: 'Mảnh', value: 2 },
  { label: 'Vừa', value: 3 },
  { label: 'Đậm', value: 4.5 },
];

const SIGNATURE_STYLES = [
  { id: 'style1', name: 'Thư pháp mềm mại', font: 'italic font-serif tracking-wider text-2xl', cssFont: 'italic 28px "Times New Roman", serif' },
  { id: 'style2', name: 'Nghệ thuật bay bổng', font: 'italic font-sans tracking-widest text-2xl font-light', cssFont: 'italic 28px "Brush Script MT", cursive, sans-serif' },
  { id: 'style3', name: 'Chữ ký công sở', font: 'font-mono font-bold tracking-tight text-xl', cssFont: 'bold 24px "Courier New", monospace' },
  { id: 'style4', name: 'Hiện đại tối giản', font: 'font-sans font-bold italic tracking-wide text-2xl', cssFont: 'bold italic 26px "Segoe UI", Arial, sans-serif' },
];

export const DigitalSignaturePad: React.FC<DigitalSignaturePadProps> = ({
  value,
  onChange,
  fullName = '',
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1d4ed8');
  const [penSize, setPenSize] = useState(3);
  const [strokes, setStrokes] = useState<ImageData[]>([]);
  const [hasSignature, setHasSignature] = useState(false);

  // Mode Type Name
  const [typedName, setTypedName] = useState(fullName || '');
  const [selectedStyle, setSelectedStyle] = useState('style1');

  // Confirmation
  const [isConfirmed, setIsConfirmed] = useState(true);

  // Sync typedName with fullName if prop updates
  useEffect(() => {
    if (fullName && !typedName) {
      setTypedName(fullName);
    }
  }, [fullName, typedName]);

  // Set initial canvas size & background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 560) * dpr;
    canvas.height = 180 * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, 180);

    // If an initial value exists (data URL or URL), render it
    if (value) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, 180);
        // Center image
        const scale = Math.min((rect.width - 20) / img.width, (180 - 20) / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (rect.width - w) / 2;
        const y = (180 - h) / 2;
        ctx.drawImage(img, x, y, w, h);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const saveCurrentStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokes((prev) => [...prev, imageData]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCurrentStroke();

    const { x, y } = getCanvasCoordinates(e);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    exportSignature();
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, 180);
    setStrokes([]);
    setHasSignature(false);
    onChange(null);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || strokes.length === 0) return;

    const lastState = strokes[strokes.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setStrokes((prev) => prev.slice(0, -1));

    if (strokes.length <= 1) {
      setHasSignature(false);
      onChange(null);
    } else {
      exportSignature();
    }
  };

  // Render selected typed style to canvas
  const applyTypedSignature = (styleId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = SIGNATURE_STYLES.find((s) => s.id === styleId) || SIGNATURE_STYLES[0];
    const textToDraw = typedName.trim() || fullName || 'Chữ Ký Số';

    saveCurrentStroke();

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, 180);

    ctx.save();
    ctx.font = style.cssFont;
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textToDraw, rect.width / 2, 85);

    // Add an artistic underline
    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    const textWidth = ctx.measureText(textToDraw).width;
    const startX = Math.max(20, rect.width / 2 - textWidth / 2 - 15);
    const endX = Math.min(rect.width - 20, rect.width / 2 + textWidth / 2 + 25);
    ctx.moveTo(startX, 115);
    ctx.quadraticCurveTo(rect.width / 2, 125, endX, 110);
    ctx.stroke();

    ctx.restore();

    setHasSignature(true);
    exportSignature();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        saveCurrentStroke();

        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, 180);

        const scale = Math.min((rect.width - 40) / img.width, (180 - 40) / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (rect.width - w) / 2;
        const y = (180 - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        setHasSignature(true);
        exportSignature();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('draw')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PenTool size={14} /> Vẽ chữ ký tay
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('type')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'type'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Type size={14} /> Ký theo tên (Mẫu đẹp)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload size={14} /> Tải ảnh chữ ký
            </button>
          </div>

          {/* Color & Size picker for drawing */}
          {activeTab === 'draw' && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Màu:</span>
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setPenColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                    className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                      penColor === c.value ? 'ring-2 ring-orange-500 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>

              <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-1">
                {PEN_SIZES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setPenSize(s.value)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      penSize === s.value
                        ? 'bg-slate-800 text-orange-400 border border-orange-500/30'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Ký theo mẫu tên */}
      {activeTab === 'type' && !readOnly && (
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Nhập họ và tên của bạn..."
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {SIGNATURE_STYLES.map((st) => (
              <div
                key={st.id}
                onClick={() => {
                  setSelectedStyle(st.id);
                  applyTypedSignature(st.id);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedStyle === st.id
                    ? 'border-orange-500 bg-orange-500/10 shadow-sm'
                    : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span>{st.name}</span>
                  {selectedStyle === st.id && (
                    <span className="flex items-center gap-1 text-orange-400 text-[10px] font-bold">
                      <CheckCircle size={12} /> Đã chọn
                    </span>
                  )}
                </div>
                <div className={`py-2 text-center text-blue-400 select-none ${st.font}`}>
                  {typedName.trim() || fullName || 'Nguyễn Văn A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Tải ảnh chữ ký */}
      {activeTab === 'upload' && !readOnly && (
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
          <label className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 font-bold text-xs cursor-pointer transition-all">
            <Upload size={16} /> Chọn ảnh chữ ký từ máy tính/điện thoại (PNG/JPG)
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-[11px] text-slate-400">
            Nên dùng ảnh chụp hoặc scan chữ ký rõ nét trên nền trắng hoặc trong suốt.
          </p>
        </div>
      )}

      {/* Main Canvas Pad Area */}
      <div className="relative rounded-2xl border border-slate-700 bg-white shadow-inner overflow-hidden">
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
          className={`w-full h-[180px] block cursor-crosshair ${
            readOnly ? 'pointer-events-none' : ''
          }`}
        />

        {/* Watermark grid & guideline */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-[11px] text-slate-400 select-none">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              Khung ký số điện tử TroHub e-Sign
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {new Date().toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="border-b border-dashed border-slate-300 w-full flex justify-between items-end pb-1 select-none">
            <span className="text-[10px] italic text-slate-400">
              Ký tên trực tiếp tại đây (dùng chuột hoặc ngón tay cảm ứng)
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {fullName ? `BÊN B: ${fullName}` : 'BÊN B (Khách thuê)'}
            </span>
          </div>
        </div>

        {/* Action buttons inside canvas bottom-right */}
        {!readOnly && (
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 z-10">
            {strokes.length > 0 && (
              <button
                type="button"
                onClick={undoLastStroke}
                className="px-2.5 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm transition-all cursor-pointer shadow-sm"
                title="Hoàn tác nét vừa vẽ"
              >
                <RotateCcw size={12} /> Hoàn tác
              </button>
            )}
            {hasSignature && (
              <button
                type="button"
                onClick={clearCanvas}
                className="px-2.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 backdrop-blur-sm transition-all cursor-pointer shadow-sm"
                title="Xóa làm lại chữ ký"
              >
                <Trash2 size={12} /> Ký lại
              </button>
            )}
          </div>
        )}
      </div>

      {/* Legal & Digital Certificate Verification Stamp */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center gap-2">
              <strong className="text-white text-xs font-bold uppercase tracking-wide">
                Chứng thư số & Xác thực pháp lý
              </strong>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                TroHub Verified
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
              Chữ ký số điện tử đáp ứng đầy đủ quy chuẩn theo <strong>Luật Giao dịch điện tử số 20/2023/QH15</strong>.
              Hệ thống tự động mã hóa chuỗi băm <strong>SHA-256</strong> kèm mốc thời gian (Timestamp) để đảm bảo tính toàn vẹn và chống chối bỏ.
            </p>
          </div>
        </div>

        {/* Checkbox agreement */}
        <label className="flex items-start gap-2.5 pt-2 border-t border-slate-850 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-orange-500 bg-slate-900 border-slate-700 focus:ring-orange-500 cursor-pointer"
          />
          <span className="text-xs text-slate-300">
            Tôi xác nhận mẫu chữ ký trên đại diện hợp pháp cho tôi và đồng ý ký kết hợp đồng thuê phòng bằng phương thức điện tử này.
          </span>
        </label>
      </div>
    </div>
  );
};

export default DigitalSignaturePad;

