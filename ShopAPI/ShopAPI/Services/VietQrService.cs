using ShopAPI.Data;
using ShopAPI.Interfaces;
using System.Text;

namespace ShopAPI.Services
{
    // Builds a VietQR-compliant (EMVCo / NAPAS 247) QR payload string entirely locally —
    // no external API call. The frontend renders this string into a scannable QR image.
    public class VietQrService : IVietQrService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public VietQrService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public string GeneratePayload(decimal amount, string addInfo)
        {
            var bankBin = GetConfigValue("BankBin", "VietQr:BankBin");
            var accountNumber = GetConfigValue("BankAccountNumber", "VietQr:BankAccountNumber");
            var accountName = GetConfigValue("BankAccountName", "VietQr:BankAccountName");

            var beneficiaryInfo = Tlv("00", bankBin) + Tlv("01", accountNumber);

            var merchantAccountInfo =
                Tlv("00", "A000000727") +
                Tlv("01", beneficiaryInfo) +
                Tlv("02", "QRIBFTTA");

            var additionalData = Tlv("08", Truncate(addInfo, 25));

            var amountStr = ((long)amount).ToString();

            var sb = new StringBuilder();
            sb.Append(Tlv("00", "01"));
            sb.Append(Tlv("01", "12"));
            sb.Append(Tlv("38", merchantAccountInfo));
            sb.Append(Tlv("53", "704"));
            sb.Append(Tlv("54", amountStr));
            sb.Append(Tlv("58", "VN"));
            sb.Append(Tlv("59", Truncate(accountName, 25)));
            sb.Append(Tlv("60", "Ha Noi"));
            sb.Append(Tlv("62", additionalData));

            sb.Append("6304");
            sb.Append(Crc16Ccitt(sb.ToString()));

            return sb.ToString();
        }

        private string GetConfigValue(string systemConfigKey, string appSettingsKey)
        {
            var value = _context.SystemConfigs.FirstOrDefault(x => x.Key == systemConfigKey)?.Value;

            return !string.IsNullOrWhiteSpace(value) ? value : (_configuration[appSettingsKey] ?? "");
        }

        private static string Tlv(string id, string value)
        {
            var length = value.Length.ToString("D2");
            return $"{id}{length}{value}";
        }

        private static string Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrEmpty(value))
            {
                return "";
            }

            return value.Length <= maxLength ? value : value.Substring(0, maxLength);
        }

        private static string Crc16Ccitt(string data)
        {
            ushort crc = 0xFFFF;
            var bytes = Encoding.ASCII.GetBytes(data);

            foreach (var b in bytes)
            {
                crc ^= (ushort)(b << 8);

                for (var i = 0; i < 8; i++)
                {
                    crc = (crc & 0x8000) != 0
                        ? (ushort)((crc << 1) ^ 0x1021)
                        : (ushort)(crc << 1);
                }
            }

            return crc.ToString("X4");
        }
    }
}
