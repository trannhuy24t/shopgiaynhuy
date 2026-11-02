/**
 * Tự động sửa lỗi hiển thị tiếng Việt bị mã hóa sai (mojibake)
 * Thường xảy ra khi chuỗi UTF-8 bị lưu hoặc giải mã qua charset latin1/windows-1252.
 */
export function sanitizeVietnamese(text?: string | null): string {
  if (!text) return '';

  // Nhanh chóng trả về nếu không có ký tự mojibake
  if (!/[ĂªáºÄ‘vá»má»phĂháºsáºÄƒá»tĂ¬ngÆÂ]/.test(text)) {
    return text;
  }

  return text
    .replaceAll('YĂªu cáº§u', 'Yêu cầu')
    .replaceAll('thuĂª', 'thuê')
    .replaceAll('phĂ²ng', 'phòng')
    .replaceAll('má»›i', 'mới')
    .replaceAll('KhĂ¡ch', 'Khách')
    .replaceAll('vá»«a', 'vừa')
    .replaceAll('Ä‘Äƒng kĂ½', 'đăng ký')
    .replaceAll('VĂ o', 'Vào')
    .replaceAll('VĂ\u00a0o', 'Vào')
    .replaceAll('má»¥c', 'mục')
    .replaceAll('Há»£p Ä‘á»“ng', 'Hợp đồng')
    .replaceAll('Ä‘á»ƒ duyá»‡t', 'để duyệt')
    .replaceAll('Ä‘á»ƒ', 'để')
    .replaceAll('duyá»‡t', 'duyệt')
    .replaceAll('báº£o trĂ¬', 'bảo trì')
    .replaceAll('HĂ³a Ä‘Æ¡n', 'Hóa đơn')
    .replaceAll('sáº¯p Ä‘áº¿n háº¡n', 'sắp đến hạn')
    .replaceAll('quĂ¡ háº¡n', 'quá hạn')
    .replaceAll('Nháº¯c nhá»Ÿ', 'Nhắc nhở')
    .replaceAll('thanh toĂ¡n', 'thanh toán')
    .replaceAll('sáº½ Ä‘áº¿n háº¡n', 'sẽ đến hạn')
    .replaceAll('ngĂ\u00a0y', 'ngày')
    .replaceAll('ngĂ y', 'ngày')
    .replaceAll('sá»‘ tiá» n', 'số tiền')
    .replaceAll('liĂªn há»‡', 'liên hệ')
    .replaceAll('tiáº¿p tá»¥c', 'tiếp tục')
    .replaceAll('Ä‘Ă£', 'đã')
    .replaceAll('Ä‘Æ¡n giĂ¡', 'đơn giá')
    .replaceAll('Ä‘iá»‡n/nÆ°á»›c', 'điện/nước')
    .replaceAll('Ă¡p dá»¥ng', 'áp dụng')
    .replaceAll('tá»« bĂ¢y giá»', 'từ bây giờ')
    .replaceAll('mÂ³', 'm³');
}

