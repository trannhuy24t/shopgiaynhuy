import type { ContractDto } from '../types/contract';
import type { RoomDto } from '../types/room';

// Chuyển số thành chữ tiếng Việt (chuẩn văn bản hợp đồng)
const ChuSo = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const Tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

function docSo3ChuSo(baso: number): string {
  let tram = Math.floor(baso / 100);
  let chuc = Math.floor((baso % 100) / 10);
  let donvi = baso % 10;
  let ketQua = '';

  if (tram === 0 && chuc === 0 && donvi === 0) return '';

  if (tram !== 0) {
    ketQua += ChuSo[tram] + ' trăm ';
    if (chuc === 0 && donvi !== 0) ketQua += 'lẻ ';
  }

  if (chuc !== 0 && chuc !== 1) {
    ketQua += ChuSo[chuc] + ' mươi';
    if (chuc === 0 && donvi !== 0) ketQua = ketQua + ' linh ';
  }

  if (chuc === 1) ketQua += 'mười';

  switch (donvi) {
    case 1:
      if (chuc !== 0 && chuc !== 1) ketQua += ' mốt';
      else ketQua += ' một';
      break;
    case 5:
      if (chuc === 0) ketQua += ' năm';
      else ketQua += ' lăm';
      break;
    default:
      if (donvi !== 0) {
        ketQua += ' ' + ChuSo[donvi];
      }
      break;
  }
  return ketQua.trim();
}

export function numberToVietnameseWords(soTien: number): string {
  if (soTien === 0) return 'Không đồng';
  if (soTien < 0) return 'Số tiền không hợp lệ';

  let strSo = Math.round(soTien).toString();
  let lan = 0;
  let i = strSo.length;
  let viTri = [];
  let ketQua = '';

  while (i > 0) {
    viTri[lan] = parseInt(strSo.substring(Math.max(0, i - 3), i), 10);
    i -= 3;
    lan++;
  }

  for (let j = lan - 1; j >= 0; j--) {
    let doc = docSo3ChuSo(viTri[j]);
    if (doc !== '') {
      ketQua += doc + Tien[j] + ' ';
    }
  }

  ketQua = ketQua.trim();
  if (!ketQua) return 'Không đồng';

  // Viết hoa chữ cái đầu và thêm chữ "đồng"
  return ketQua.charAt(0).toUpperCase() + ketQua.slice(1) + ' đồng';
}

export function parseDateDetails(isoString: string) {
  if (!isoString) return { day: '.....', month: '.....', year: '2026', full: '...../...../2026' };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { day: '.....', month: '.....', year: '2026', full: '...../...../2026' };

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());

  return {
    day,
    month,
    year,
    full: `${day}/${month}/${year}`,
  };
}

export function calculateDurationMonths(startDateIso: string, endDateIso: string): number {
  if (!startDateIso || !endDateIso) return 12;
  const start = new Date(startDateIso);
  const end = new Date(endDateIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 12;

  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() >= start.getDate()) {
    months += 1;
  }
  return Math.max(1, months);
}

export interface RoomAmenityItem {
  stt: number;
  name: string;
  quantity: number;
  unit: string;
  condition: string;
  note: string;
}

