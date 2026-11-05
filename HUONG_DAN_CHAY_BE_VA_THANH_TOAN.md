# HƯỚNG DẪN CHẠY BACKEND (SHOPAPI) & CẤU HÌNH PHẦN MỀM CHUYỂN KHOẢN (VIETQR / SEPAY)

> **Dự án:** Hệ thống quản lý Nhà trọ & Chung cư mini (TROHUB)  
> **Backend:** ASP.NET Core Web API (.NET 10 / .NET 8) · SQL Server · MinIO (S3 Object Storage)  
> **Thanh toán:** VietQR (NAPAS 247) · Cổng Webhook biến động số dư SePay (sepay.vn) · Giả lập thanh toán Dev

---

## MỤC LỤC
1. [Yêu cầu môi trường hệ thống](#1-yêu-cầu-môi-trường-hệ-thống)
2. [Hướng dẫn chạy Backend (ShopAPI)](#2-hướng-dẫn-chạy-backend-shopapi)
   - [Cách 1: Khởi động 1 chạm bằng script `start-dev.bat` (Khuyên dùng)](#cách-1-khởi-động-1-chạm-bằng-script-start-devbat-khuyên-dùng)
   - [Cách 2: Khởi động thủ công từng dịch vụ qua Terminal](#cách-2-khởi-động-thủ-công-từng-dịch-vụ-qua-terminal)
   - [Cách 3: Khởi động qua Visual Studio / JetBrains Rider](#cách-3-khởi-động-qua-visual-studio--jetbrains-rider)
3. [Hướng dẫn cài đặt & vận hành phần mềm chuyển khoản (VietQR & SePay)](#3-hướng-dẫn-cài-đặt--vận-hành-phần-mềm-chuyển-khoản-vietqr--sepay)
   - [3.1. Cấu hình hiển thị mã VietQR thanh toán](#31-cấu-hình-hiển-thị-mã-vietqr-thanh-toán)
   - [3.2. Cài đặt phần mềm SePay nhận tiền tự động](#32-cài-đặt-phần-mềm-sepay-nhận-tiền-tự-động)
   - [3.3. Kết nối Webhook từ SePay về Backend Localhost qua ngrok](#33-kết-nối-webhook-từ-sepay-về-backend-localhost-qua-ngrok)
   - [3.4. Dùng tính năng giả lập chuyển khoản (Simulate) để test không cần tiền thật](#34-dùng-tính-năng-giả-lập-chuyển-khoản-simulate-để-test-không-cần-tiền-thật)
   - [3.5. Xác nhận chuyển khoản thủ công (Staff/Admin)](#35-xác-nhận-chuyển-khoản-thủ-công-staffadmin)
4. [Bảng kiểm tra kết nối & Troubleshooting (Xử lý sự cố)](#4-bảng-kiểm-tra-kết-nối--troubleshooting-xử-lý-sự-cố)

---

## 1. YÊU CẦU MÔI TRƯỜNG HỆ THỐNG

Trước khi khởi chạy, máy tính cần cài đặt các công cụ sau:

| Công cụ | Phiên bản khuyến nghị | Mục đích |
|---|---|---|
| **.NET SDK** | .NET 8.0 trở lên (hoặc .NET 10 Preview) | Biên dịch và chạy Backend ShopAPI |
| **SQL Server** | SQL Server 2019 / 2022 / LocalDB / Docker | Lưu trữ cơ sở dữ liệu `RentalManagementDB` |
| **Docker Desktop** | Bản mới nhất (đang chạy) | Chạy MinIO Container lưu trữ ảnh/video phòng |
| **Node.js** | v18 trở lên (kèm `npm`) | Chạy Frontend React (Vite) |
| **ngrok** (Tùy chọn) | Bản mới nhất | Mở cổng Localhost ra Internet khi test SePay Webhook thật |

---

## 2. HƯỚNG DẪN CHẠY BACKEND (SHOPAPI)

### Cấu hình file `appsettings.json`
Đường dẫn: `ShopAPI/ShopAPI/appsettings.json`

Đảm bảo chuỗi kết nối Database và cấu hình MinIO chính xác:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=RentalManagementDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "Chuoi_Secret_Key_Bao_Mat_Toi_Thieu_32_Ky_Tu_TROHUB_2026",
    "Issuer": "ShopAPI",
    "Audience": "ShopClient",
    "ExpireMinutes": 60
  },
  "VietQr": {
    "BankBin": "970422",
    "BankAccountNumber": "0123456789",
    "BankAccountName": "NGUYEN VAN A"
  },
  "SePay": {
    "ApiKey": "YOUR_SEPAY_API_KEY_HERE"
  },
  "Minio": {
    "Endpoint": "localhost:9000",
    "AccessKey": "admin",
    "SecretKey": "password123",
    "BucketName": "boarding-house",
    "WithSSL": false
  }
}
```

---

### Cách 1: Khởi động 1 chạm bằng script `start-dev.bat` (Khuyên dùng)
Trong thư mục gốc dự án `c:\hoc_reactjs`, chạy file:
```cmd
start-dev.bat
```
Script sẽ tự động thực hiện 3 bước:
1. Bật Docker container **MinIO** (lưu trữ ảnh phòng) tại `http://localhost:9000` (Console quản trị: `http://localhost:9001`).
2. Mở cửa sổ riêng chạy **Backend ShopAPI** tại `http://localhost:5141`.
3. Mở cửa sổ riêng chạy **Frontend React** tại `http://localhost:5173`.

---

### Cách 2: Khởi động thủ công từng dịch vụ qua Terminal

#### Bước 2.1: Khởi động MinIO (Lưu trữ ảnh/video)
Mở PowerShell tại thư mục gốc `c:\hoc_reactjs`:
```powershell
docker compose up -d minio
```
*Truy cập kiểm tra:*
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001` (User: `admin` | Password: `password123`)

#### Bước 2.2: Cập nhật Database (Migration)
Di chuyển vào thư mục backend và chạy migration để tự sinh bảng trong SQL Server:
```powershell
cd c:\hoc_reactjs\ShopAPI\ShopAPI
dotnet ef database update
```
*(Backend có tích hợp `context.Database.Migrate()` tự động chạy khi khởi động, nhưng có thể chạy lệnh trên để chủ động kiểm tra).*

#### Bước 2.3: Khởi chạy Backend
```powershell
dotnet run --launch-profile http
```
- Backend sẽ lắng nghe tại: `http://localhost:5141`
- Tài liệu kiểm thử Swagger UI: `http://localhost:5141/swagger`

---

### Cách 3: Khởi động qua Visual Studio / JetBrains Rider
1. Mở file giải pháp `ShopAPI.slnx` hoặc thư mục dự án trong Visual Studio.
2. Chọn profile khởi chạy là **`http`** (không dùng HTTPS để tránh lỗi chứng chỉ SSL khi gọi từ frontend local).
3. Bấm **F5** (hoặc `Ctrl + F5`) để khởi chạy.
4. Trình duyệt sẽ mở trang Swagger tại `http://localhost:5141/swagger`.

---

## 3. HƯỚNG DẪN CÀI ĐẶT & VẬN HÀNH PHẦN MỀM CHUYỂN KHOẢN (VIETQR & SEPAY)

Hệ thống TROHUB hỗ trợ **quy trình khép kín** từ tạo mã QR chuẩn ngân hàng cho đến tự động gạch nợ hóa đơn khi tiền về tài khoản.

---

### 3.1. Cấu hình hiển thị mã VietQR thanh toán

Backend TROHUB tích hợp sẵn bộ thuật toán **EMVCo / NAPAS 247** cục bộ (`VietQrService.cs`) — **không cần phụ thuộc API bên ngoài để sinh mã QR**.

Để hệ thống hiển thị được mã VietQR cho khách quét:
1. Đăng nhập vào hệ thống với tài khoản **Admin**.
2. Truy cập vào menu **Cấu hình hệ thống** (`http://localhost:5173/admin/system-config`).
3. Cập nhật 3 thông số ngân hàng nhận tiền:
   - **Mã BIN Ngân hàng (`BankBin`):** Mã định danh 6 số của ngân hàng.
     * *Ví dụ:* `970422` (MBBank), `970436` (Vietcombank), `970407` (Techcombank), `970415` (Vietinbank), `970418` (BIDV), `970423` (TPBank), `970432` (VPBank), `970416` (ACB).
   - **Số tài khoản (`BankAccountNumber`):** Số tài khoản ngân hàng nhận tiền của bạn.
   - **Tên chủ tài khoản (`BankAccountName`):** Tên đầy đủ viết hoa không dấu (ví dụ: `NGUYEN VAN A`).
4. Bấm **Lưu cấu hình**.
5. Bây giờ, khi khách thuê mở bất kỳ hóa đơn nào (`/hoa-don-cua-toi`), hệ thống sẽ tự động vẽ mã VietQR chứa:
   - Số tiền chính xác của hóa đơn.
   - Cú pháp nội dung chuẩn: `HD{Mã_hóa_đơn}` (Ví dụ: `HD15`).

---

### 3.2. Cài đặt phần mềm SePay nhận tiền tự động

**SePay (sepay.vn)** là phần mềm đóng vai trò cổng thông báo biến động số dư ngân hàng:
- Khi có tiền chuyển vào tài khoản ngân hàng của chủ trọ, SePay bắt biến động số dư.
- SePay tự động bắn Webhook về Backend TROHUB kèm nội dung chuyển khoản và số tiền.
- Backend TROHUB kiểm tra khớp mã `HD{id}` và số tiền $\rightarrow$ tự động gạch nợ hóa đơn thành `DaThanhToan` ngay lập tức!

#### Các bước đăng ký & cài đặt SePay:
1. Truy cập [https://sepay.vn](https://sepay.vn) và đăng ký một tài khoản miễn phí.
2. Thêm tài khoản ngân hàng của bạn vào SePay:
   - **Cách 1 (Khuyên dùng cho cá nhân):** Tải ứng dụng **SePay** trên điện thoại Android/iOS. Đăng nhập và cấp quyền đọc thông báo biến động số dư (SMS hoặc thông báo App ngân hàng).
   - **Cách 2:** Kết nối Open Banking qua cổng ngân hàng doanh nghiệp nếu có.
3. Lấy **API Key** của SePay:
   - Vào mục **Tích hợp Webhook** / **API Key** trên SePay dashboard.
   - Sao chép API Key và dán vào `ShopAPI/ShopAPI/appsettings.json`:
     ```json
     "SePay": {
       "ApiKey": "dien_sepay_api_key_cua_ban_vao_day"
     }
     ```

---

### 3.3. Kết nối Webhook từ SePay về Backend Localhost qua Localtunnel (npx localtunnel)

Do Backend đang chạy tại máy tính cá nhân (`http://localhost:5141`), máy chủ SePay trên Internet không thể gọi trực tiếp tới `localhost`. Bạn cần mở cổng công khai ra Internet bằng **Localtunnel** (tiện lợi nhất vì không cần tạo tài khoản hay cài thêm phần mềm riêng, chỉ cần có Node.js):

#### Bước 1: Mở cổng Backend bằng lệnh `npx localtunnel`
Mở một cửa sổ Terminal (PowerShell hoặc Command Prompt) mới và chạy:
```cmd
npx localtunnel --port 5141
```
*(Nếu muốn cố định tên miền để không phải đổi URL mỗi lần khởi động, thêm cờ `--subdomain`:)*
```cmd
npx localtunnel --port 5141 --subdomain trohub-api
```

Khi chạy thành công, Terminal sẽ hiển thị đường dẫn công khai dạng:
```
your url is: https://trohub-api.loca.lt
```
> ⚠️ **LƯU Ý:** Giữ cửa sổ Terminal chạy `npx localtunnel` này luôn mở trong suốt quá trình nhận thanh toán.

#### Bước 2: Cấu hình Webhook trên trang SePay
1. Đăng nhập vào [https://sepay.vn](https://sepay.vn) $\rightarrow$ Vào mục **Cấu hình Webhook** (hoặc Tích hợp Webhook) $\rightarrow$ **Thêm Webhook mới**.
2. Nhập thông tin:
   - **URL Webhook:** Ghép URL của localtunnel với endpoint `/api/Payment/sepay-webhook`:
     ```
     https://trohub-api.loca.lt/api/Payment/sepay-webhook
     ```
     *(Thay `trohub-api.loca.lt` bằng URL thực tế mà terminal localtunnel in ra)*
   - **Phương thức:** `POST`
   - **Xác thực (Authentication):** Chọn `API Key` $\rightarrow$ Nhập chuỗi API Key trùng khớp với cấu hình `"SePay:ApiKey"` trong `appsettings.json`.
3. Bấm **Lưu Webhook**.

#### Bước 3: Lấy mật khẩu Tunnel (Password / IP Check của Localtunnel nếu cần)
Localtunnel có cơ chế bảo vệ chống spam (Friendly Reminder). Đối với một số dịch vụ webhook hoặc khi kiểm tra trên trình duyệt:
- Mở link: [https://loca.lt/mytunnelpassword](https://loca.lt/mytunnelpassword) để lấy địa chỉ IP Public của máy bạn (ví dụ: `14.232.xxx.xxx`).
- Dán IP này vào màn hình xác nhận của `trohub-api.loca.lt` trên trình duyệt một lần để mở khóa tunnel.

#### Bước 4: Thử nghiệm thực tế
1. Khách thuê mở hóa đơn trên web $\rightarrow$ quét mã VietQR và thực hiện chuyển khoản (nội dung có dạng `HD15`).
2. Tiền vào tài khoản ngân hàng của chủ trọ.
3. SePay bắt được thông báo biến động số dư $\rightarrow$ bắn request POST tới `https://trohub-api.loca.lt/api/Payment/sepay-webhook`.
4. Backend nhận request và xử lý tự động:
   - Hóa đơn `#15` chuyển thành `DaThanhToan`.
   - Hợp đồng chuyển `DangHieuLuc` (nếu là hóa đơn cọc) và phòng chuyển sang `DaThue`.
   - Gửi thông báo chuông tới cả khách thuê và Admin.

*(Ngoài ra bạn cũng có thể dùng `ngrok http 5141` nếu quen thuộc với ngrok).*

---

### 3.4. Dùng tính năng giả lập chuyển khoản (Simulate) để test không cần tiền thật

Nếu bạn đang phát triển (Development) trên máy tính và **không muốn dùng tiền thật** hoặc **chưa cài ngrok/SePay**, hệ thống đã tích hợp sẵn tính năng giả lập cực kỳ tiện lợi:

#### Thao tác trên giao diện Web:
1. Đăng nhập tài khoản khách thuê (`Tenant`).
2. Vào trang **Hóa đơn của tôi** (`/hoa-don-cua-toi`).
3. Chọn hóa đơn chưa thanh toán $\rightarrow$ bấm **Thanh toán VietQR**.
4. Trong modal hiển thị mã QR, bấm nút:  
   👉 **"Giả lập thanh toán thành công (Test Dev)"**
5. Hệ thống sẽ ngay lập tức gọi API:
   ```
   POST /api/Payment/simulate-transfer/{invoiceId}
   ```
6. Backend tự động tạo payload mô phỏng từ SePay, đối soát hóa đơn và gạch nợ thành công $100\%$ như giao dịch thật!

---

### 3.5. Xác nhận chuyển khoản thủ công (Staff/Admin)

Trường hợp khách chuyển khoản ngân hàng thông thường (chuyển qua số tài khoản mà không quét mã tự động, hoặc nội dung chuyển tiền bị viết sai):
1. Khách thuê vào `/hoa-don-cua-toi` $\rightarrow$ bấm **"Xác nhận đã chuyển khoản"** $\rightarrow$ nhập Mã giao dịch ngân hàng / đính kèm ghi chú.
2. Quản lý / Staff vào trang `/admin/invoices` $\rightarrow$ tìm hóa đơn tương ứng (có nhãn **Chờ xác nhận chuyển khoản**).
3. Kiểm tra biến động tài khoản ngân hàng thực tế:
   - Nếu tiền đã vào: Bấm **Xác nhận chuyển khoản** (Duyệt) $\rightarrow$ Hóa đơn chuyển `DaThanhToan`.
   - Nếu tiền chưa vào hoặc sai: Bấm **Từ chối giao dịch**.

---

## 4. BẢNG KIỂM TRA KẾT NỐI & TROUBLESHOOTING (XỬ LÝ SỰ CỐ)

### Lỗi 1: Không kết nối được Database (Cannot open database "RentalManagementDB")
- **Nguyên nhân:** Tên server SQL Server trong `DefaultConnection` chưa đúng với máy của bạn.
- **Cách khắc phục:**
  - Nếu dùng SQL Server mặc định: `Server=localhost;Database=RentalManagementDB;...`
  - Nếu dùng SQL Server có Instance: `Server=localhost\\SQLEXPRESS;Database=RentalManagementDB;...`
  - Nếu dùng LocalDB của Visual Studio: `Server=(localdb)\\mssqllocaldb;Database=RentalManagementDB;...`

### Lỗi 2: Không tải được ảnh phòng / Upload ảnh lỗi
- **Nguyên nhân:** Container Docker MinIO chưa được bật.
- **Cách khắc phục:**
  - Mở Docker Desktop.
  - Chạy lệnh `docker compose up -d minio`.
  - Kiểm tra xem cổng 9000 đã hoạt động chưa bằng cách mở `http://localhost:9001` trên trình duyệt.

### Lỗi 3: Khách thuê mở modal thanh toán nhưng thông báo "Tài khoản nhận chưa cấu hình"
- **Nguyên nhân:** Trong bảng cấu hình chưa có thông tin `BankBin`, `BankAccountNumber`, `BankAccountName`.
- **Cách khắc phục:**
  - Đăng nhập tài khoản `Admin` $\rightarrow$ vào `/admin/system-config`.
  - Nhập mã BIN (ví dụ `970422`), số tài khoản và tên chủ tài khoản $\rightarrow$ bấm Lưu.

### Lỗi 4: SePay báo "Sai SePay API Key" hoặc Webhook trả về 401
- **Nguyên nhân:** API Key trên SePay dashboard không khớp với chuỗi `"ApiKey"` trong file `appsettings.json`.
- **Cách khắc phục:**
  - Kiểm tra lại trường `"ApiKey"` trong `appsettings.json` của Backend và cài đặt Header trên SePay.
  - Lưu ý khởi động lại Backend sau khi sửa file `appsettings.json`.

---

## TÀI KHOẢN TRUY CẬP MẶC ĐỊNH HỆ THỐNG

| Vai trò | Email đăng nhập | Mật khẩu |
|---|---|---|
| **Admin (Chủ trọ)** | `admin@trohub.vn` *(hoặc email admin tạo đầu tiên)* | `Admin@123` |
| **Khách thuê (Tenant)** | Khách có thể tự đăng ký tự do tại màn hình `/dang-ky` | *(Mật khẩu tự đặt)* |

