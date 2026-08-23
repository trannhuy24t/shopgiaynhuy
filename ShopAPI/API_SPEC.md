# API Spec — Hệ thống quản lý nhà trọ / chung cư mini (ShopAPI)

Base URL (local dev): `http://localhost:5141` (xem `ShopAPI/Properties/launchSettings.json` để biết port chính xác đang chạy).

## 1. Tổng quan

Backend ASP.NET Core Web API (.NET 10), kiến trúc **Controller → Service → Repository**, EF Core + SQL Server (`RentalManagementDB`), xác thực **JWT Bearer**, mật khẩu hash bằng BCrypt.

### Vai trò (Role)

| Role | Mô tả |
|---|---|
| `Admin` | Chủ trọ — quản lý toàn hệ thống |
| `Staff` | Nhân viên quản lý |
| `Tenant` | Khách thuê |
| `User` | Role mặc định khi tự đăng ký qua `/api/auth/register` (Admin phải đổi sang `Tenant`/`Staff` bằng `PUT /api/user/{id}/role` thì mới dùng được các endpoint theo role) |

### Xác thực

Hầu hết endpoint (trừ `POST /api/auth/*` và `GET /api/room/available`, `GET /api/room/{id}`) yêu cầu header:

```
Authorization: Bearer {token}
```

Token lấy từ response của `POST /api/auth/login`, hết hạn theo `Jwt:ExpireMinutes` trong `appsettings.json` (mặc định 60 phút).

### Định dạng response chung

- Thành công: trả thẳng object/array dữ liệu, HTTP 200.
- Lỗi nghiệp vụ (400/404): `{ "message": "..." }`.
- Không có quyền: HTTP 401 (chưa đăng nhập) hoặc 403 (sai role / không sở hữu tài nguyên).
- Danh sách có phân trang dùng `PagedResultDto<T>`:

```json
{
  "totalItems": 42,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3,
  "items": [ ... ]
}
```

### Các chuỗi trạng thái (status) dùng trong hệ thống

| Entity | Field | Giá trị |
|---|---|---|
| `Room` | `Status` | `Trong` (trống) · `DaThue` (đã thuê) · `DangSua` (đang sửa) |
| `Contract` | `Status` | `ChoDuyet` → `ChoCoc` → `DangHieuLuc` → `DaKetThuc` · nhánh `TuChoi` |
| `Invoice` | `Status` | `ChuaThanhToan` → `DaThanhToan` · hoặc `QuaHan` (quá hạn) |
| `Invoice` | `Type` | `Coc` (hóa đơn cọc, tự sinh khi duyệt hợp đồng) · `HangThang` |
| `Payment` | `Method` | `TienMat` · `ChuyenKhoan` · `QR` |
| `MaintenanceRequest` | `Priority` | `Thap` · `TrungBinh` · `Cao` |
| `MaintenanceRequest` | `Status` | `Moi` → `DaPhanCong` → `DangXuLy` → `HoanThanh` / `DaHuy` |
| `Notification` | `Type` | `NhacNo` · `HopDong` · `BaoTri` · `ThongBaoChung` |
| `RoomMedia` | `Type` | `Image` · `Video` |

### Vòng đời nghiệp vụ chính

```
Tenant: GET /room/available → POST /contract/request (ChoDuyet, kèm NumberOfOccupants)
Admin:  PUT /contract/{id}/approve (ChoCoc) — chốt ElectricUnitPrice/WaterUnitPrice vào hợp đồng,
        tự tạo Invoice Type=Coc
Tenant: GET /payment/qr/{invoiceId} (quét QR chuyển khoản)
Staff:  PUT /payment/confirm-cash (Invoice→DaThanhToan, Contract→DangHieuLuc, Room→DaThue)
Tenant: POST /contract/{id}/occupants (khai báo thêm người ở cùng, nếu có)
Staff:  POST /invoice (chỉ nhập số công tơ điện/nước đầu-cuối; đơn giá lấy từ Contract,
        không cần gõ tay) → hóa đơn hàng tháng
Tenant: GET /invoice/my (xem rõ số công tơ cũ→mới) → GET /payment/qr/{invoiceId} → thanh toán
Staff:  PUT /payment/confirm-cash (Invoice→DaThanhToan)
Tenant: POST /maintenance (báo sự cố)
Staff:  PUT /maintenance/{id}/assign → PUT /maintenance/{id}/status
Staff:  POST /notification/remind-overdue, /remind-upcoming-invoices, /remind-upcoming-contracts
Admin:  GET /report/dashboard, GET /report/logs
```