// Hàm chuẩn hóa và bóc tách danh mục trang thiết bị kèm số lượng
export function parseAmenitiesList(rawAmenities?: string | null): RoomAmenityItem[] {
  const items: RoomAmenityItem[] = [];

  const rawList = (rawAmenities || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let stt = 1;

  for (const raw of rawList) {
    let name = raw;
    let quantity = 1;
    let unit = 'Chiếc';
    let condition = 'Hoạt động tốt, nguyên vẹn';
    let note = '';

    // Bóc tách số lượng từ các định dạng:
    // "Điều hòa (2 chiếc)", "Điều hòa (2 cái)", "Điều hòa: 2", "Điều hòa x2", "2 cái Điều hòa"
    const parenMatch = name.match(/[\(\[]\s*(?:số lượng[:\s]*)?(\d+)\s*([a-zA-Zà-ỹÀ-Ỹ\s]*?)[\)\]]/i);
    const colonMatch = name.match(/[:\-–xX]\s*(\d+)\s*([a-zA-Zà-ỹÀ-Ỹ\s]*)$/i);
    const prefixMatch = name.match(/^(\d+)\s*([a-zA-Zà-ỹÀ-Ỹ]+)\s+(.+)$/i);

    if (parenMatch) {
      quantity = parseInt(parenMatch[1], 10) || 1;
      if (parenMatch[2]?.trim()) unit = parenMatch[2].trim();
      name = name.replace(parenMatch[0], '').trim();
    } else if (colonMatch) {
      quantity = parseInt(colonMatch[1], 10) || 1;
      if (colonMatch[2]?.trim()) unit = colonMatch[2].trim();
      name = name.substring(0, colonMatch.index).trim();
    } else if (prefixMatch) {
      quantity = parseInt(prefixMatch[1], 10) || 1;
      if (prefixMatch[2]?.trim()) unit = prefixMatch[2].trim();
      name = prefixMatch[3].trim();
    }

    // Gán đơn vị tính và tình trạng tiêu chuẩn dựa theo tên thiết bị
    const lower = name.toLowerCase();
    if (lower.includes('điều hòa') || lower.includes('máy lạnh')) {
      if (!unit || unit === 'Chiếc') unit = 'Chiếc';
      condition = 'Hoạt động tốt, làm mát nhanh';
      note = 'Kèm 01 điều khiển từ xa';
    } else if (lower.includes('nóng lạnh')) {
      if (!unit || unit === 'Chiếc') unit = 'Bình';
      condition = 'Hoạt động tốt, role chống giật an toàn';
    } else if (lower.includes('tủ lạnh')) {
      if (!unit || unit === 'Chiếc') unit = 'Chiếc';
      condition = 'Làm đá & làm mát tốt, khay kính đủ';
    } else if (lower.includes('máy giặt')) {
      if (!unit || unit === 'Chiếc') unit = 'Chiếc';
      condition = 'Giặt vắt êm, cấp thoát nước tốt';
    } else if (lower.includes('giường')) {
      if (!unit || unit === 'Chiếc') unit = 'Bộ';
      condition = 'Chắc chắn, sạch sẽ, nguyên vẹn';
      note = 'Kèm đệm nệm';
    } else if (lower.includes('tủ quần áo') || lower.includes('tủ áo')) {
      if (!unit || unit === 'Chiếc') unit = 'Chiếc';
      condition = 'Cánh tủ và ray kéo trơn tru';
    } else if (lower.includes('bếp')) {
      if (!unit || unit === 'Chiếc') unit = 'Bộ';
      condition = 'Mặt bếp nguyên vẹn, bắt từ tốt';
      note = 'Kèm chậu rửa bát inox';
    } else if (lower.includes('bàn') || lower.includes('ghế')) {
      if (!unit || unit === 'Chiếc') unit = 'Bộ';
      condition = 'Chắc chắn, sạch đẹp, nguyên vẹn';
    } else if (lower.includes('sofa')) {
      if (!unit || unit === 'Chiếc') unit = 'Bộ';
      condition = 'Đệm êm, bọc sạch sẽ';
    } else if (lower.includes('khóa vân tay') || lower.includes('khóa điện tử')) {
      if (!unit || unit === 'Chiếc') unit = 'Bộ';
      condition = 'Cảm biến vân tay nhạy, pin tốt';
      note = 'Đã bàn giao mã bảo mật';
    } else if (lower.includes('wifi') || lower.includes('router')) {
      if (!unit || unit === 'Chiếc') unit = 'Thiết bị';
      condition = 'Tín hiệu sóng mạnh, kết nối ổn định';
      note = 'Kèm adapter nguồn';
    } else if (lower.includes('ban công') || lower.includes('cửa sổ')) {
      if (!unit || unit === 'Chiếc') unit = 'Khu vực';
      condition = 'Chốt khóa an toàn, thoáng mát';
      note = 'Kèm rèm che';
    } else if (lower.includes('quạt')) {
      if (!unit || unit === 'Chiếc') unit = 'Chiếc';
      condition = 'Quay êm, các số hoạt động bình thường';
    }

    if (name) {
      items.push({
        stt: stt++,
        name,
        quantity,
        unit,
        condition,
        note,
      });
    }
  }

  // Luôn bổ sung các trang thiết bị bàn giao phòng cơ bản thiết yếu
  const existingNames = items.map((i) => i.name.toLowerCase());

  if (!existingNames.some((n) => n.includes('chìa khóa') || n.includes('thẻ từ'))) {
    items.push({
      stt: stt++,
      name: 'Chìa khóa phòng & Thẻ từ thang máy/ra vào',
      quantity: 2,
      unit: 'Chiếc',
      condition: 'Mới, đóng mở tốt',
      note: '01 chìa khóa + 01 thẻ từ',
    });
  }

  if (!existingNames.some((n) => n.includes('công tơ') || n.includes('đồng hồ điện'))) {
    items.push({
      stt: stt++,
      name: 'Công tơ điện riêng phòng',
      quantity: 1,
      unit: 'Chiếc',
      condition: 'Chuẩn kiểm định, hoạt động bình thường',
      note: 'Chỉ số chốt khi nhận phòng',
    });
  }

  if (!existingNames.some((n) => n.includes('đồng hồ nước'))) {
    items.push({
      stt: stt++,
      name: 'Đồng hồ đo nước riêng phòng',
      quantity: 1,
      unit: 'Chiếc',
      condition: 'Hoạt động bình thường, không rò rỉ',
      note: 'Chỉ số chốt khi nhận phòng',
    });
  }

  if (!existingNames.some((n) => n.includes('vệ sinh') || n.includes('bồn cầu'))) {
    items.push({
      stt: stt++,
      name: 'Thiết bị vệ sinh (Bồn cầu, lavabo, vòi sen, gương)',
      quantity: 1,
      unit: 'Bộ',
      condition: 'Mới, cấp thoát nước tốt, sạch sẽ',
      note: '',
    });
  }

  return items;
}

// Xuất file Word (.doc) với markup chuẩn Microsoft Word Office HTML
export function exportContractToWordDoc(contract: ContractDto, room?: RoomDto | null) {
  const roomNumber = contract.roomNumber || (room?.roomNumber ?? String(contract.roomId));
  const createdDate = parseDateDetails(contract.createdAt || contract.startDate);
  const startDate = parseDateDetails(contract.startDate);
  const endDate = parseDateDetails(contract.endDate);
  const durationMonths = calculateDurationMonths(contract.startDate, contract.endDate);

  const buildingName = contract.buildingName || room?.buildingName || 'Khu Căn hộ / Nhà trọ TroHub';
  const buildingAddress = contract.buildingAddress || room?.buildingAddress || 'Hệ thống nhà trọ TroHub, Việt Nam';
  const landlordName = contract.landlordName || 'Ban Quản lý Tòa nhà TroHub';
  const landlordPhone = contract.landlordPhone || '0988.xxx.xxx';

  const tenantName = contract.tenantName || 'Khách thuê';
  const tenantPhone = contract.tenantPhone || '...........................................';
  const tenantIdCard = contract.tenantIdCard || '...........................................';
  const tenantEmail = contract.tenantEmail || '...........................................';

  const roomArea = contract.roomArea || room?.area || 25;
  const roomServiceFee = contract.roomServiceFee || room?.serviceFee || 150000;
  const roomType = contract.roomType || room?.roomType || 'Phòng trọ';
  const rawAmenities = contract.roomAmenities || room?.amenities || '';
  const amenitiesList = parseAmenitiesList(rawAmenities);

  const monthlyRentFormatted = new Intl.NumberFormat('vi-VN').format(contract.monthlyRent);
  const monthlyRentWords = numberToVietnameseWords(contract.monthlyRent);

  const depositFormatted = new Intl.NumberFormat('vi-VN').format(contract.deposit);
  const depositWords = numberToVietnameseWords(contract.deposit);

  const electricFormatted = new Intl.NumberFormat('vi-VN').format(contract.electricUnitPrice || 3500);
  const waterFormatted = new Intl.NumberFormat('vi-VN').format(contract.waterUnitPrice || 35000);
  const serviceFeeFormatted = new Intl.NumberFormat('vi-VN').format(roomServiceFee);

  // Tạo danh sách người ở cùng dạng bảng HTML cho Word
  let occupantsTableHtml = '';
  if (contract.occupants && contract.occupants.length > 0) {
    occupantsTableHtml = `
      <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:12pt;margin-top:8px;">
        <tr style="background-color:#f2f2f2;font-weight:bold;text-align:center;">
          <th style="width:40px;">STT</th>
          <th>Họ và tên</th>
          <th>Mối quan hệ</th>
          <th>Số CCCD/CMND</th>
          <th>Số điện thoại</th>
        </tr>
        ${contract.occupants
          .map(
            (o, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td>${o.fullName}</td>
            <td>${o.relationship}</td>
            <td>${o.idCardNumber || '—'}</td>
            <td>${o.phone || '—'}</td>
          </tr>
        `
          )
          .join('')}
      </table>
    `;
  } else {
    occupantsTableHtml = `<p style="font-style:italic;color:#555;margin:6px 0;">(Chưa đăng ký thêm người ở cùng. Chỉ người thuê đứng tên đại diện cư trú).</p>`;
  }

  // Tạo danh mục trang thiết bị và đồ đạc bàn giao dạng bảng HTML cho Word
  const amenitiesTableHtml = `
    <table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;font-size:11pt;margin:6pt 0 8pt 0;">
      <tr style="background-color:#f2f2f2;font-weight:bold;text-align:center;">
        <th style="width:36px;">STT</th>
        <th>Tên trang thiết bị / Tài sản</th>
        <th style="width:75px;">Số lượng</th>
        <th style="width:70px;">Đơn vị</th>
        <th>Hiện trạng bàn giao</th>
        <th>Ghi chú</th>
      </tr>
      ${amenitiesList
        .map(
          (item) => `
        <tr>
          <td style="text-align:center;">${item.stt}</td>
          <td><strong>${item.name}</strong></td>
          <td style="text-align:center;"><strong>${String(item.quantity).padStart(2, '0')}</strong></td>
          <td style="text-align:center;">${item.unit}</td>
          <td>${item.condition}</td>
          <td>${item.note || '—'}</td>
        </tr>
      `
        )
        .join('')}
    </table>
  `;

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>Hợp đồng thuê phòng ${roomNumber}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page Section1 {
          size: 595.3pt 841.9pt; /* A4 */
          margin: 56.7pt 56.7pt 56.7pt 56.7pt; /* 2cm */
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.45;
          color: #000000;
        }
        h1, h2, h3, h4, p { margin: 0 0 6pt 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .italic { font-style: italic; }
        .uppercase { text-transform: uppercase; }
        .clause-title { font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
      </style>
    </head>
    <body>
      <div class="Section1">
        <table style="width:100%;border:none;border-collapse:collapse;margin-bottom:12pt;">
          <tr>
            <td style="text-align:center;vertical-align:top;width:45%;">
              <p class="font-bold uppercase" style="font-size:11pt;">${buildingName.toUpperCase()}</p>
              <p style="font-size:11pt;">Số: ${contract.id}/${createdDate.year}/HĐTN</p>
            </td>
            <td style="text-align:center;vertical-align:top;width:55%;">
              <p class="font-bold uppercase" style="font-size:12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p class="font-bold" style="font-size:12pt;text-decoration:underline;">Độc lập - Tự do - Hạnh phúc</p>
              <p class="italic" style="font-size:10.5pt;margin-top:4pt;">..., ngày ${createdDate.day} tháng ${createdDate.month} năm ${createdDate.year}</p>
            </td>
          </tr>
        </table>

        <div class="text-center" style="margin: 16pt 0 14pt 0;">
          <h2 class="font-bold uppercase" style="font-size:16pt;letter-spacing:1px;">HỢP ĐỒNG THUÊ PHÒNG TRỌ / NHÀ Ở</h2>
          <p class="italic" style="font-size:11.5pt;">(Mã hợp đồng: #${contract.id} — Phòng số: ${roomNumber})</p>
        </div>

        <p class="italic" style="margin-bottom:4pt;">- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24 tháng 11 năm 2015;</p>
        <p class="italic" style="margin-bottom:4pt;">- Căn cứ Luật Nhà ở số 27/2023/QH15 ngày 27 tháng 11 năm 2023;</p>
        <p class="italic" style="margin-bottom:10pt;">- Căn cứ vào nhu cầu và sự thỏa thuận tự nguyện của hai bên tham gia giao dịch;</p>

        <p style="margin-bottom:8pt;">Hôm nay, ngày ${createdDate.day} tháng ${createdDate.month} năm ${createdDate.year}, tại địa chỉ: <strong>${buildingAddress}</strong>, chúng tôi gồm có:</p>

        <p class="font-bold" style="font-size:13.5pt;margin-top:8pt;">BÊN CHO THUÊ (BÊN A):</p>
        <table style="width:100%;border:none;margin-left:14pt;margin-bottom:8pt;">
          <tr><td style="width:180px;">Họ và tên đại diện:</td><td><strong>${landlordName}</strong></td></tr>
          <tr><td>Đại diện quản lý cơ sở:</td><td>${buildingName}</td></tr>
          <tr><td>Địa chỉ cơ sở:</td><td>${buildingAddress}</td></tr>
          <tr><td>Số điện thoại liên hệ:</td><td><strong>${landlordPhone}</strong></td></tr>
        </table>

        <p class="font-bold" style="font-size:13.5pt;margin-top:8pt;">BÊN THUÊ (BÊN B):</p>
        <table style="width:100%;border:none;margin-left:14pt;margin-bottom:10pt;">
          <tr><td style="width:180px;">Họ và tên người thuê:</td><td><strong>${tenantName}</strong></td></tr>
          <tr><td>Số CCCD / CMND:</td><td><strong>${tenantIdCard}</strong></td></tr>
          <tr><td>Số điện thoại liên hệ:</td><td><strong>${tenantPhone}</strong></td></tr>
          <tr><td>Thư điện tử (Email):</td><td>${tenantEmail}</td></tr>
          <tr><td>Số người ở đăng ký:</td><td><strong>${contract.numberOfOccupants || 1} người</strong></td></tr>
        </table>

        <p style="margin-bottom:10pt;">Hai bên thống nhất ký kết Hợp đồng thuê phòng với các điều khoản chi tiết như sau:</p>

        <p class="clause-title">ĐIỀU 1: ĐỐI TƯỢNG VÀ MỤC ĐÍCH HỢP ĐỒNG</p>
        <p>1.1. Bên A đồng ý cho Bên B thuê phòng số: <strong>${roomNumber}</strong>${roomType ? ` (Loại: <strong>${roomType}</strong>)` : ''}, diện tích sử dụng: <strong>${roomArea} m²</strong> thuộc cơ sở <strong>${buildingName}</strong>, tại địa chỉ: <strong>${buildingAddress}</strong>.</p>
        <p style="margin-top:6pt;"><strong>1.2. Danh mục trang thiết bị, tài sản và đồ đạc bàn giao kèm theo phòng:</strong></p>
        ${amenitiesTableHtml}
        <p style="font-size:10.5pt;font-style:italic;margin-bottom:6pt;">* Hai bên đã cùng nhau kiểm tra, chạy thử và xác nhận toàn bộ trang thiết bị trên hoạt động bình thường trước khi ký kết. Bên B có nghĩa vụ sử dụng đúng công năng và bảo quản nguyên vẹn các tài sản trên trong suốt thời hạn hợp đồng.</p>
        <p>1.3. Mục đích thuê: Sử dụng làm nơi ở sinh hoạt cá nhân / gia đình hợp pháp. Bên B không được sử dụng phòng vào mục đích kinh doanh trái phép, không tàng trữ hàng cấm, không tự ý chuyển nhượng hoặc cho bên thứ ba thuê lại nếu chưa có văn bản chấp thuận của Bên A.</p>

        <p class="clause-title">ĐIỀU 2: THỜI HẠN THUÊ</p>
        <p>2.1. Thời hạn thuê là: <strong>${durationMonths} tháng</strong>, bắt đầu từ ngày <strong>${startDate.full}</strong> đến hết ngày <strong>${endDate.full}</strong>.</p>
        <p>2.2. Trước khi hết hạn hợp đồng 30 ngày, nếu Bên B có nguyện vọng tiếp tục thuê thì thông báo cho Bên A để hai bên thống nhất ký gia hạn hợp đồng.</p>

        <p class="clause-title">ĐIỀU 3: GIÁ THUÊ, TIỀN CỌC VÀ CÁC CHI PHÍ DỊCH VỤ</p>
        <p>3.1. <strong>Giá thuê phòng:</strong> <strong>${monthlyRentFormatted} VNĐ / tháng</strong> (Bằng chữ: <em>${monthlyRentWords}</em>). Giá thuê được giữ ổn định trong suốt thời hạn hợp đồng.</p>
        <p>3.2. <strong>Tiền đặt cọc:</strong> <strong>${depositFormatted} VNĐ</strong> (Bằng chữ: <em>${depositWords}</em>).</p>
        <p style="margin-left:14pt;">- Khoản tiền cọc này nhằm bảo đảm Bên B thực hiện đúng nghĩa vụ hợp đồng và bảo toàn tài sản trong phòng.</p>
        <p style="margin-left:14pt;">- Bên A sẽ hoàn trả lại 100% số tiền cọc cho Bên B sau khi kết thúc hợp đồng, sau khi đã đối trừ các chi phí dịch vụ chưa thanh toán hoặc hư hại tài sản (nếu có).</p>
        <p>3.3. <strong>Các khoản chi phí dịch vụ sinh hoạt:</strong></p>
        <p style="margin-left:14pt;">- <strong>Tiền điện sinh hoạt:</strong> <strong>${electricFormatted} VNĐ / kWh</strong> (tính theo chỉ số công tơ điện hàng tháng).</p>
        <p style="margin-left:14pt;">- <strong>Tiền nước sinh hoạt:</strong> <strong>${waterFormatted} VNĐ / m³</strong> (tính theo chỉ số đồng hồ nước hàng tháng).</p>
        <p style="margin-left:14pt;">- <strong>Phí dịch vụ chung:</strong> <strong>${serviceFeeFormatted} VNĐ / người / tháng</strong> (bao gồm internet wifi, thu gom rác thải sinh hoạt, điện thắp sáng hành lang và vệ sinh không gian chung).</p>
        <p>3.4. <strong>Kỳ hạn thanh toán:</strong> Bên B có nghĩa vụ thanh toán tiền phòng và các chi phí dịch vụ phát sinh từ ngày 01 đến ngày 05 dương lịch hàng tháng qua hình thức tiền mặt, chuyển khoản ngân hàng hoặc quét mã VietQR.</p>

        <p class="clause-title">ĐIỀU 4: DANH SÁCH NGƯỜI Ở CÙNG (LƯU TRÚ)</p>
        <p>Danh sách các cá nhân đăng ký cư trú cùng Bên B tại phòng <strong>${roomNumber}</strong>:</p>
        ${occupantsTableHtml}

        <p class="clause-title">ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN CHO THUÊ (BÊN A)</p>
        <p>5.1. Bàn giao phòng và các trang thiết bị kèm theo cho Bên B đúng thời hạn thỏa thuận.</p>
        <p>5.2. Đảm bảo nguồn cấp điện, nước ổn định và hệ thống hạ tầng an ninh chung của tòa nhà.</p>
        <p>5.3. Kịp thời tiếp nhận, bảo trì và sửa chữa các sự cố hạ tầng cố định không phải do lỗi của Bên B gây ra.</p>
        <p>5.4. Tôn trọng quyền riêng tư của Bên B; tuyệt đối không tự ý vào phòng của Bên B khi chưa thông báo trước và được sự đồng ý, trừ tình huống khẩn cấp (cháy nổ, cứu hộ, rò rỉ nước nghiêm trọng).</p>

        <p class="clause-title">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN THUÊ (BÊN B)</p>
        <p>6.1. Thanh toán đầy đủ tiền thuê và các chi phí dịch vụ đúng hạn quy định.</p>
        <p>6.2. Cung cấp giấy tờ tùy thân (CCCD) để Bên A thực hiện thủ tục đăng ký tạm trú với cơ quan Công an có thẩm quyền.</p>
        <p>6.3. Giữ gìn an ninh trật tự chung, không gây ồn ào ảnh hưởng phòng xung quanh sau 23h00 đêm.</p>
        <p>6.4. Nghiêm cấm tàng trữ, sử dụng chất cấm, ma túy, vũ khí, chất cháy nổ hoặc tổ chức cờ bạc, hoạt động vi phạm pháp luật.</p>
        <p>6.5. Tuân thủ nghiêm ngặt quy định an toàn Phòng cháy chữa cháy (PCCC). Tắt các thiết bị điện khi không sử dụng hoặc khi ra khỏi phòng.</p>
        <p>6.6. Không tự ý đục tường, thay đổi kết cấu xây dựng căn phòng khi chưa có sự cho phép bằng văn bản của Bên A.</p>

        <p class="clause-title">ĐIỀU 7: CHẤM DỨT VÀ BỒI THƯỜNG HỢP ĐỒNG</p>
        <p>7.1. Hợp đồng chấm dứt khi hết thời hạn ghi tại Điều 2 mà hai bên không gia hạn.</p>
        <p>7.2. Trường hợp một trong hai bên muốn chấm dứt hợp đồng trước hạn, phải thông báo bằng văn bản hoặc tin nhắn cho bên kia trước ít nhất 30 ngày.</p>
        <p>7.3. Nếu Bên B tự ý chấm dứt hợp đồng trước hạn mà không thông báo hoặc vi phạm quy định pháp luật dẫn đến bị chấm dứt hợp đồng, Bên B sẽ không được nhận lại tiền cọc.</p>
        <p>7.4. Khi trả phòng, Bên B có nghĩa vụ bàn giao lại phòng và tài sản nguyên vẹn, dọn dẹp sạch sẽ và giao lại chìa khóa cho Bên A.</p>

        <p class="clause-title">ĐIỀU 8: CAM KẾT CHUNG VÀ ĐIỀU KHOẢN THI HÀNH</p>
        <p>8.1. Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản đã cam kết trong hợp đồng này. Mọi mâu thuẫn sẽ được giải quyết trên tinh thần thiện chí và thương lượng.</p>
        <p>8.2. Hợp đồng này có hiệu lực kể từ ngày ký và Bên B hoàn tất thủ tục đóng tiền đặt cọc.</p>
        <p>8.3. Hợp đồng được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để theo dõi và thực hiện.</p>

        <br/>
        <table style="width:100%;border:none;margin-top:16pt;page-break-inside:avoid;">
          <tr>
            <td style="text-align:center;width:50%;vertical-align:top;">
              <p class="font-bold uppercase" style="font-size:12pt;">ĐẠI DIỆN BÊN CHO THUÊ (BÊN A)</p>
              <p class="italic" style="font-size:10.5pt;">(Ký, ghi rõ họ tên)</p>
              <br/><br/><br/><br/>
              <p class="font-bold" style="font-size:12.5pt;">${landlordName}</p>
            </td>
            <td style="text-align:center;width:50%;vertical-align:top;">
              <p class="font-bold uppercase" style="font-size:12pt;">ĐẠI DIỆN BÊN THUÊ (BÊN B)</p>
              <p class="italic" style="font-size:10.5pt;">(Ký, ghi rõ họ tên)</p>
              ${contract.tenantSignatureUrl ? `
                <div style="margin: 8pt 0;">
                  <img src="${contract.tenantSignatureUrl}" style="max-height: 55pt; max-width: 150pt;" alt="Chữ ký số" />
                  <div style="font-size: 8.5pt; color: #047857; margin-top: 3pt; font-family: Arial, sans-serif; line-height: 1.3;">
                    <strong>✓ ĐÃ KÝ SỐ ĐIỆN TỬ</strong><br/>
                    ${contract.signedAt ? `Ngày ký: ${new Date(contract.signedAt).toLocaleDateString('vi-VN')}<br/>` : ''}
                    ${contract.signatureHash ? `Mã SHA: ${contract.signatureHash.substring(0, 16)}...` : ''}
                  </div>
                </div>
              ` : '<br/><br/><br/><br/>'}
              <p class="font-bold" style="font-size:12.5pt;">${tenantName}</p>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `HopDong_ThuePhong_${roomNumber}_HD${contract.id}.doc`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

