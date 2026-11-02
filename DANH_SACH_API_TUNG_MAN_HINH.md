# CHI TIẾT API SỬ DỤNG CHO TỪNG MÀN HÌNH (SCREEN-TO-API SPECIFICATION)

> **Hệ thống:** Quản lý Nhà trọ & Chung cư Mini (TROHUB)  
> **Kiến trúc:** Frontend (React + Vite + TypeScript) kết nối Backend (ASP.NET Core Web API, Base URL `/api`)  
> **Xác thực:** Bearer JWT Token (`Authorization: Bearer {token}`) lưu trong `localStorage`.

---

## MỤC LỤC THEO PHÂN HỆ

- [PHẦN I: CÁC MÀN HÌNH DÀNH CHO KHÁCH VÃNG LAI & CÔNG KHAI (PUBLIC / GUEST)](#phần-i-các-màn-hình-dành-cho-khách-vãng-lai--công-khai-public--guest)
  1. [Trang chủ (HomePage)](#1-trang-chủ-homepage)
  2. [Danh sách phòng trống (RoomListPage)](#2-danh-sách-phòng-trống-roomlistpage)
  3. [Chi tiết phòng trọ (RoomDetailPage)](#3-chi-tiết-phòng-trọ-roomdetailpage)
  4. [Đăng nhập hệ thống (LoginPage)](#4-đăng-nhập-hệ-thống-loginpage)
  5. [Đăng ký tài khoản khách thuê (RegisterPage)](#5-đăng-ký-tài-khoản-khách-thuê-registerpage)
- [PHẦN II: CÁC MÀN HÌNH DÀNH CHO KHÁCH THUÊ (TENANT PORTAL)](#phần-ii-các-màn-hình-dành-cho-khách-thuê-tenant-portal)
  6. [Đăng ký thuê phòng & Ký hợp đồng số (ContractRequestPage)](#6-đăng-ký-thuê-phòng--ký-hợp-đồng-số-contractrequestpage)
  7. [Hợp đồng của tôi (MyContractsPage)](#7-hợp-đồng-của-tôi-mycontractspage)
  8. [Hóa đơn & Thanh toán VietQR (MyInvoicesPage)](#8-hóa-đơn--thanh-toán-vietqr-myinvoicespage)
  9. [Gửi yêu cầu bảo trì / sự cố (MaintenanceRequestPage)](#9-gửi-yêu-cầu-bảo-trì--sự-cố-maintenancerequestpage)
  10. [Danh sách yêu cầu bảo trì của tôi (MyMaintenanceRequestsPage)](#10-danh-sách-yêu-cầu-bảo-trì-của-tôi-mymaintenancerequestspage)
  11. [Hồ sơ cá nhân khách thuê (TenantProfilePage)](#11-hồ-sơ-cá-nhân-khách-thuê-tenantprofilepage)
  12. [Tài khoản & Đổi mật khẩu (AccountPage)](#12-tài-khoản--đổi-mật-khẩu-accountpage)
  13. [Trung tâm thông báo (NotificationsPage)](#13-trung-tâm-thông-báo-notificationspage)
- [PHẦN III: CÁC MÀN HÌNH QUẢN TRỊ (ADMIN & STAFF MANAGEMENT)](#phần-iii-các-màn-hình-quản-trị-admin--staff-management)
  14. [Quản lý phòng trọ (RoomManagerPage)](#14-quản-lý-phòng-trọ-roommanagerpage)
  15. [Quản lý hợp đồng (ContractManagerPage)](#15-quản-lý-hợp-đồng-contractmanagerpage)
  16. [Quản lý hóa đơn & Thu tiền (InvoiceManagerPage)](#16-quản-lý-hóa-đơn--thu-tiền-invoicemanagerpage)
  17. [Lập hóa đơn đơn lẻ (InvoiceCreatePage)](#17-lập-hóa-đơn-đơn-lẻ-invoicecreatepage)
  18. [Lập hóa đơn hàng loạt theo tòa nhà (InvoiceBulkCreatePage)](#18-lập-hóa-đơn-hàng-loạt-theo-tòa-nhà-invoicebulkcreatepage)
  19. [Quản lý bảo trì & Phân công kỹ thuật (MaintenanceManagerPage)](#19-quản-lý-bảo-trì--phân-công-kỹ-thuật-maintenancemanagerpage)
  20. [Quản lý tòa nhà (BuildingManagerPage)](#20-quản-lý-tòa-nhà-buildingmanagerpage)
  21. [Quản lý người dùng & Phân quyền (UserManagerPage)](#21-quản-lý-người-dùng--phân-quyền-usermanagerpage)
  22. [Cấu hình hệ thống & VietQR (SystemConfigPage)](#22-cấu-hình-hệ-thống--vietqr-systemconfigpage)
  23. [Báo cáo thống kê Dashboard (ReportDashboardPage)](#23-báo-cáo-thống-kê-dashboard-reportdashboardpage)
  24. [Nhật ký hoạt động Audit Logs (ActivityLogPage)](#24-nhật-ký-hoạt-động-audit-logs-activitylogpage)
  25. [Gửi thông báo & Phát sóng (NotificationManagerPage)](#25-gửi-thông-báo--phát-sóng-notificationmanagerpage)
- [PHẦN IV: CÁC COMPONENT DÙNG CHUNG CÓ GỌI API](#phần-iv-các-component-dùng-chung-có-gọi-api)
  26. [Quản lý người ở cùng phòng (OccupantManager)](#26-quản-lý-người-ở-cùng-phòng-occupantmanager)
  27. [Chuông thông báo trên Header (NotificationDropdown)](#27-chuông-thông-báo-trên-header-notificationdropdown)
  28. [Quản lý phiên & Làm mới Token (AuthContext)](#28-quản-lý-phiên--làm-mới-token-authcontext)

---

# PHẦN I: CÁC MÀN HÌNH DÀNH CHO KHÁCH VÃNG LAI & CÔNG KHAI (PUBLIC / GUEST)

### 1. Trang chủ (HomePage)
- **URL Route:** `/`
- **File Component:** `src/features/home/HomePage.tsx`
- **Quyền truy cập:** Công khai (`Guest`, `Tenant`, `Staff`, `Admin`)
- **Mô tả:** Giới thiệu nền tảng, hiển thị danh sách phòng trống mới nhất vừa cập nhật, hotline liên hệ chủ trọ.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Room/available` | `getAvailableRooms()` | Lấy danh sách các phòng đang trống (`Status = Trong`) kèm thông tin tòa nhà, ảnh đại diện, giá thuê để hiển thị lên lưới card phòng nổi bật. |

---

### 2. Danh sách phòng trống (RoomListPage)
- **URL Route:** `/rooms`
- **File Component:** `src/features/room/RoomListPage.tsx`
- **Quyền truy cập:** Công khai
- **Mô tả:** Tìm kiếm, lọc phòng theo tòa nhà, mức giá, diện tích, loại phòng, xem giá điện nước tham khảo.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Room/available` | `getAvailableRooms()` | Tải toàn bộ phòng đang có sẵn để phục vụ bộ lọc tìm kiếm tức thì ở client. |
| `GET` | `/api/SystemConfig/public-rates` | `getPublicRates()` | Lấy đơn giá điện/kWh và nước/m³ tham khảo công khai do Admin cấu hình để hiển thị banner minh bạch giá. |

---

### 3. Chi tiết phòng trọ (RoomDetailPage)
- **URL Route:** `/rooms/:id`
- **File Component:** `src/features/room/RoomDetailPage.tsx`
- **Quyền truy cập:** Công khai
- **Mô tả:** Xem ảnh lớn, tiện nghi, thông số kỹ thuật, số điện thoại chủ trọ, nút chuyển hướng sang thuê phòng.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Room/{id}` | `getRoom(id)` | Lấy chi tiết thông tin phòng: số phòng, giá thuê, diện tích, tiện ích, tình trạng, danh sách ảnh/media, SĐT chủ tòa nhà. |
| `GET` | `/api/SystemConfig/public-rates` | `getPublicRates()` | Hiển thị bảng giá điện nước tham khảo đi kèm chi tiết phòng. |

---

### 4. Đăng nhập hệ thống (LoginPage)
- **URL Route:** `/login`
- **File Component:** `src/features/auth/LoginPage.tsx`
- **Quyền truy cập:** Công khai (Chưa đăng nhập)
- **Mô tả:** Đăng nhập bằng email và mật khẩu; lưu JWT token và chuyển hướng đúng trang theo vai trò.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `POST` | `/api/Auth/login` | `login(payload)` | Gửi `{ email, password }`. Backend trả về Token JWT, RefreshToken và Role (`Admin`, `Staff`, `Tenant`). |

---

### 5. Đăng ký tài khoản khách thuê (RegisterPage)
- **URL Route:** `/dang-ky`
- **File Component:** `src/features/auth/RegisterPage.tsx`
- **Quyền truy cập:** Công khai
- **Mô tả:** Đăng ký tài khoản người dùng mới (mặc định nhận quyền `Tenant` để có thể thuê phòng ngay lập tức).
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `POST` | `/api/Auth/register` | `register(payload)` | Gửi `{ fullName, email, password }` để tạo tài khoản mới. |
| `POST` | `/api/Auth/login` | `login(payload)` | Tự động đăng nhập ngay sau khi đăng ký thành công để lưu token và đưa khách vào trang chủ. |

---

# PHẦN II: CÁC MÀN HÌNH DÀNH CHO KHÁCH THUÊ (TENANT PORTAL)

### 6. Đăng ký thuê phòng & Ký hợp đồng số (ContractRequestPage)
- **URL Route:** `/thue/:roomId`
- **File Component:** `src/features/contract/ContractRequestPage.tsx`
- **Quyền truy cập:** Yêu cầu đăng nhập, Role `Tenant`
- **Mô tả:** Điền thông tin cá nhân (CCCD, SĐT, liên hệ khẩn cấp), thời hạn thuê, số người ở, ký chữ ký số trên Canvas, xem trước bản hợp đồng số và nộp đơn thuê.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Room/{id}` | `getRoom(roomId)` | Lấy thông tin phòng đang đăng ký để tính tiền cọc và kiểm tra trạng thái phòng còn trống không. |
| `GET` | `/api/Tenant/me` | `getMyTenantProfile()` | Tự động điền thông tin khách thuê (Họ tên, CCCD, SĐT) nếu đã cập nhật trước đó trong hồ sơ. |
| `GET` | `/api/SystemConfig/public-rates` | `getPublicRates()` | Lấy đơn giá điện/nước áp dụng tham khảo vào điều khoản hợp đồng nháp. |
| `POST` | `/api/Contract/request` | `requestContract(payload)` | Gửi đơn tạo hợp đồng: ngày bắt đầu/kết thúc, số người ở, thông tin người ở cùng, ảnh chữ ký số `data:image/png;base64,...`. Hợp đồng tạo mới ở trạng thái `ChoDuyet`. |

---

### 7. Hợp đồng của tôi (MyContractsPage)
- **URL Route:** `/hop-dong-cua-toi`
- **File Component:** `src/features/contract/MyContractsPage.tsx`
- **Quyền truy cập:** Role `Tenant`
- **Mô tả:** Danh sách các hợp đồng của khách thuê: xem trạng thái duyệt, xem chi tiết hợp đồng, mở modal xem/in file Word/PDF hợp đồng đã ký số, hủy yêu cầu chờ duyệt, khai báo người ở cùng.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Contract/my` | `getMyContracts()` | Lấy danh sách hợp đồng của chính khách thuê đăng nhập (phân loại: Chờ duyệt, Chờ cọc, Đang hiệu lực, Đã kết thúc). |
| `GET` | `/api/Contract/{id}` | `getContract(id)` | Lấy chi tiết điều khoản hợp đồng, ngày hiệu lực, tiền cọc, đơn giá điện nước chốt để hiển thị modal xem file Word/PDF. |
| `PUT` | `/api/Contract/{id}/cancel` | `cancelContractRequest(id)` | Khách thuê hủy yêu cầu thuê khi hợp đồng còn đang ở trạng thái `ChoDuyet`. |
| `GET` | `/api/Room/{id}` | `getRoom(roomId)` | Lấy thông tin phụ trợ của phòng tương ứng với hợp đồng. |

---

### 8. Hóa đơn & Thanh toán VietQR (MyInvoicesPage)
- **URL Route:** `/hoa-don-cua-toi`
- **File Component:** `src/features/invoice/MyInvoicesPage.tsx`
- **Quyền truy cập:** Role `Tenant`
- **Mô tả:** Xem danh sách hóa đơn cọc và hóa đơn tháng; xem chỉ số công tơ điện nước cũ/mới; tạo mã VietQR động để quét thanh toán trên app ngân hàng; gửi thông báo đã chuyển khoản.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Invoice/my` | `getMyInvoices()` | Lấy toàn bộ hóa đơn của khách thuê (Hóa đơn cọc + Hóa đơn tiền phòng hàng tháng). |
| `GET` | `/api/Invoice/{id}` | `getInvoice(id)` | Lấy chi tiết từng dòng thu (tiền phòng, số điện cũ/mới $\times$ đơn giá, số nước cũ/mới $\times$ đơn giá, dịch vụ). |
| `GET` | `/api/Payment/qr/{invoiceId}` | `getPaymentQr(invoiceId)` | Sinh mã VietQR động chuẩn NAPAS theo tài khoản chủ trọ kèm số tiền chính xác và nội dung chuyển khoản tự động. |
| `GET` | `/api/Payment/invoice/{invoiceId}` | `getPaymentsByInvoice(id)` | Lấy lịch sử các giao dịch thanh toán liên quan đến hóa đơn. |
| `POST` | `/api/Payment/submit-transfer` | `submitTransfer(payload)` | Khách gửi báo cáo đã chuyển khoản (kèm mã giao dịch/ảnh bill) để Staff duyệt. |
| `POST` | `/api/Payment/simulate-transfer/{invoiceId}` | `simulateTransfer(invoiceId)` | *(Môi trường Demo/Test)* Giả lập giao dịch thanh toán thành công tức thì qua Webhook VietQR. |

---

### 9. Gửi yêu cầu bảo trì / sự cố (MaintenanceRequestPage)
- **URL Route:** `/yeu-cau-bao-tri/moi`
- **File Component:** `src/features/maintenance/MaintenanceRequestPage.tsx`
- **Quyền truy cập:** Role `Tenant`
- **Mô tả:** Khách thuê báo hỏng thiết bị (điều hòa, bóng đèn, rò rỉ nước,...), đính kèm ảnh chụp hiện trường sự cố và chọn mức độ ưu tiên.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Contract/my` | `getMyContracts()` | Lấy danh sách các phòng khách đang thuê (`DangHieuLuc`) để chọn đúng phòng bị sự cố. |
| `POST` | `/api/Maintenance` | `createMaintenanceRequest(payload)` | Gửi yêu cầu bảo trì dạng dữ liệu JSON thông thường (khi không đính kèm file ảnh). |
| `POST` | `/api/Maintenance/upload` | `createMaintenanceRequestWithImage(formData)` | Gửi yêu cầu bảo trì dạng `multipart/form-data` có upload ảnh chụp sự cố trực tiếp. |

---

### 10. Danh sách yêu cầu bảo trì của tôi (MyMaintenanceRequestsPage)
- **URL Route:** `/yeu-cau-cua-toi`
- **File Component:** `src/features/maintenance/MyMaintenanceRequestsPage.tsx`
- **Quyền truy cập:** Role `Tenant`
- **Mô tả:** Theo dõi tiến độ xử lý sự cố (Mới $\rightarrow$ Đã phân công $\rightarrow$ Đang xử lý $\rightarrow$ Hoàn thành), gửi phản hồi trao đổi thêm với thợ sửa chữa, hủy yêu cầu.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Maintenance/my` | `getMyMaintenanceRequests()` | Lấy toàn bộ các phiếu yêu cầu sự cố của chính khách thuê. |
| `PUT` | `/api/Maintenance/{id}/cancel` | `cancelMyMaintenanceRequest(id)` | Khách hủy yêu cầu khi sự cố đã tự khắc phục được hoặc không cần sửa nữa. |
| `POST` | `/api/Maintenance/{id}/reply` | `replyToMaintenanceRequest(id, note)` | Gửi tin nhắn / phản hồi trao đổi với nhân viên kỹ thuật trong phiếu bảo trì. |

---

### 11. Hồ sơ cá nhân khách thuê (TenantProfilePage)
- **URL Route:** `/ho-so`
- **File Component:** `src/features/tenant/TenantProfilePage.tsx`
- **Quyền truy cập:** Role `Tenant`
- **Mô tả:** Quản lý thông tin định danh cá nhân: Số CCCD, Ngày cấp, Nơi cấp, Quê quán, Địa chỉ thường trú, SĐT liên hệ khẩn cấp.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Tenant/me` | `getMyTenantProfile()` | Lấy thông tin hồ sơ định danh chi tiết của khách thuê. |
| `PUT` | `/api/Tenant/me` | `updateMyTenantProfile(payload)` | Cập nhật hồ sơ CCCD, hộ khẩu, thông tin liên hệ khẩn cấp để tự động điền vào các hợp đồng sau này. |

---

### 12. Tài khoản & Đổi mật khẩu (AccountPage)
- **URL Route:** `/tai-khoan`
- **File Component:** `src/features/account/AccountPage.tsx`
- **Quyền truy cập:** Bất kỳ người dùng đã đăng nhập (`Tenant`, `Staff`, `Admin`)
- **Mô tả:** Xem thông tin tài khoản hiện tại, đổi họ tên/SĐT cơ bản và đổi mật khẩu bảo mật.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `PUT` | `/api/User/profile` | `updateProfile(payload)` | Cập nhật họ tên và số điện thoại gắn liền với tài khoản đăng nhập. |
| `POST` | `/api/Auth/change-password` | `changePassword(payload)` | Gửi `{ currentPassword, newPassword }` để thay đổi mật khẩu đăng nhập. |

---

### 13. Trung tâm thông báo (NotificationsPage)
- **URL Route:** `/thong-bao`
- **File Component:** `src/features/notification/NotificationsPage.tsx`
- **Quyền truy cập:** Người dùng đã đăng nhập
- **Mô tả:** Xem toàn bộ lịch sử thông báo: nhắc nợ hóa đơn, hợp đồng duyệt/sắp hết hạn, cập nhật bảo trì, thông báo chung từ ban quản lý; đánh dấu đã đọc.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Notification/my` | `getMyNotifications()` | Tải toàn bộ danh sách thông báo của tài khoản hiện tại. |
| `PUT` | `/api/Notification/{id}/read` | `markNotificationRead(id)` | Đánh dấu một thông báo cụ thể là đã đọc. |

---

# PHẦN III: CÁC MÀN HÌNH QUẢN TRỊ (ADMIN & STAFF MANAGEMENT)

### 14. Quản lý phòng trọ (RoomManagerPage)
- **URL Route:** `/admin/rooms`
- **File Component:** `src/features/admin/rooms/RoomManagerPage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Danh sách bảng phòng, lọc theo tòa nhà/trạng thái/loại phòng; thêm phòng mới kèm ảnh tải lên; sửa phòng; đổi trạng thái phòng (`Trong`, `DaThue`, `DangSua`); quản lý thư viện ảnh phòng (chọn ảnh đại diện, xóa ảnh).
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Room` | `getRooms()` | Lấy toàn bộ danh sách phòng trong hệ thống. |
| `GET` | `/api/Building` | `getBuildings()` | Lấy danh sách tòa nhà để đổ vào dropdown lọc và form thêm/sửa phòng. |
| `GET` | `/api/Contract` | `getContracts()` | Kiểm tra phòng đang gắn với hợp đồng hiệu lực nào. |
| `POST` | `/api/Room` | `createRoom(payload)` | Thêm phòng mới không có file ảnh tải lên. |
| `POST` | `/api/Room/upload` | `createRoomWithImage(formData)` | Thêm phòng mới kèm upload ảnh phòng trực tiếp qua `multipart/form-data`. |
| `PUT` | `/api/Room/{id}/upload` | `updateRoomWithImage(id, formData)` | Cập nhật thông tin phòng và tải ảnh mới. |
| `PUT` | `/api/Room/status` | `updateRoomStatus(payload)` | Đổi nhanh trạng thái phòng (ví dụ chuyển sang `DangSua` để bảo trì hoặc `Trong` khi hoàn tất). |
| `DELETE` | `/api/Room/{id}` | `deleteRoom(id)` | Xóa phòng khỏi hệ thống (chỉ xóa được khi không có hợp đồng ràng buộc). |
| `POST` | `/api/Room/{roomId}/media` | `addRoomMedia(roomId, formData)` | Tải thêm ảnh vào bộ sưu tập media của phòng. |
| `DELETE` | `/api/Room/{roomId}/media/{mediaId}` | `removeRoomMedia(roomId, mediaId)` | Xóa bớt một ảnh khỏi thư viện ảnh phòng. |
| `PUT` | `/api/Room/{roomId}/media/{mediaId}/primary` | `setPrimaryRoomMedia(...)` | Đặt một ảnh làm ảnh bìa / đại diện chính của phòng. |

---

### 15. Quản lý hợp đồng (ContractManagerPage)
- **URL Route:** `/admin/contracts`
- **File Component:** `src/features/admin/contracts/ContractManagerPage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Quản lý vòng đời hợp đồng: duyệt đơn thuê (`ChoDuyet` $\rightarrow$ `ChoCoc`) chốt giá điện nước; từ chối đơn; kết thúc/thanh lý hợp đồng; gia hạn thời hạn; cập nhật đơn giá dịch vụ; xem bản in file Word/PDF hợp đồng; nhắc hợp đồng sắp hết hạn.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Contract` | `getContracts()` | Lấy toàn bộ danh sách hợp đồng (hỗ trợ lọc theo trạng thái: Chờ duyệt, Chờ cọc, Hiệu lực,...). |
| `PUT` | `/api/Contract/{id}/approve` | `approveContract(id, payload)` | Duyệt hợp đồng: Chốt đơn giá điện, nước vào điều khoản; hệ thống tự động sinh hóa đơn cọc (`Invoice Type=Coc`). |
| `PUT` | `/api/Contract/{id}/reject` | `rejectContract(id, payload)` | Từ chối yêu cầu thuê phòng kèm lý do phản hồi cho khách. |
| `PUT` | `/api/Contract/{id}/terminate` | `terminateContract(id)` | Kết thúc hợp đồng: Chuyển sang `DaKetThuc`, giải phóng phòng về trạng thái `Trong`. |
| `PUT` | `/api/Contract/{id}/extend` | `extendContract(id, payload)` | Gia hạn hợp đồng sang ngày kết thúc mới. |
| `PUT` | `/api/Contract/{id}/set-unit-price` | `setContractUnitPrice(id, payload)` | Cập nhật điều chỉnh đơn giá điện/nước riêng cho hợp đồng. |
| `GET` | `/api/Room/{id}` | `getRoom(id)` | Lấy chi tiết thông tin phòng liên quan để hiển thị trong hợp đồng. |
| `GET` | `/api/SystemConfig` | `getSystemConfigs()` | Lấy thông tin đơn giá gợi ý từ cấu hình hệ thống khi duyệt. |
| `POST` | `/api/Notification/remind-upcoming-contracts` | `remindUpcomingContracts(daysBefore)` | Bắn thông báo hàng loạt nhắc các khách có hợp đồng sắp hết hạn trong 30 ngày tới. |

---

### 16. Quản lý hóa đơn & Thu tiền (InvoiceManagerPage)
- **URL Route:** `/admin/invoices`
- **File Component:** `src/features/admin/invoices/InvoiceManagerPage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Danh sách hóa đơn cọc & hàng tháng; xem chi tiết tính tiền; duyệt xác nhận tiền chuyển khoản / tiền mặt; nhắc nợ quá hạn và nhắc hóa đơn sắp đến hạn hàng loạt.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Invoice` | `getInvoices()` | Lấy toàn bộ danh sách hóa đơn trong hệ thống (lọc theo Chưa thanh toán, Đã thanh toán, Quá hạn). |
| `GET` | `/api/Payment/invoice/{invoiceId}` | `getPaymentsByInvoice(id)` | Xem lịch sử thanh toán, đối chiếu giao dịch của hóa đơn. |
| `PUT` | `/api/Payment/confirm-cash` | `confirmPayment(payload)` | Xác nhận đã thu tiền mặt: Chuyển hóa đơn thành `DaThanhToan`. Nếu là hóa đơn cọc, tự động kích hoạt Hợp đồng `DangHieuLuc` và chuyển phòng sang `DaThue`. |
| `PUT` | `/api/Payment/{paymentId}/confirm-transfer` | `confirmTransfer(paymentId)` | Duyệt xác nhận giao dịch chuyển khoản ngân hàng của khách. |
| `PUT` | `/api/Payment/{paymentId}/reject-transfer` | `rejectTransfer(paymentId)` | Từ chối giao dịch chuyển khoản không hợp lệ. |
| `POST` | `/api/Notification/remind-overdue` | `remindOverdue()` | Quét và tự động gửi thông báo nhắc nợ tới tất cả các phòng đang có hóa đơn quá hạn. |
| `POST` | `/api/Notification/remind-upcoming-invoices` | `remindUpcomingInvoices(daysBefore)` | Gửi thông báo nhắc các hóa đơn sắp đến hạn thanh toán trong 3 ngày tới. |

---

### 17. Lập hóa đơn đơn lẻ (InvoiceCreatePage)
- **URL Route:** `/admin/invoices/tao-moi`
- **File Component:** `src/features/admin/invoices/InvoiceCreatePage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Lập phiếu thu tiền phòng hàng tháng cho 1 phòng cụ thể; nhập số điện/nước mới; hệ thống tự tính tiền theo số cũ và đơn giá hợp đồng.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Contract` | `getContracts()` | Lấy danh sách hợp đồng đang hiệu lực (`DangHieuLuc`) để chọn phòng cần lập hóa đơn. |
| `GET` | `/api/Invoice` | `getInvoices()` | Lấy lịch sử hóa đơn gần nhất của hợp đồng để lấy chỉ số công tơ cũ tự động. |
| `GET` | `/api/Room/{id}` | `getRoom(id)` | Lấy giá phòng và thông tin cơ bản. |
| `POST` | `/api/Invoice` | `createInvoice(payload)` | Tạo hóa đơn hàng tháng: gửi `{ contractId, month, year, oldElectricity, newElectricity, oldWater, newWater, otherFees, dueDate, note }`. |

---

### 18. Lập hóa đơn hàng loạt theo tòa nhà (InvoiceBulkCreatePage)
- **URL Route:** `/admin/invoices/tao-hang-loat`
- **File Component:** `src/features/admin/invoices/InvoiceBulkCreatePage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Nhập chỉ số công tơ điện nước cho toàn bộ các phòng trong cùng một tòa nhà cùng lúc trên một bảng tính, bấm lưu để tạo hàng chục hóa đơn chỉ trong 1 thao tác.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Contract` | `getContracts()` | Lọc ra tất cả các phòng đang có người ở (`DangHieuLuc`) trong tòa nhà đã chọn. |
| `GET` | `/api/Invoice` | `getInvoices()` | Lấy số công tơ cũ kỳ trước của tất cả các phòng tương ứng để điền sẵn vào bảng. |
| `POST` | `/api/Invoice` | `createInvoice(payload)` | Lần lượt gửi request tạo hóa đơn cho từng phòng có nhập chỉ số mới hợp lệ. |

---

### 19. Quản lý bảo trì & Phân công kỹ thuật (MaintenanceManagerPage)
- **URL Route:** `/admin/maintenance`
- **File Component:** `src/features/admin/maintenance/MaintenanceManagerPage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Xem danh sách sự cố khách báo; xem ảnh hiện trường; phân công kỹ thuật viên phụ trách; chuyển trạng thái đang sửa $\rightarrow$ hoàn thành $\rightarrow$ hủy kèm ghi chú xử lý.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Maintenance` | `getMaintenanceRequests()` | Lấy toàn bộ danh sách phiếu yêu cầu bảo trì (lọc theo Mới, Đã phân công, Đang xử lý, Hoàn thành). |
| `GET` | `/api/Maintenance/{id}` | `getMaintenanceRequest(id)` | Xem chi tiết nội dung sự cố, ảnh chụp, các mốc thời gian xử lý và lịch sử phản hồi. |
| `GET` | `/api/User/staff-options` | `getStaffOptions()` | Lấy danh sách nhân viên kỹ thuật / quản lý để chọn người phụ trách sửa chữa. |
| `PUT` | `/api/Maintenance/{id}/assign` | `assignMaintenanceRequest(id, payload)` | Gán nhân viên kỹ thuật chịu trách nhiệm xử lý (`assignedToUserId`). |
| `PUT` | `/api/Maintenance/{id}/status` | `updateMaintenanceStatus(id, payload)` | Cập nhật tiến độ: `DangXuLy`, `HoanThanh` hoặc `DaHuy` kèm chi phí/ghi chú kỹ thuật. |

---

### 20. Quản lý tòa nhà (BuildingManagerPage)
- **URL Route:** `/admin/buildings`
- **File Component:** `src/features/admin/buildings/BuildingManagerPage.tsx`
- **Quyền truy cập:** Chỉ `Admin`
- **Mô tả:** Danh sách các tòa nhà/chung cư mini; thêm tòa nhà mới; sửa tên, địa chỉ, người quản lý; xóa tòa nhà; xem tổng số phòng trong mỗi tòa.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Building` | `getBuildings()` | Lấy toàn bộ danh sách tòa nhà kèm số lượng phòng trực thuộc. |
| `GET` | `/api/User` | `getUsers()` | Lấy danh sách tài khoản Admin để chỉ định chủ sở hữu / quản lý tòa nhà. |
| `POST` | `/api/Building` | `createBuilding(payload)` | Tạo mới tòa nhà: `{ name, address, ownerId, description }`. |
| `PUT` | `/api/Building` | `updateBuilding(payload)` | Cập nhật thông tin tòa nhà. |
| `DELETE` | `/api/Building/{id}` | `deleteBuilding(id)` | Xóa tòa nhà (chỉ xóa được khi không còn phòng nào bên trong). |

---

### 21. Quản lý người dùng & Phân quyền (UserManagerPage)
- **URL Route:** `/admin/users`
- **File Component:** `src/features/admin/users/UserManagerPage.tsx`
- **Quyền truy cập:** Chỉ `Admin`
- **Mô tả:** Danh sách tài khoản người dùng; lọc theo vai trò (`Tenant`, `Staff`, `Admin`); tạo tài khoản nhân viên; tạo trước tài khoản khách thuê; đổi vai trò tài khoản; xóa tài khoản.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/User` | `getUsers(filterRole)` | Lấy danh sách người dùng trong hệ thống (lọc theo role hoặc xem tất cả). |
| `POST` | `/api/User/staff` | `createStaff(payload)` | Tạo tài khoản nhân viên vận hành mới (`Role = Staff`). |
| `POST` | `/api/User/tenant` | `createTenantAccount(payload)` | Tạo trước tài khoản cho khách thuê chưa đăng ký. |
| `PUT` | `/api/User/{id}/role` | `updateUserRole(id, payload)` | Chuyển đổi vai trò người dùng (ví dụ thăng cấp `Tenant` lên `Staff` hoặc hạ cấp). |
| `DELETE` | `/api/User/{id}` | `deleteUser(id)` | Xóa vĩnh viễn tài khoản người dùng. |

---

### 22. Cấu hình hệ thống & VietQR (SystemConfigPage)
- **URL Route:** `/admin/system-config`
- **File Component:** `src/features/admin/systemConfig/SystemConfigPage.tsx`
- **Quyền truy cập:** Chỉ `Admin`
- **Mô tả:** Cài đặt thông số nhận thanh toán tự động (Ngân hàng, Số tài khoản, Chủ tài khoản VietQR); cài đặt đơn giá điện/kWh và nước/m³ tham khảo mặc định toàn hệ thống.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/SystemConfig` | `getSystemConfigs()` | Tải danh sách toàn bộ key cấu hình trong hệ thống (`BankName`, `BankAccountNumber`, `BankAccountName`, `DefaultElectricPrice`, `DefaultWaterPrice`). |
| `PUT` | `/api/SystemConfig` | `upsertSystemConfig(payload)` | Thêm mới hoặc cập nhật một giá trị cấu hình theo Key-Value. |

---

### 23. Báo cáo thống kê Dashboard (ReportDashboardPage)
- **URL Route:** `/admin/report`
- **File Component:** `src/features/admin/report/ReportDashboardPage.tsx`
- **Quyền truy cập:** Chỉ `Admin`
- **Mô tả:** Bảng tổng quan thông minh: Tổng doanh thu, Doanh thu tháng này, Tỷ lệ lấp đầy phòng (trống vs đã thuê), Tiền nợ chưa thu, Biểu đồ doanh thu 12 tháng gần nhất, cảnh báo hóa đơn quá hạn.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Report/dashboard` | `getReportDashboard()` | Trả về đối tượng tổng hợp: thống kê số lượng phòng, hợp đồng, hóa đơn, doanh thu thực thu, tiền nợ chưa thanh toán và mảng dữ liệu biểu đồ doanh thu theo tháng. |

---

### 24. Nhật ký hoạt động Audit Logs (ActivityLogPage)
- **URL Route:** `/admin/logs`
- **File Component:** `src/features/admin/report/ActivityLogPage.tsx`
- **Quyền truy cập:** Chỉ `Admin`
- **Mô tả:** Bảng ghi nhật ký toàn bộ hành động nghiệp vụ quan trọng của Admin và Staff (tạo phòng, duyệt hợp đồng, thu tiền, phân công sửa chữa, cấu hình hệ thống) kèm mốc thời gian và IP/User thực hiện; có phân trang.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Report/logs` | `getActivityLogs(page, pageSize)` | Lấy dữ liệu nhật ký phân trang `PagedResultDto<ActivityLogDto>` với các thông tin: Người thao tác, Hành động, Mô tả chi tiết, Thời gian thực hiện. |

---

### 25. Gửi thông báo & Phát sóng (NotificationManagerPage)
- **URL Route:** `/admin/notifications`
- **File Component:** `src/features/admin/notifications/NotificationManagerPage.tsx`
- **Quyền truy cập:** `Admin`, `Staff`
- **Mô tả:** Soạn và gửi thông báo đơn lẻ tới một khách thuê cụ thể hoặc phát sóng (Broadcast) thông báo chung tới toàn bộ cư dân trong hệ thống (nhắc nhở an ninh, lịch cắt điện/nước, bảo dưỡng PCCC,...).
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Tenant` | `getTenants()` | Lấy danh sách khách thuê để chọn người nhận khi gửi thông báo cá nhân. |
| `POST` | `/api/Notification` | `createNotification(payload)` | Gửi thông báo tới một khách thuê cụ thể: `{ userId, title, content, type }`. |
| `POST` | `/api/Notification/broadcast` | `broadcastNotification(payload)` | Phát sóng thông báo tới toàn bộ người dùng trong hệ thống: `{ title, content, type }`. |

---

# PHẦN IV: CÁC COMPONENT DÙNG CHUNG CÓ GỌI API

### 26. Quản lý người ở cùng phòng (OccupantManager)
- **File Component:** `src/components/Common/OccupantManager.tsx`
- **Vị trí nhúng:** Nhúng trực tiếp bên trong chi tiết Hợp đồng của `ContractManagerPage` và `MyContractsPage`.
- **Mô tả:** Khai báo, chỉnh sửa và xóa danh sách người cùng ở trong phòng (Họ tên, Mối quan hệ, Số CCCD, SĐT liên hệ) nhằm phục vụ quản lý tạm trú.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Contract/{contractId}/occupant` | `getContractOccupants(contractId)` | Lấy danh sách tất cả người ở cùng đã khai báo theo hợp đồng. |
| `POST` | `/api/Contract/{contractId}/occupant` | `addContractOccupant(contractId, payload)` | Thêm một người ở cùng phòng mới vào hợp đồng. |
| `PUT` | `/api/Occupant/{occupantId}` | `updateOccupant(occupantId, payload)` | Cập nhật thông tin họ tên, CCCD, SĐT người ở cùng. |
| `DELETE` | `/api/Occupant/{occupantId}` | `deleteOccupant(occupantId)` | Xóa người ở cùng ra khỏi danh sách phòng. |

---

### 27. Chuông thông báo trên Header (NotificationDropdown)
- **File Component:** `src/components/Common/NotificationDropdown.tsx`
- **Vị trí nhúng:** Góc trên cùng bên phải thanh điều hướng Header (Toàn hệ thống).
- **Mô tả:** Hiển thị số lượng thông báo chưa đọc trên badge chuông đỏ; mở dropdown xem nhanh 5 thông báo mới nhất; bấm vào để đánh dấu đã đọc và điều hướng đến màn hình chi tiết.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `GET` | `/api/Notification/my` | `getMyNotifications()` | Tải danh sách thông báo để đếm số thông báo `isRead === false` và hiển thị xem nhanh. |
| `PUT` | `/api/Notification/{id}/read` | `markNotificationRead(id)` | Đánh dấu thông báo đã đọc khi người dùng click vào trong dropdown. |

---

### 28. Quản lý phiên & Làm mới Token (AuthContext)
- **File Component:** `src/context/AuthContext.tsx`
- **Vị trí nhúng:** Provider bọc ngoài toàn bộ App (`src/App.tsx`).
- **Mô tả:** Khởi tạo trạng thái xác thực từ `localStorage`; tự động gửi request làm mới token khi token hết hạn; xử lý đăng xuất an toàn.
- **Danh sách API sử dụng:**

| Method | Endpoint URL | Hàm Frontend | Mục đích sử dụng |
|---|---|---|---|
| `POST` | `/api/Auth/login` | `login(payload)` | Đăng nhập và lưu trữ Token, User Profile vào State toàn cục. |
| `POST` | `/api/Auth/refresh-token` | `refreshTokenApi(accessToken, refreshToken)` | Làm mới phiên làm việc khi access token hết hạn mà người dùng không cần đăng nhập lại. |

---

## BẢNG TỔNG KẾT TẦN SUẤT SỬ DỤNG ENDPOINT TRÊN HỆ THỐNG

| Nhóm API chính | Số lượng Endpoints | Các màn hình sử dụng nhiều nhất |
|---|:---:|---|
| **`/api/Room/*`** | 12 | HomePage, RoomListPage, RoomDetailPage, RoomManagerPage, ContractManagerPage |
| **`/api/Contract/*`** | 11 | ContractRequestPage, MyContractsPage, ContractManagerPage, InvoiceCreatePage, InvoiceBulkCreatePage |
| **`/api/Invoice/*`** | 4 | MyInvoicesPage, InvoiceManagerPage, InvoiceCreatePage, InvoiceBulkCreatePage |
| **`/api/Payment/*`** | 7 | MyInvoicesPage, InvoiceManagerPage |
| **`/api/Maintenance/*`** | 8 | MaintenanceRequestPage, MyMaintenanceRequestsPage, MaintenanceManagerPage |
| **`/api/Notification/*`** | 7 | NotificationsPage, NotificationDropdown, NotificationManagerPage, InvoiceManagerPage, ContractManagerPage |
| **`/api/User/*`** | 8 | UserManagerPage, BuildingManagerPage, MaintenanceManagerPage, AccountPage |
| **`/api/Building/*`** | 5 | BuildingManagerPage, RoomManagerPage |
| **`/api/Tenant/*`** | 4 | TenantProfilePage, ContractRequestPage, NotificationManagerPage |
| **`/api/Occupant/*`** | 3 | OccupantManager (trong hợp đồng) |
| **`/api/SystemConfig/*`** | 3 | SystemConfigPage, RoomListPage, RoomDetailPage, ContractRequestPage, ContractManagerPage |
| **`/api/Report/*`** | 2 | ReportDashboardPage, ActivityLogPage |
| **`/api/Auth/*`** | 4 | LoginPage, RegisterPage, AccountPage, AuthContext |