---

## 2. Auth — `/api/auth`

### `POST /api/auth/register`
Công khai. Tạo tài khoản mới, luôn gán `Role = "User"`.

Request:
```json
{ "fullName": "Nguyễn Văn A", "email": "a@mail.com", "password": "Abc123456" }
```
Response 200: `{ "message": "Đăng ký thành công!" }`
Response 400: email đã tồn tại.

### `POST /api/auth/login`
Công khai.

Request:
```json
{ "email": "a@mail.com", "password": "Abc123456" }
```
Response 200:
```json
{
  "message": "Đăng nhập thành công!",
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "fullName": "Nguyễn Văn A", "email": "a@mail.com", "role": "Tenant" }
}
```
Response 400: sai email hoặc mật khẩu.

---

## 3. User — `/api/user` (Admin)

### `GET /api/user?role={role}`
Danh sách user, lọc theo `role` (optional). Trả `UserDto[]`.

### `GET /api/user/{id}`
Trả `UserDto`. 404 nếu không có.

### `POST /api/user/staff`
Tạo tài khoản Staff.

Request: `{ "fullName": "...", "email": "...", "password": "..." }`
Response 200: `UserDto`. 400 nếu email trùng.

### `PUT /api/user/{id}/role`
Đổi role (`Admin`/`Staff`/`Tenant`/`User`).

Request: `{ "role": "Tenant" }`
Response 200: `{ "message": "Cập nhật vai trò thành công." }`

**`UserDto`**: `{ id, fullName, email, role, createdAt }`

---

## 4. Tenant — `/api/tenant`

Hồ sơ khách thuê (`Tenant`) gắn 1-1 với `User` qua `userId`. Được tự tạo/cập nhật ngay khi Tenant đăng ký thuê phòng (`POST /contract/request`), hoặc chủ động qua `PUT /api/tenant/me`.

### `GET /api/tenant` — Admin/Staff
Trả `TenantDto[]`.

### `GET /api/tenant/{id}` — Admin/Staff
Trả `TenantDto`. 404 nếu không có.

### `GET /api/tenant/me` — Tenant
Trả hồ sơ của chính user đang đăng nhập. 404 nếu chưa có hồ sơ.

### `PUT /api/tenant/me` — Tenant
Tạo mới nếu chưa có, cập nhật nếu đã có.

Request:
```json
{ "fullName": "Nguyễn Văn A", "idCardNumber": "079123456789", "phone": "0901111111", "email": "a@mail.com", "emergencyContact": "0909999999" }
```
Response 200: `TenantDto`.

**`TenantDto`**: `{ id, userId, userEmail, fullName, idCardNumber, phone, email, emergencyContact, createdAt }`

---

## 5. Building — `/api/building`

### `GET /api/building` — Admin/Staff
Trả `BuildingDto[]`.

### `GET /api/building/{id}` — Admin/Staff
404 nếu không có.

### `POST /api/building` — Admin
Request: `{ "name": "...", "address": "...", "ownerId": 1, "description": "..." }`
Response 200: `BuildingDto`.

### `PUT /api/building` — Admin
Request: `{ "id": 1, "name": "...", "address": "...", "ownerId": 1, "description": "..." }`
Response 200: `{ "message": "Cập nhật thành công." }`

### `DELETE /api/building/{id}` — Admin
Response 200: `{ "message": "Xóa thành công." }`

**`BuildingDto`**: `{ id, name, address, ownerId, ownerName, description, roomCount, createdAt }`

---

## 6. Room — `/api/room`

### `GET /api/room/available?buildingId={id}` — công khai
Danh sách phòng `Status = Trong`. Trả `RoomDto[]`.

