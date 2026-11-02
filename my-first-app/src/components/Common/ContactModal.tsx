import { PhoneCall, X } from 'lucide-react';

export const cleanPhoneNumber = (p?: string | null) => {
  if (!p) return '';
  return p.replace(/[^0-9]/g, '');
};

interface ContactModalProps {
  phone?: string | null;
  title?: string;
  subtitle?: string;
  onClose: () => void;
}

export const ContactModal = ({
  phone,
  title = 'Liên hệ chủ trọ',
  subtitle = 'Hỗ trợ tư vấn thuê phòng, giải đáp thủ tục và xem phòng trực tiếp',
  onClose,
}: ContactModalProps) => {
  const cleanPhone = cleanPhoneNumber(phone);
  const zaloUrl = cleanPhone ? `https://zalo.me/${cleanPhone}` : '#';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {phone ? (
          <>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Hotline / Zalo:</span>
              <span className="text-white font-bold font-mono text-base text-orange-400">{phone}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 bg-[#0068FF]/15 hover:bg-[#0068FF]/25 border border-[#0068FF]/40 hover:border-[#0068FF] text-white font-semibold py-4 rounded-2xl transition-all shadow-md group cursor-pointer"
                title="Mở Zalo chat"
              >
                <div className="w-8 h-8 rounded-xl bg-[#0068FF] flex items-center justify-center text-white font-black text-xs shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  Zalo
                </div>
                <span className="text-sm font-bold text-blue-300">Nhắn Zalo</span>
              </a>
              <a
                href={`tel:${cleanPhone || phone}`}
                className="flex flex-col items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-orange-500/30 active:scale-95 cursor-pointer"
                title="Gọi điện trực tiếp"
              >
                <PhoneCall size={24} />
                <span className="text-sm font-bold">Gọi điện</span>
              </a>
            </div>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <span>Hỗ trợ trực tuyến</span>
              <a
                href={`sms:${cleanPhone || phone}`}
                className="text-slate-400 hover:text-orange-400 underline transition-colors"
                title="Gửi tin nhắn SMS"
              >
                Gửi tin nhắn SMS
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">
            Chưa cập nhật số điện thoại liên hệ. Vui lòng thử lại sau.
          </p>
        )}
      </div>
    </div>
  );
};

export default ContactModal;

