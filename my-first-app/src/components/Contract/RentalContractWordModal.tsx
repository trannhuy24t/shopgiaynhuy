import { useState } from 'react';
import type { ContractDto } from '../../types/contract';
import type { RoomDto } from '../../types/room';
import StatusBadge from '../Common/StatusBadge';
import OccupantManager from '../Common/OccupantManager';
import {
  exportContractToWordDoc,
  numberToVietnameseWords,
  parseDateDetails,
  calculateDurationMonths,
  parseAmenitiesList,
} from '../../utils/contractDocUtils';
import {
  FileText,
  Download,
  Printer,
  X,
  Users,
  ShieldCheck,
  Type,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface RentalContractWordModalProps {
  contract: ContractDto;
  room?: RoomDto | null;
  onClose: () => void;
  isAdminOrStaff?: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

export const RentalContractWordModal = ({
  contract,
  room,
  onClose,
  isAdminOrStaff = false,
}: RentalContractWordModalProps) => {
  const [activeTab, setActiveTab] = useState<'contract' | 'occupants'>('contract');
  const [fontFamily, setFontFamily] = useState<'times' | 'arial' | 'inter'>('times');
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'md' | 'lg'>('md');

  const roomNumber = contract.roomNumber || room?.roomNumber || String(contract.roomId);
  const createdDate = parseDateDetails(contract.createdAt || contract.startDate);
  const startDate = parseDateDetails(contract.startDate);
  const endDate = parseDateDetails(contract.endDate);
  const durationMonths = calculateDurationMonths(contract.startDate, contract.endDate);

  const buildingName = (contract.buildingName || room?.buildingName || 'Khu Căn hộ / Nhà trọ TroHub').normalize('NFC');
  const buildingAddress = (
    contract.buildingAddress ||
    room?.buildingAddress ||
    'Hệ thống quản lý nhà trọ TroHub, Việt Nam'
  ).normalize('NFC');
  const landlordName = (contract.landlordName || 'Ban Quản lý Tòa nhà TroHub').normalize('NFC');
  const landlordPhone = contract.landlordPhone || '0988.xxx.xxx';

  const tenantName = (contract.tenantName || 'Khách thuê').normalize('NFC');
  const tenantPhone = contract.tenantPhone || '...........................................';
  const tenantIdCard = contract.tenantIdCard || '...........................................';
  const tenantEmail = contract.tenantEmail || '...........................................';

  const roomArea = contract.roomArea || room?.area || 25;
  const roomServiceFee = contract.roomServiceFee || room?.serviceFee || 150000;
  const roomType = contract.roomType || room?.roomType;
  const roomAmenities = contract.roomAmenities || room?.amenities;
  const amenitiesList = parseAmenitiesList(roomAmenities);

  const monthlyRentWords = numberToVietnameseWords(contract.monthlyRent);
  const depositWords = numberToVietnameseWords(contract.deposit);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadWord = () => {
    exportContractToWordDoc(contract, room);
  };

  // Font family inline mapping để đảm bảo không bị dính Cambria/Georgia gây lỗi dấu tiếng Việt
  const getFontFamilyStyle = () => {
    switch (fontFamily) {
      case 'times':
        return { fontFamily: '"Times New Roman", Times, "Liberation Serif", serif' };
      case 'arial':
        return { fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif' };
      case 'inter':
        return { fontFamily: 'Inter, system-ui, -apple-system, sans-serif' };
    }
  };

  const getFontSizeClass = () => {
    switch (fontSizeLevel) {
      case 'sm':
        return 'text-[13px] leading-[1.55]';
      case 'md':
        return 'text-[15px] leading-[1.65]';
      case 'lg':
        return 'text-[17px] leading-[1.75]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex flex-col">
      {/* CSS đặc thù cho in ấn chuẩn thể thức hành chính A4 */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, header, footer, nav, .print-hide {
            display: none !important;
          }
          .word-document-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          .word-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 12mm 18mm !important;
            width: 100% !important;
            min-height: auto !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

      {/* Thanh công cụ Word Ribbon / Toolbar (Ẩn khi in) */}
      <div className="no-print sticky top-0 z-20 bg-slate-900 border-b border-slate-800 shadow-xl px-4 py-2.5 sm:px-6">
        <div className="container mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-3">
          {/* Thông tin tài liệu */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  HopDong_ThuePhong_{roomNumber}_HD{contract.id}.doc
                </h2>
                <StatusBadge entity="contract" value={contract.status} />
              </div>
              <p className="text-[11px] text-slate-400">
                Phòng {roomNumber} • {buildingName}
              </p>
            </div>
          </div>

          {/* Công cụ phông chữ & Thao tác */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bộ chọn phông chữ */}
            <div className="hidden md:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="px-2 py-1 text-[11px] text-slate-500 flex items-center gap-1 font-semibold">
                <Type size={13} /> Phông:
              </span>
              <button
                type="button"
                onClick={() => setFontFamily('times')}
                className={`px-2.5 py-1 rounded-lg text-xs font-serif transition-colors ${
                  fontFamily === 'times' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                }`}
                title="Times New Roman (Chuẩn văn bản hành chính theo Nghị định 30)"
              >
                Times New Roman
              </button>
              <button
                type="button"
                onClick={() => setFontFamily('arial')}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-colors ${
                  fontFamily === 'arial' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                }`}
                title="Arial (Không chân, rõ nét)"
              >
                Arial
              </button>
              <button
                type="button"
                onClick={() => setFontFamily('inter')}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-colors ${
                  fontFamily === 'inter' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'
                }`}
                title="Inter (Hiện đại)"
              >
                Inter
              </button>
            </div>

            {/* Chỉnh cỡ chữ */}
            <div className="flex items-center bg-slate-950 px-1 py-1 rounded-xl border border-slate-800 text-slate-400">
              <button
                type="button"
                onClick={() => setFontSizeLevel('sm')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  fontSizeLevel === 'sm' ? 'bg-slate-800 text-white' : 'hover:text-white'
                }`}
                title="Cỡ chữ nhỏ"
              >
                <ZoomOut size={14} />
              </button>
              <span className="px-2 text-[11px] font-semibold text-slate-300 uppercase select-none">
                {fontSizeLevel === 'sm' ? '13pt' : fontSizeLevel === 'md' ? '14pt' : '15pt'}
              </span>
              <button
                type="button"
                onClick={() => setFontSizeLevel('lg')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                  fontSizeLevel === 'lg' ? 'bg-slate-800 text-white' : 'hover:text-white'
                }`}
                title="Cỡ chữ lớn"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Nút Tải Word .doc */}
            <button
              type="button"
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 cursor-pointer active:scale-95"
              title="Tải file Microsoft Word (.doc) về máy tính"
            >
              <Download size={14} />
              <span>Tải Word (.doc)</span>
            </button>

            {/* Nút In ấn / Xuất PDF */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer active:scale-95"
              title="In hoặc Lưu dưới dạng PDF"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">In / Xuất PDF</span>
            </button>

            {/* Nút Đóng */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Đóng xem hợp đồng"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Nội dung chính */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/70">
        {activeTab === 'occupants' ? (
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl h-fit">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Khai báo người ở cùng phòng {roomNumber}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Số lượng người ở theo hợp đồng: {contract.numberOfOccupants || 1} người (bao gồm người đứng hợp đồng).
                </p>
              </div>
            </div>

            <OccupantManager
              contractId={contract.id}
              numberOfOccupants={contract.numberOfOccupants || 1}
              contractStatus={contract.status}
              readOnly={!isAdminOrStaff && contract.status !== 'DangHieuLuc'}
            />

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('contract')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Quay lại xem hợp đồng
              </button>
            </div>
          </div>
        ) : (
          /* TRANG GIẤY A4 WORD CHUẨN THỂ THỨC HÀNH CHÍNH VIỆT NAM */
          <div className="word-document-container w-full max-w-4xl">
            <div
              className={`word-page bg-white text-slate-900 shadow-2xl rounded-sm p-8 sm:p-14 lg:p-16 border border-slate-200 ${getFontSizeClass()}`}
              style={getFontFamilyStyle()}
            >
              {/* PHẦN ĐẦU: QUỐC HIỆU & TIÊU NGỮ (THEO NGHỊ ĐỊNH 30/2020/NĐ-CP) */}
              <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-slate-300">
                <div className="text-center">
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wide text-slate-900">
                    {buildingName.toUpperCase()}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                    Số: <strong>{contract.id}/{createdDate.year}/HĐTN-TROHUB</strong>
                  </p>
                  <div className="w-24 h-[1px] bg-slate-400 mx-auto mt-1.5" />
                </div>

                <div className="text-center">
                  <p className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </p>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">
                    Độc lập - Tự do - Hạnh phúc
                  </p>
                  {/* Đường kẻ ngang dưới tiêu ngữ bằng độ dài của chữ */}
                  <div className="w-36 h-[1.5px] bg-slate-800 mx-auto mt-1 mb-2" />
                  <p className="italic text-xs text-slate-600">
                    ..., ngày {createdDate.day} tháng {createdDate.month} năm {createdDate.year}
                  </p>
                </div>
              </div>

              {/* TIÊU ĐỀ HỢP ĐỒNG */}
              <div className="text-center my-6">
                <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900">
                  HỢP ĐỒNG THUÊ PHÒNG TRỌ / NHÀ Ở
                </h1>
                <p className="italic text-xs sm:text-sm text-slate-600 mt-1">
                  (Mã hợp đồng: #{contract.id} — Căn phòng số: {roomNumber})
                </p>
              </div>

              {/* CĂN CỨ PHÁP LÝ */}
              <div className="italic text-xs sm:text-sm text-slate-700 space-y-1 mb-6 text-justify">
                <p>- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước CHXHCN Việt Nam;</p>
                <p>- Căn cứ Luật Nhà ở số 27/2023/QH15 ngày 27/11/2023 của Quốc hội nước CHXHCN Việt Nam;</p>
                <p>- Căn cứ vào nhu cầu thực tế và sự thỏa thuận tự nguyện, bình đẳng của hai bên tham gia giao dịch.</p>
              </div>

              <p className="mb-4 text-justify">
                Hôm nay, ngày {createdDate.day} tháng {createdDate.month} năm {createdDate.year}, tại cơ sở{' '}
                <strong>{buildingName}</strong> (Địa chỉ: {buildingAddress}), chúng tôi gồm các bên dưới đây:
              </p>

              {/* PHẦN I: THÔNG TIN BÊN A */}
              <div className="mb-5">
                <p className="font-bold uppercase text-slate-900 mb-2">
                  I. BÊN CHO THUÊ (BÊN A):
                </p>
                <div className="space-y-1.5 pl-4 text-slate-800">
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Họ và tên người đại diện:</span>
                    <strong className="text-slate-950">{landlordName}</strong>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Cơ sở nhà trọ / căn hộ:</span>
                    <span>{buildingName}</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Địa chỉ cơ sở:</span>
                    <span>{buildingAddress}</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Số điện thoại liên hệ:</span>
                    <strong className="text-slate-950 font-mono">{landlordPhone}</strong>
                  </div>
                </div>
              </div>

              {/* PHẦN II: THÔNG TIN BÊN B */}
              <div className="mb-6">
                <p className="font-bold uppercase text-slate-900 mb-2">
                  II. BÊN THUÊ (BÊN B):
                </p>
                <div className="space-y-1.5 pl-4 text-slate-800">
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Họ và tên người thuê:</span>
                    <strong className="text-slate-950">{tenantName}</strong>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Số CCCD / CMND:</span>
                    <strong className="text-slate-950 font-mono">{tenantIdCard}</strong>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Số điện thoại liên hệ:</span>
                    <strong className="text-slate-950 font-mono">{tenantPhone}</strong>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Thư điện tử (Email):</span>
                    <span>{tenantEmail}</span>
                  </div>
                  <div className="flex flex-wrap">
                    <span className="w-56 text-slate-700">- Số người ở thực tế đăng ký:</span>
                    <span>
                      <strong className="text-slate-950">{contract.numberOfOccupants || 1} người</strong> (Bao gồm người đứng tên hợp đồng và người ở cùng được khai báo).
                    </span>
                  </div>
                </div>
              </div>

              <p className="mb-4 text-justify">
                Hai bên đã cùng nhau trao đổi, bàn bạc và hoàn toàn thống nhất ký kết Hợp đồng thuê phòng với các điều khoản cụ thể sau đây:
              </p>

              {/* PHẦN III: CÁC ĐIỀU KHOẢN HỢP ĐỒNG */}
              <div className="space-y-5 text-slate-800">
                {/* ĐIỀU 1 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 1: ĐỐI TƯỢNG VÀ MỤC ĐÍCH THUÊ
                  </h3>
                  <div className="space-y-1 pl-4 text-justify">
                    <p>
                      <strong>1.1.</strong> Bên A đồng ý cho Bên B thuê căn phòng số: <strong>{roomNumber}</strong>{roomType ? ` (Loại: ${roomType})` : ''}, diện tích sử dụng khoảng: <strong>{roomArea} m²</strong>, thuộc cơ sở <strong>{buildingName}</strong>, tại địa chỉ: {buildingAddress}.
                    </p>
                    <div className="mt-3">
                      <p className="font-bold text-slate-900 mb-1.5">
                        <strong>1.2. Danh mục trang thiết bị, tài sản và đồ đạc bàn giao kèm theo phòng:</strong>
                      </p>
                      <div className="overflow-x-auto my-2 border border-slate-300 rounded-lg">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-center">
                              <th className="p-2 border-r border-slate-300 w-10">STT</th>
                              <th className="p-2 border-r border-slate-300 text-left">Tên trang thiết bị / Tài sản</th>
                              <th className="p-2 border-r border-slate-300 w-20">Số lượng</th>
                              <th className="p-2 border-r border-slate-300 w-20">Đơn vị</th>
                              <th className="p-2 border-r border-slate-300 text-left">Hiện trạng bàn giao</th>
                              <th className="p-2 text-left">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {amenitiesList.map((item) => (
                              <tr key={item.stt} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2 text-center border-r border-slate-200 font-medium">{item.stt}</td>
                                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{item.name}</td>
                                <td className="p-2 text-center border-r border-slate-200 font-bold text-slate-900">
                                  {String(item.quantity).padStart(2, '0')}
                                </td>
                                <td className="p-2 text-center border-r border-slate-200 text-slate-700">{item.unit}</td>
                                <td className="p-2 border-r border-slate-200 text-slate-800">{item.condition}</td>
                                <td className="p-2 text-slate-500 italic text-xs">{item.note || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="italic text-xs text-slate-600 mt-1">
                        * Hai bên đã cùng nhau kiểm tra, chạy thử và xác nhận toàn bộ trang thiết bị nêu trên hoạt động bình thường trước khi ký hợp đồng. Bên B có nghĩa vụ sử dụng đúng công năng và bảo quản nguyên vẹn các tài sản trên trong suốt thời hạn hợp đồng.
                      </p>
                    </div>
                    <p className="mt-2">
                      <strong>1.3.</strong> Mục đích thuê: Dùng làm nơi ở và sinh hoạt cá nhân / gia đình hợp pháp. Bên B cam kết không sử dụng căn phòng vào mục đích kinh doanh trái phép, không tổ chức các hoạt động vi phạm pháp luật, không sang nhượng hoặc cho bên thứ ba thuê lại nếu không được sự đồng ý bằng văn bản của Bên A.
                    </p>
                  </div>
                </section>

                {/* ĐIỀU 2 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 2: THỜI HẠN THUÊ PHÒNG
                  </h3>
                  <div className="space-y-1 pl-4 text-justify">
                    <p>
                      <strong>2.1.</strong> Thời hạn thuê là <strong>{durationMonths} tháng</strong>, bắt đầu từ ngày <strong>{startDate.full}</strong> đến hết ngày <strong>{endDate.full}</strong>.
                    </p>
                    <p>
                      <strong>2.2.</strong> Trước khi hết hạn hợp đồng tối thiểu 30 ngày, nếu Bên B có nguyện vọng tiếp tục thuê thì phải thông báo cho Bên A để hai bên cùng làm thủ tục gia hạn hoặc ký hợp đồng mới.
                    </p>
                  </div>
                </section>

                {/* ĐIỀU 3 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC VÀ CÁC KHOẢN PHÍ DỊCH VỤ
                  </h3>
                  <div className="space-y-1.5 pl-4 text-justify">
                    <p>
                      <strong>3.1. Giá thuê phòng:</strong> <strong>{formatPrice(contract.monthlyRent)} / tháng</strong> (Bằng chữ: <em>{monthlyRentWords}</em>). Giá thuê này được cam kết giữ ổn định trong suốt thời hạn hợp đồng.
                    </p>
                    <p>
                      <strong>3.2. Tiền đặt cọc:</strong> <strong>{formatPrice(contract.deposit)}</strong> (Bằng chữ: <em>{depositWords}</em>).
                    </p>
                    <p className="pl-4">
                      - Khoản tiền đặt cọc này nhằm bảo đảm Bên B tuân thủ đúng các điều khoản trong hợp đồng và giữ gìn các trang thiết bị tài sản trong phòng.
                    </p>
                    <p className="pl-4">
                      - Tiền cọc sẽ được Bên A hoàn trả đầy đủ cho Bên B khi kết thúc hợp đồng, sau khi đã đối trừ các chi phí hóa đơn điện, nước, dịch vụ còn tồn đọng hoặc chi phí khắc phục hư hao tài sản do Bên B gây ra (nếu có).
                    </p>
                    <p>
                      <strong>3.3. Các khoản chi phí dịch vụ sinh hoạt hàng tháng:</strong>
                    </p>
                    <div className="pl-4 space-y-1">
                      <p>• <strong>Tiền điện sinh hoạt:</strong> <strong>{formatPrice(contract.electricUnitPrice || 3500)} / kWh</strong> (tính theo chỉ số công tơ điện riêng của phòng hàng tháng).</p>
                      <p>• <strong>Tiền nước sinh hoạt:</strong> <strong>{formatPrice(contract.waterUnitPrice || 35000)} / m³</strong> (tính theo chỉ số đồng hồ nước thực tế của phòng hàng tháng).</p>
                      <p>• <strong>Phí dịch vụ chung:</strong> <strong>{formatPrice(roomServiceFee)} / người / tháng</strong> (bao gồm internet wifi, thu gom rác, vệ sinh hành lang và chiếu sáng không gian chung).</p>
                    </div>
                    <p>
                      <strong>3.4. Kỳ hạn thanh toán:</strong> Bên B có trách nhiệm thanh toán toàn bộ tiền thuê phòng và các chi phí dịch vụ phát sinh từ ngày <strong>01 đến ngày 05</strong> dương lịch hàng tháng qua hình thức tiền mặt, chuyển khoản ngân hàng hoặc quét mã thanh toán VietQR.
                    </p>
                  </div>
                </section>

                {/* ĐIỀU 4 */}
                <section>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 uppercase">
                      ĐIỀU 4: DANH SÁCH NGƯỜI LƯU TRÚ (NGƯỜI Ở CÙNG)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('occupants')}
                      className="no-print text-xs text-blue-600 hover:text-blue-800 underline font-sans cursor-pointer"
                    >
                      [Quản lý người ở cùng]
                    </button>
                  </div>
                  <div className="pl-4 text-justify">
                    <p className="mb-2">
                      Bên B đăng ký số lượng người cư trú tại phòng là <strong>{contract.numberOfOccupants || 1} người</strong>, bao gồm Bên B và những người có thông tin sau:
                    </p>
                    {contract.occupants && contract.occupants.length > 0 ? (
                      <div className="overflow-x-auto my-2">
                        <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-left">
                          <thead>
                            <tr className="bg-slate-100 text-slate-900 font-bold">
                              <th className="border border-slate-400 p-2 text-center w-10">STT</th>
                              <th className="border border-slate-400 p-2">Họ và tên</th>
                              <th className="border border-slate-400 p-2">Mối quan hệ</th>
                              <th className="border border-slate-400 p-2">Số CCCD / CMND</th>
                              <th className="border border-slate-400 p-2">Số điện thoại</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contract.occupants.map((occ, idx) => (
                              <tr key={occ.id}>
                                <td className="border border-slate-400 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-400 p-2 font-semibold text-slate-950">{occ.fullName}</td>
                                <td className="border border-slate-400 p-2">{occ.relationship}</td>
                                <td className="border border-slate-400 p-2 font-mono">{occ.idCardNumber || '—'}</td>
                                <td className="border border-slate-400 p-2 font-mono">{occ.phone || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="italic text-xs text-slate-600 py-1">
                        (Hiện tại chưa có người ở cùng được khai báo thêm. Chỉ Bên B đứng tên đại diện cư trú).
                      </p>
                    )}
                  </div>
                </section>

                {/* ĐIỀU 5 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 5: TRÁCH NHIỆM VÀ QUYỀN HẠN CỦA BÊN CHO THUÊ (BÊN A)
                  </h3>
                  <div className="space-y-1 pl-4 text-justify">
                    <p><strong>5.1.</strong> Bàn giao phòng và các trang thiết bị nội thất kèm theo cho Bên B đúng thời hạn cam kết.</p>
                    <p><strong>5.2.</strong> Bảo đảm nguồn cung cấp điện, nước sinh hoạt và hệ thống kỹ thuật chung của tòa nhà hoạt động bình thường, ổn định.</p>
                    <p><strong>5.3.</strong> Kịp thời bảo trì, sửa chữa các sự cố hư hỏng thuộc về phần kết cấu khung nhà, đường dây điện chính, đường ống nước chính không do lỗi sử dụng của Bên B gây ra.</p>
                    <p><strong>5.4.</strong> Tôn trọng quyền riêng tư của Bên B; không tự ý vào phòng của Bên B khi chưa thông báo trước và chưa có sự đồng ý của Bên B (ngoại trừ tình huống khẩn cấp như hỏa hoạn, ngập nước nghiêm trọng hoặc có yêu cầu từ cơ quan công an).</p>
                  </div>
                </section>

                {/* ĐIỀU 6 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 6: TRÁCH NHIỆM VÀ NGHĨA VỤ CỦA BÊN THUÊ (BÊN B)
                  </h3>
                  <div className="space-y-1 pl-4 text-justify">
                    <p><strong>6.1.</strong> Thanh toán đầy đủ tiền thuê phòng và các chi phí dịch vụ phát sinh đúng thời hạn đã thỏa thuận tại Điều 3.</p>
                    <p><strong>6.2.</strong> Cung cấp đầy đủ giấy tờ tùy thân (CCCD) của bản thân và người ở cùng để Bên A làm thủ tục đăng ký tạm trú với cơ quan Công an có thẩm quyền theo quy định pháp luật.</p>
                    <p><strong>6.3.</strong> Giữ gìn an ninh trật tự, không mở loa đài âm lượng lớn, không gây ồn ào ảnh hưởng tới các phòng lân cận sau 23h00 đêm.</p>
                    <p><strong>6.4.</strong> Nghiêm cấm mọi hành vi vi phạm pháp luật trong khuôn viên nhà trọ: tàng trữ, buôn bán, sử dụng ma túy, chất nổ, vũ khí nguy hiểm, tổ chức đánh bạc, mại dâm.</p>
                    <p><strong>6.5.</strong> Chấp hành nghiêm ngặt các quy định về an toàn Phòng cháy chữa cháy (PCCC). Tắt các thiết bị điện sinh nhiệt khi không có mặt trong phòng.</p>
                    <p><strong>6.6.</strong> Có ý thức giữ gìn tài sản chung và riêng; không tự ý đục phá tường, thay đổi kết cấu xây dựng căn phòng khi chưa có sự đồng ý bằng văn bản của Bên A.</p>
                  </div>
                </section>

                {/* ĐIỀU 7 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 7: ĐIỀU KHOẢN CHẤM DỨT VÀ BỒI THƯỜNG HỢP ĐỒNG
                  </h3>
                  <div className="space-y-1 pl-4 text-justify">
                    <p><strong>7.1.</strong> Hợp đồng chấm dứt khi hết thời hạn thỏa thuận mà hai bên không có nhu cầu gia hạn.</p>
                    <p><strong>7.2.</strong> Trường hợp một bên muốn đơn phương chấm dứt hợp đồng trước hạn, phải có trách nhiệm thông báo bằng văn bản hoặc tin nhắn cho bên kia trước ít nhất <strong>30 ngày</strong>.</p>
                    <p><strong>7.3.</strong> Nếu Bên B tự ý bỏ phòng trước thời hạn mà không thông báo hoặc có hành vi vi phạm nghiêm trọng nội quy, Bên A có quyền đơn phương hủy hợp đồng và không hoàn trả tiền cọc.</p>
                    <p><strong>7.4.</strong> Khi kết thúc hợp đồng, Bên B bàn giao lại phòng và tài sản nguyên trạng, sạch sẽ, trả lại đầy đủ chìa khóa phòng cho Bên A.</p>
                  </div>
                </section>

                {/* ĐIỀU 8 */}
                <section>
                  <h3 className="font-bold text-slate-900 uppercase mb-1">
                    ĐIỀU 8: CAM KẾT CHUNG VÀ HIỆU LỰC HỢP ĐỒNG
                  </h3>
                  <div className="space-y-1 pl-4 text-justify">
                    <p><strong>8.1.</strong> Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản đã thỏa thuận trong hợp đồng này trên tinh thần tôn trọng, hợp tác.</p>
                    <p><strong>8.2.</strong> Hợp đồng này có hiệu lực kể từ ngày ký và Bên B hoàn tất thủ tục thanh toán tiền đặt cọc.</p>
                    <p><strong>8.3.</strong> Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để theo dõi và thực hiện.</p>
                  </div>
                </section>
              </div>

              {/* PHẦN IV: KHU VỰC KÝ TÊN VÀ CON DẤU */}
              <div className="mt-14 pt-6 border-t border-slate-300">
                <div className="grid grid-cols-2 gap-8 text-center">
                  {/* BÊN A */}
                  <div className="flex flex-col items-center">
                    <p className="font-bold uppercase text-slate-950">
                      ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)
                    </p>
                    <p className="italic text-xs text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</p>

                    {/* Dấu xác nhận điện tử TroHub */}
                    <div className="my-5 p-3 rounded-lg border border-dashed border-emerald-700/50 bg-emerald-50/80 text-emerald-900 flex items-center gap-2 text-xs">
                      <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                      <div className="text-left font-sans leading-tight">
                        <strong className="block text-[11px] uppercase tracking-wide">Xác thực hệ thống TroHub</strong>
                        <span className="text-[10px] text-emerald-800">Trạng thái: {contract.status}</span>
                      </div>
                    </div>

                    <p className="font-bold text-slate-950 mt-1">{landlordName}</p>
                  </div>

                  {/* BÊN B */}
                  <div className="flex flex-col items-center">
                    <p className="font-bold uppercase text-slate-950">
                      ĐẠI DIỆN BÊN THUÊ (BÊN B)
                    </p>
                    <p className="italic text-xs text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</p>

                    {/* Hiển thị Chữ ký số điện tử của khách thuê */}
                    {contract.tenantSignatureUrl ? (
                      <div className="my-3 flex flex-col items-center">
                        <div className="h-16 flex items-center justify-center">
                          <img
                            src={contract.tenantSignatureUrl}
                            alt="Chữ ký số khách thuê"
                            className="max-h-16 max-w-[180px] object-contain drop-shadow-sm"
                          />
                        </div>
                        {/* Stamp xác thực chữ ký điện tử */}
                        <div className="mt-2 px-2.5 py-1.5 rounded-lg border border-dashed border-emerald-600/70 bg-emerald-50 text-[10px] text-emerald-900 font-sans text-left leading-tight shadow-xs">
                          <div className="flex items-center gap-1 font-bold text-emerald-800 text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>ĐÃ KÝ SỐ ĐIỆN TỬ</span>
                          </div>
                          <div className="text-[9.5px] text-emerald-700 mt-0.5">
                            {contract.signedAt ? `Thời gian: ${new Date(contract.signedAt).toLocaleString('vi-VN')}` : 'Đã xác thực chữ ký số'}
                          </div>
                          {contract.signatureHash && (
                            <div className="font-mono text-[8.5px] text-slate-500 truncate max-w-[170px]" title={contract.signatureHash}>
                              SHA: {contract.signatureHash.substring(0, 16)}...
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-16 flex items-center justify-center my-3">
                        <span className="text-slate-800 text-lg font-bold tracking-wider italic font-serif">
                          {tenantName}
                        </span>
                      </div>
                    )}

                    <p className="font-bold text-slate-950 mt-1">{tenantName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalContractWordModal;