### `GET /api/room/{id}` — công khai
Trả `RoomDto`. 404 nếu không có.

### `GET /api/room?buildingId={id}&status={status}` — Admin/Staff
Danh sách đầy đủ, lọc tùy chọn.

### `POST /api/room` — Admin
Request: `{ "buildingId": 1, "roomNumber": "101", "area": 20, "price": 3000000, "serviceFee": 50000, "description": "...", "imageUrl": "..." }`
Response 200: `RoomDto`. `Status` mặc định `Trong`. `serviceFee` là đơn giá dịch vụ **tính theo đầu người/tháng** (xem công thức ở mục Invoice).

### `POST /api/room/upload` — Admin (`multipart/form-data`)
Fields: `buildingId, roomNumber, area, price, serviceFee, description, image` (file, 1 ảnh đại diện). Ảnh lưu `wwwroot/images/rooms/`.

### `PUT /api/room` — Admin
Request: `{ "id": 1, "roomNumber": "...", "area": 20, "price": 3000000, "serviceFee": 50000, "description": "...", "imageUrl": "..." }`

### `PUT /api/room/{id}/upload` — Admin (`multipart/form-data`)
Sửa thông tin phòng kèm đổi ảnh đại diện. Fields: `roomNumber, area, price, serviceFee, description, image` (optional — bỏ trống để giữ ảnh cũ). Trả về `RoomDto` mới nhất.

### `PUT /api/room/status` — Admin/Staff
Request: `{ "id": 1, "status": "DangSua" }` — có ghi `ActivityLog`.

### `DELETE /api/room/{id}` — Admin

### Thư viện ảnh/video của phòng (gallery)

- **`POST /api/room/{id}/media`** — Admin, `multipart/form-data`, field `files` (gửi nhiều file cùng lúc, lặp lại field name). Tự phân loại Image/Video theo đuôi file (`.mp4/.webm/.mov/.avi/.mkv/.m4v/.ogg` → Video). Ảnh lưu `wwwroot/images/rooms/`, video lưu `wwwroot/videos/rooms/`. Nếu phòng chưa có `ImageUrl`, tự lấy ảnh đầu tiên vừa upload làm đại diện. Trả `RoomMediaDto[]` (toàn bộ gallery sau khi thêm).
- **`DELETE /api/room/{id}/media/{mediaId}`** — Admin. Xóa 1 item (cả DB lẫn file vật lý). Nếu xóa đúng ảnh đại diện, tự chuyển đại diện sang ảnh còn lại đầu tiên.
- **`PUT /api/room/{id}/media/{mediaId}/primary`** — Admin. Đặt 1 ảnh trong gallery làm ảnh đại diện (`Room.ImageUrl`).

**`RoomMediaDto`**: `{ id, url, type, sortOrder }`

**`RoomDto`**: `{ id, buildingId, buildingName, roomNumber, area, price, serviceFee, status, description, imageUrl, createdAt, media: RoomMediaDto[], currentOccupants }`
- `currentOccupants` (nullable int): số người đang ở thực tế = 1 (người thuê chính) + số người ở cùng đã khai báo (`Occupant`) trên hợp đồng `DangHieuLuc` hiện tại của phòng. `null` nếu phòng không có hợp đồng hiệu lực.

---

## 7. Contract — `/api/contract`

### `POST /api/contract/request` — Tenant
Khách thuê đăng ký thuê phòng. Tự động upsert hồ sơ `Tenant` của user hiện tại. Chỉ thành công nếu phòng tồn tại và `Status = Trong`.

Request:
```json
{
  "roomId": 1,
  "startDate": "2026-09-01",
  "endDate": "2027-09-01",
  "numberOfOccupants": 2,
  "tenantProfile": {
    "fullName": "Nguyễn Văn A",
    "idCardNumber": "079123456789",
    "phone": "0901111111",
    "email": "a@mail.com",
    "emergencyContact": "0909999999"
  }
}
```
Response 200: `ContractDto` (`Status = ChoDuyet`, `MonthlyRent` = giá phòng hiện tại, `Deposit = 0`, `ElectricUnitPrice`/`WaterUnitPrice = 0` — chưa chốt).
Response 400: phòng không tồn tại / không còn trống.

### `GET /api/contract/my` — Tenant
Danh sách hợp đồng của chính mình.

### `GET /api/contract?status={status}` — Admin/Staff

### `GET /api/contract/{id}` — mọi role đã đăng nhập
Admin/Staff xem được tất cả; Tenant chỉ xem được hợp đồng của chính mình (403 nếu không phải chủ).

### `PUT /api/contract/{id}/approve` — Admin
Duyệt hợp đồng, cấu hình giá — **chốt luôn đơn giá điện/nước vào hợp đồng** (dùng cho mọi hóa đơn hàng tháng sau này, Staff không cần gõ tay). Frontend nên prefill `electricUnitPrice`/`waterUnitPrice` từ `GET /api/systemconfig` (`DefaultElectricUnitPrice`/`DefaultWaterUnitPrice`) nhưng Admin sửa được trước khi duyệt. **Tự động tạo hóa đơn cọc** (`Invoice.Type = Coc`, hạn 3 ngày). Chỉ áp dụng khi `Status = ChoDuyet`.

Request:
```json
{
  "deposit": 3200000,
  "monthlyRent": 3200000,
  "numberOfOccupants": 2,
  "electricUnitPrice": 3500,
  "waterUnitPrice": 35000,
  "endDate": "2027-09-01"
}
```
(`numberOfOccupants`, `endDate` optional — không gửi thì giữ giá trị cũ.)
Response 200: `{ "message": "Duyệt hợp đồng thành công, chờ khách thuê đóng cọc." }` → `Status = ChoCoc`.

### `PUT /api/contract/{id}/reject` — Admin
Request: `{ "reason": "..." }` (optional, chỉ ghi vào `ActivityLog`). Chỉ áp dụng khi `Status = ChoDuyet` → `TuChoi`.

### `PUT /api/contract/{id}/terminate` — Admin/Staff
Kết thúc hợp đồng đang `DangHieuLuc` → `DaKetThuc`, trả `Room.Status` về `Trong`.

### Người ở cùng (Occupant)

**Quy ước quan trọng**: `Contract.NumberOfOccupants` = **tổng số người ở phòng, tính cả người thuê chính**. Bảng `Occupant` chỉ lưu những người **NGOÀI** người thuê chính — số dòng Occupant tối đa của 1 hợp đồng = `NumberOfOccupants − 1`. `NumberOfOccupants` là số **cố định** do Admin đặt lúc duyệt hợp đồng (`PUT /contract/{id}/approve`) — thêm/sửa/xóa Occupant **không** tự đổi lại số này.

- **`GET /api/contract/{contractId}/occupant`** — Admin/Staff xem mọi hợp đồng; Tenant chỉ xem được hợp đồng của chính mình (403 nếu không phải chủ). Trả `OccupantDto[]`. 404 nếu hợp đồng không tồn tại.
- **`POST /api/contract/{contractId}/occupant`** — Tenant (chủ hợp đồng) hoặc Admin/Staff. Thêm 1 người ở cùng vào hợp đồng đang `DangHieuLuc`. Request: `{ "fullName": "...", "relationship": "...", "idCardNumber": "...", "phone": "..." }` (`fullName`, `relationship` bắt buộc). Trả `OccupantDto[]` (toàn bộ danh sách sau khi thêm).
  - 400 nếu hợp đồng không tồn tại/chưa hiệu lực, hoặc đã đủ số lượng: `{ "message": "Đã khai báo đủ số người ở theo hợp đồng (NumberOfOccupants). Nếu cần thêm người, hãy sửa lại số người ở trong hợp đồng trước." }`
- **`PUT /api/occupant/{id}`** — Tenant (chủ hợp đồng chứa occupant này) hoặc Admin/Staff. Request: `{ "fullName": "...", "relationship": "...", "idCardNumber": "...", "phone": "..." }`. Trả `OccupantDto`. 403 nếu không phải chủ, 404 nếu không tồn tại.
- **`DELETE /api/occupant/{id}`** — Tenant (chủ) hoặc Admin/Staff. Xóa 1 người (giải phóng lại 1 suất trong giới hạn `NumberOfOccupants − 1`).

**`OccupantDto`**: `{ id, contractId, fullName, relationship, idCardNumber, phone, createdAt }`

**Quyết định thiết kế** (khi Admin sửa `NumberOfOccupants` xuống thấp hơn số Occupant đã khai báo): hiện **chưa có endpoint sửa `NumberOfOccupants` sau khi hợp đồng đã `DangHieuLuc`** (chỉ đặt 1 lần lúc `approve`, trước khi Occupant có thể tồn tại — `AddOccupant` yêu cầu `Status = DangHieuLuc`). Nên tình huống xung đột này chưa xảy ra được qua API hiện tại. Nếu sau này thêm endpoint "sửa hợp đồng", áp dụng **cách (a) — chặn**: validate `NumberOfOccupants − 1 >= số Occupant hiện có` trước khi cho giảm, dùng đúng logic cap-check đã có sẵn trong `AddOccupant`, để tránh hợp đồng rơi vào trạng thái mâu thuẫn (số khai báo ít hơn số người thực tế đã ghi danh).

**`ContractDto`**: `{ id, roomId, roomNumber, tenantId, tenantName, startDate, endDate, deposit, monthlyRent, numberOfOccupants, electricUnitPrice, waterUnitPrice, status, createdAt, occupants: OccupantDto[] }`

---

## 8. Invoice — `/api/invoice`

### `POST /api/invoice` — Staff/Admin
Nhập **số công tơ điện/nước đầu-cuối kỳ**, tạo hóa đơn hàng tháng (`Type = HangThang`). Chỉ tạo được khi hợp đồng đang `DangHieuLuc`.

Công thức tính (đúng theo yêu cầu nghiệp vụ):
- `ElectricUsage = electricNewReading − electricOldReading`, `WaterUsage = waterNewReading − waterOldReading`.
- **Đơn giá điện/nước mặc định lấy từ `Contract.ElectricUnitPrice`/`WaterUnitPrice`** (đã chốt lúc duyệt hợp đồng) — **không cần Staff gõ tay**. Vẫn có thể gửi `electricUnitPrice`/`waterUnitPrice` trong request để ghi đè riêng cho hóa đơn đó nếu cần.
- `Tiền điện = ElectricUsage × đơn giá điện`, `Tiền nước = WaterUsage × đơn giá nước`.
- `Tiền dịch vụ = Room.ServiceFee (đơn giá/người) × Contract.NumberOfOccupants` (bỏ qua nếu = 0). Có thể ghi đè đơn giá qua `serviceFee` trong request (vẫn nhân với số người).
- `TotalAmount = Tiền phòng (Contract.MonthlyRent) + Tiền điện + Tiền nước + Tiền dịch vụ` — mỗi dòng là 1 `InvoiceItem`.

Validate: `electricNewReading >= electricOldReading` và `waterNewReading >= waterOldReading`, nếu không trả **400** với message rõ ràng (`"Số điện mới phải lớn hơn hoặc bằng số điện cũ."` / tương tự cho nước).

Request:
```json
{
  "contractId": 1,
  "month": 9, "year": 2026,
  "electricOldReading": 100, "electricNewReading": 220,
  "waterOldReading": 10, "waterNewReading": 25,
  "dueDate": "2026-10-05"
}
```
(`electricUnitPrice`, `waterUnitPrice`, `serviceFee` — tất cả optional, chỉ dùng khi muốn ghi đè giá trị mặc định từ hợp đồng/phòng.)

Response 200: `InvoiceDto`. Response 400: `{ "message": "..." }` — hợp đồng không tồn tại/chưa hiệu lực, hoặc số công tơ mới nhỏ hơn số cũ.

### `GET /api/invoice/my` — Tenant
Tất cả hóa đơn thuộc các hợp đồng của mình.

### `GET /api/invoice?status={status}&contractId={id}` — Staff/Admin

### `GET /api/invoice/{id}` — mọi role đã đăng nhập (Admin/Staff hoặc chủ hóa đơn)

**`InvoiceDto`**: `{ id, contractId, roomNumber, tenantName, month, year, electricOldReading, electricNewReading, electricUsage, electricUnitPrice, waterOldReading, waterNewReading, waterUsage, waterUnitPrice, totalAmount, type, status, dueDate, createdAt, items: [{ itemName, amount }] }`
- FE hiển thị: `"Điện: {electricOldReading} → {electricNewReading} (đã dùng {electricUsage} số)"` và tương tự cho nước, để khách đối chiếu công tơ thật.

---

## 9. Payment — `/api/payment`

### `GET /api/payment/qr/{invoiceId}` — Tenant
Sinh mã **VietQR** (chuẩn EMVCo/NAPAS 247, dựng nội bộ — không gọi API ngoài) cho hóa đơn của chính mình. Frontend tự render `payload` thành ảnh QR (ví dụ dùng thư viện `qrcode`).

Response 200: `{ "invoiceId": 1, "amount": 3000000, "payload": "00020101021238570010A00000072701..." }`
404 nếu hóa đơn không tồn tại / không thuộc về user.

### `GET /api/payment/invoice/{invoiceId}` — Admin/Staff hoặc chủ hóa đơn
Lịch sử thanh toán của 1 hóa đơn. Trả `PaymentDto[]`.

### `PUT /api/payment/confirm-cash` — Staff/Admin
Xác nhận đã nhận thanh toán (tiền mặt/chuyển khoản/QR — không phân biệt, chỉ ghi nhận). Tạo `Payment`, chuyển `Invoice.Status → DaThanhToan`. **Nếu là hóa đơn cọc** (`Invoice.Type = Coc`): tự động chuyển `Contract.Status → DangHieuLuc` và `Room.Status → DaThue`.

Request: `{ "invoiceId": 1, "amount": 3000000, "method": "TienMat", "transactionRef": "..." }` (`transactionRef` optional)
Response 200: `{ "message": "Xác nhận thanh toán thành công." }`
400 nếu hóa đơn không tồn tại hoặc đã thanh toán rồi.

**`PaymentDto`**: `{ id, invoiceId, amount, paymentDate, method, transactionRef }`

---

## 10. Maintenance — `/api/maintenance`

### `POST /api/maintenance` — Tenant
Gửi yêu cầu bảo trì/sự cố. Chỉ thành công nếu Tenant có hợp đồng `DangHieuLuc` đúng phòng đó.

Request: `{ "roomId": 1, "title": "Hỏng vòi nước", "description": "...", "imageUrl": "...", "priority": "Cao" }` (`priority` optional, mặc định `TrungBinh`)
Response 200: `MaintenanceRequestDto` (`Status = Moi`). 400 nếu không có hợp đồng hiệu lực cho phòng này.

### `POST /api/maintenance/upload` — Tenant (`multipart/form-data`)
Fields: `roomId, title, description, priority, image` (file). Ảnh lưu `wwwroot/images/maintenance/`.

### `GET /api/maintenance/my` — Tenant

### `GET /api/maintenance?status={status}` — Staff/Admin

### `GET /api/maintenance/{id}` — Admin/Staff hoặc chủ yêu cầu

### `PUT /api/maintenance/{id}/assign` — Staff/Admin
Phân công xử lý. Request: `{ "assignedToUserId": 2 }` → `Status = DaPhanCong`. Chỉ áp dụng khi đang `Moi`/`DaPhanCong`.

### `PUT /api/maintenance/{id}/status` — Staff/Admin
Request: `{ "status": "HoanThanh", "note": "..." }`. Nếu `status` là `HoanThanh`/`DaHuy` → tự set `ResolvedAt`.

**`MaintenanceRequestDto`**: `{ id, roomId, roomNumber, tenantId, tenantName, title, description, imageUrl, priority, status, assignedToUserId, assignedToUserName, createdAt, resolvedAt, note }`

---

## 11. Notification — `/api/notification`

### `GET /api/notification/my` — mọi role đã đăng nhập

### `PUT /api/notification/{id}/read` — mọi role đã đăng nhập (chỉ chủ thông báo)

### `POST /api/notification` — Staff/Admin
Gửi thông báo tới 1 user cụ thể. Request: `{ "userId": 5, "title": "...", "content": "...", "type": "ThongBaoChung" }`

### `POST /api/notification/remind-overdue` — Staff/Admin
Tự động quét toàn bộ `Invoice` đang `ChuaThanhToan` và đã qua `DueDate` → chuyển `Status = QuaHan`, tạo thông báo `Type = NhacNo` cho từng tenant liên quan.

Response 200: `{ "message": "Đã gửi nhắc nợ cho N hóa đơn quá hạn.", "count": N }`

### `POST /api/notification/remind-upcoming-invoices?daysBefore=3` — Staff/Admin
Quét hóa đơn `ChuaThanhToan` sắp đến `DueDate` trong `daysBefore` ngày tới (mặc định 3) — gửi thông báo `Type = NhacNo` cho **cả khách thuê lẫn toàn bộ Admin/Staff**. Không nhắc trùng cùng 1 hóa đơn trong cùng 1 ngày.

Response 200: `{ "message": "Đã nhắc N hóa đơn sắp đến hạn.", "count": N }`

### `POST /api/notification/remind-upcoming-contracts?daysBefore=7` — Staff/Admin
Quét hợp đồng `DangHieuLuc` sắp đến `EndDate` trong `daysBefore` ngày tới (mặc định 7) — gửi thông báo `Type = HopDong` cho **cả khách thuê lẫn toàn bộ Admin/Staff** (nhắc gia hạn). Không nhắc trùng trong cùng 1 ngày.

Response 200: `{ "message": "Đã nhắc N hợp đồng sắp hết hạn.", "count": N }`

**`NotificationDto`**: `{ id, userId, title, content, type, isRead, relatedInvoiceId, relatedContractId, createdAt }`

---

## 12. SystemConfig — `/api/systemconfig` (Admin)

Cấu hình dạng key-value. Các key được seed sẵn: `BankBin`, `BankAccountNumber`, `BankAccountName` (dùng bởi `VietQrService`), `DefaultElectricUnitPrice` (3500), `DefaultWaterUnitPrice` (18000), `DefaultServiceFee` (100000).

### `GET /api/systemconfig`
Trả `SystemConfigDto[]`.

### `PUT /api/systemconfig`
Upsert theo `Key` (tạo mới nếu chưa có, cập nhật nếu đã có).

Request: `{ "key": "BankBin", "value": "970422", "description": "..." }`
Response 200: `SystemConfigDto`.

---

## 13. Report — `/api/report` (Admin)

### `GET /api/report/dashboard`
```json
{
  "totalRooms": 5, "occupiedRooms": 2, "vacantRooms": 2, "maintenanceRooms": 1,
  "occupancyRate": 40.0,
  "totalTenants": 2,
  "totalRevenueThisMonth": 3000000,
  "revenueByMonth": [ { "month": 4, "year": 2026, "total": 0 }, "...(6 tháng gần nhất)" ],
  "overdueInvoiceCount": 0, "overdueAmount": 0,
  "pendingContracts": 1,
  "pendingMaintenanceRequests": 1
}
```

### `GET /api/report/logs?page=1&pageSize=20`
Log hoạt động hệ thống (`ActivityLog`), phân trang, mới nhất trước.

**`ActivityLogDto`**: `{ id, userId, userName, action, entityName, entityId, detail, createdAt }`

---

## 14. Upload ảnh

Ảnh upload (`POST /api/room/upload`, `POST /api/maintenance/upload`) được lưu vật lý trong `wwwroot/images/{rooms|maintenance}/{guid}.{ext}` và trả về `imageUrl` dạng đường dẫn tương đối (`/images/rooms/xxx.jpg`). Truy cập trực tiếp qua `{baseUrl}/images/rooms/xxx.jpg` (static files đã bật trong `Program.cs`).

## 15. CORS

Đang cho phép origin `http://localhost:5173` (Vite dev server React) — sửa trong `Program.cs` (policy `"ReactApp"`) nếu deploy domain khác.
