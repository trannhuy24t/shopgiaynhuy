# TroHub — Đặc tả & hướng dẫn tích hợp API (Hệ thống quản lý nhà trọ)

Tài liệu này theo dõi tiến độ nối FE React vào backend thật (`ShopAPI`, đã đổi nghiệp vụ
sang quản lý nhà trọ/chung cư mini). Cập nhật sau mỗi phần chức năng hoàn thành.

## 1. Kết nối & môi trường

- Base URL: khai báo ở `.env` → `VITE_API_BASE_URL=http://localhost:5141` (không hardcode).
  Axios instance dùng chung ở [`src/api/client.ts`](src/api/client.ts), tự ghép `/api`.
- CORS backend (`Program.cs`) chỉ mở cho `http://localhost:5173` — chạy `npm run dev` đúng
  port mặc định của Vite, không đổi port.
- Interceptor: tự gắn `Authorization: Bearer {token}` từ `localStorage.token`; nhận `401` thì
  tự xóa `token`/`user` và điều hướng `/login`. Có các helper dùng chung ở mọi trang:
  - `getApiErrorMessage(error, fallback)` — lấy đúng `message` backend trả về.
  - `isForbiddenError(error)` / `isNotFoundError(error)` — check status 403 / 404.
  - `resolveImageUrl(url)` — ghép domain backend vào đường dẫn ảnh tương đối (VD:
    `/images/rooms/xxx.jpg`) để `<img>` load đúng, vì backend trả path tương đối theo domain
    của chính nó, không phải domain FE.

## 2. Auth & Role

Đăng nhập/đăng ký giữ nguyên cơ chế cũ trong `context/AuthContext.tsx` (không đổi logic),
chỉ thêm 2 field suy ra từ `user.role`: `isAuthenticated`, `isAdmin`.

| Role | Ý nghĩa | Ghi chú |
|---|---|---|
| `Admin` | Chủ trọ | Toàn quyền |
| `Staff` | Nhân viên quản lý | Không có quyền Report, User, SystemConfig, Building |
| `Tenant` | Khách thuê | Chỉ thấy dữ liệu của chính mình |
| `User` | Mặc định khi `/auth/register` | Chưa dùng được gì — Admin đổi role qua trang Quản lý người dùng (`/admin/users`) hoặc `PUT /api/user/{id}/role` |

Bảo vệ route theo role dùng component `RoleRoute` (trong [`App.tsx`](src/App.tsx)), nhận
`roles: Role[]`. `PrivateRoute` dùng cho trang chỉ cần đăng nhập, không phân biệt role (VD
Thông báo). Không đụng tới cơ chế Auth/Login gốc.

**Bug đã sửa (2026-08-22)**: `LoginPage.tsx` trước đây gọi thẳng `api/auth` và tự ghi
`localStorage`, không qua `AuthContext` nên `user` trong React không đổi cho tới khi F5. Đã sửa
dùng `useAuth().login()` sẵn có — Header cập nhật ngay khi đăng nhập thành công. Sửa kèm: đường
dẫn chuyển hướng sau đăng nhập Admin/Staff về `/admin` (trước trỏ `/admin/dashboard` — route
không tồn tại), bỏ `alert()` chặn màn hình.

## 3. Enum trạng thái dùng chung

Định nghĩa 1 nơi duy nhất: [`constants/statusLabels.ts`](src/constants/statusLabels.ts) —
map từng giá trị enum (giữ nguyên chuỗi tiếng Việt không dấu từ backend) sang label + màu badge.
Dùng qua component [`<StatusBadge entity="..." value="..." />`](src/components/Common/StatusBadge.tsx).

`entity` hỗ trợ: `room`, `contract`, `invoiceStatus`, `invoiceType`, `paymentMethod`,
`maintenancePriority`, `maintenanceStatus`, `notificationType`.

## 4. Type/DTO

Toàn bộ type khớp chính xác DTO đọc trực tiếp từ source backend (`ShopAPI/DTOs/*.cs`), đặt ở
`src/types/<domain>.ts`: `auth`, `user`, `building`, `room`, `tenant`, `contract`, `invoice`,
`payment`, `maintenance`, `notification`, `systemConfig`, `report`, `common` (có `PagedResult<T>`).

## 5. Các trang đã hoàn thành theo nhóm chức năng

Thứ tự nhóm: Room + Building → Auth/Tenant profile → Contract → Invoice + Payment →
Maintenance → Notification → User/SystemConfig/Report. Toàn bộ trang gọi API thật (không
mock), build sạch (`tsc --noEmit && vite build`), và đã live-test qua API thật (không chỉ đọc
source) cho từng nhóm.

### Room + Building

| Trang | Route | Role | API |
|---|---|---|---|
| Danh sách phòng trống | `/rooms` | Công khai | `GET /Room/available` |
| Chi tiết phòng | `/rooms/:id` | Công khai | `GET /Room/{id}` |
| Quản lý phòng | `/admin/rooms` | Admin (đủ CRUD), Staff (xem + đổi trạng thái) | `GET/POST/PUT /Room`, `PUT /Room/status`, `POST /Room/upload`, `PUT /Room/{id}/upload`, `DELETE /Room/{id}` |
| Quản lý tòa nhà | `/admin/buildings` | Admin | `GET/POST/PUT/DELETE /Building` |

File API: [`api/room`](src/api/room/index.ts), [`api/building`](src/api/building/index.ts).

**Sửa phòng kèm upload ảnh (bổ sung backend 2026-08-22)**: `PUT /api/room/{id}/upload` (Admin,
multipart/form-data — fields `roomNumber`, `area`, `price`, `description`, `image`; không gửi
`image` thì giữ nguyên ảnh cũ; trả về `RoomDto` mới nhất). `RoomManagerPage` đổi ô "Đường dẫn
ảnh" khi sửa thành file picker giống hệt lúc tạo mới (dùng chung 1 UI cho cả 2 case), có preview
ảnh hiện tại khi mở modal sửa (`updateRoomWithImage`). Đã live-test cả 2 case: không gửi ảnh →
giữ nguyên, gửi ảnh mới → cập nhật đúng.

### Auth/Tenant profile

| Trang | Route | Role | API |
|---|---|---|---|
| Hồ sơ khách thuê | `/ho-so` | Tenant | `GET/PUT /Tenant/me` |

Xử lý riêng: `GET /Tenant/me` trả 404 khi chưa có hồ sơ → không coi là lỗi, hiện form trống để
tạo mới (cùng 1 form Upsert). File API: [`api/tenant`](src/api/tenant/index.ts).

### Contract

| Trang | Route | Role | API |
|---|---|---|---|
| Form đăng ký thuê (kèm hồ sơ tenant) | `/thue/:roomId` | Tenant | `POST /Contract/request` |
| Hợp đồng của tôi | `/hop-dong-cua-toi` | Tenant | `GET /Contract/my`, `GET /Contract/{id}` |
| Quản lý hợp đồng | `/admin/contracts` | Admin (duyệt/từ chối/kết thúc), Staff (xem + kết thúc) | `GET /Contract?status=`, `PUT /Contract/{id}/approve\|reject\|terminate` |

File API: [`api/contract`](src/api/contract/index.ts). Đã verify: request → duyệt → hệ thống
tự tạo hóa đơn cọc (`type: Coc`, `status: ChuaThanhToan`) khớp 100% với `types/invoice.ts`.

**Số người ở & người ở cùng — thiết kế cuối (route đã đổi 2 lần, chốt 2026-08-22)**:
`Contract.NumberOfOccupants` (int, tính cả người thuê chính, Tenant khai khi đăng ký/Admin sửa lại
khi duyệt) là tổng số người ở. Người ở cùng (không tính người thuê chính) khai theo từng tên qua
bảng `Occupant` riêng — route đã đổi từ `/Contract/{id}/occupants` (số nhiều, DELETE lồng trong
Contract) sang route xác nhận qua Swagger cuối cùng:

| Chức năng | Method | Route | Ai gọi được |
|---|---|---|---|
| Danh sách người ở cùng | GET | `/Contract/{id}/occupant` | Tenant chủ hợp đồng, Admin, Staff |
| Thêm người ở cùng | POST | `/Contract/{id}/occupant` | Tenant chủ hợp đồng, Admin, Staff |
| Sửa 1 người | PUT | `/Occupant/{id}` (Controller riêng, chỉ cần occupantId) | Tenant chủ hợp đồng, Admin, Staff |
| Xóa 1 người | DELETE | `/Occupant/{id}` | Tenant chủ hợp đồng, Admin, Staff |

`OccupantDto`: `{ id, contractId, fullName, relationship, idCardNumber, phone, createdAt }` —
`relationship` bắt buộc (khác thiết kế đầu, lúc đó optional). Giới hạn: số `Occupant` tối đa =
`NumberOfOccupants − 1`; vượt giới hạn → backend trả 400 với message cụ thể, FE hiển thị đúng
message đó (không tự bịa). Không có endpoint sửa `NumberOfOccupants` sau khi duyệt hợp đồng — chỉ
đặt được 1 lần lúc `approve`.

File API: [`api/occupant`](src/api/occupant/index.ts) (4 hàm đúng 4 route trên — tách riêng khỏi
`api/contract` vì 2 route PUT/DELETE nằm ở `OccupantController` độc lập).

FE dùng chung 1 component [`OccupantManager`](src/components/Common/OccupantManager.tsx) (tự gọi
GET để tải danh sách, tự tính cap từ `numberOfOccupants − occupants.length`, ẩn nút Thêm khi đủ
cap hoặc hợp đồng không phải `DangHieuLuc`) ở cả 3 nơi:
- [`MyContractsPage`](src/features/contract/MyContractsPage.tsx) (Tenant, chế độ đầy đủ — thêm/sửa/xóa) trong modal chi tiết hợp đồng.
- [`ContractManagerPage`](src/features/admin/contracts/ContractManagerPage.tsx) (Admin/Staff, chế độ đầy đủ) — nút "Người ở" mới trên mỗi hợp đồng `DangHieuLuc`, mở modal riêng.
- [`RoomManagerPage`](src/features/admin/rooms/RoomManagerPage.tsx) (Admin/Staff, `readOnly` — chỉ xem, không có nút Thêm/Sửa/Xóa) trong popup "Người ở phòng X" có sẵn.

Lỗi từ backend (vượt cap, 403 không phải chủ hợp đồng...) hiển thị qua
[`Toast`](src/components/Common/Toast.tsx) mới (tự ẩn sau 4s, không phải alert/banner tĩnh).

Live-test đủ cả 6 kịch bản qua API thật (tạo hợp đồng mới, duyệt, xác nhận cọc → `DangHieuLuc`,
cap = 2):
1. Tenant chủ hợp đồng thêm 2 người → `200`, đúng cap.
2. Thêm người thứ 3 (vượt cap) → `400`, message: "Đã khai báo đủ số người ở theo hợp đồng
   (NumberOfOccupants). Nếu cần thêm người, hãy sửa lại số người ở trong hợp đồng trước." — FE
   hiện nguyên message này qua Toast.
3. Staff xem danh sách qua `GET` → đúng dữ liệu.
4. Tenant khác (không phải chủ hợp đồng) gọi `GET` → `403`.
5. Admin sửa 1 người qua `PUT /Occupant/{id}` → cập nhật đúng, trả về `OccupantDto` mới.
6. Admin xóa qua `DELETE /Occupant/{id}` → mất khỏi danh sách, cap mở lại, thêm người mới thành công ngay sau đó.

Dữ liệu test (hợp đồng, tài khoản Tenant tạm) đã dọn sạch sau khi verify xong.

### Invoice + Payment

| Trang | Route | Role | API |
|---|---|---|---|
| Hóa đơn của tôi + QR thanh toán | `/hoa-don-cua-toi` | Tenant | `GET /Invoice/my`, `GET /Payment/qr/{invoiceId}` |
| Tạo hóa đơn hàng tháng | `/admin/invoices/tao-moi` | Admin, Staff | `GET /Contract?status=DangHieuLuc`, `GET /SystemConfig` (chỉ Admin, xem lưu ý), `POST /Invoice` |
| Quản lý hóa đơn + xác nhận thanh toán + nhắc nợ | `/admin/invoices` | Admin, Staff | `GET /Invoice?status=`, `PUT /Payment/confirm-cash`, `POST /Notification/remind-overdue\|remind-upcoming-invoices` |

File API: [`api/invoice`](src/api/invoice/index.ts), [`api/payment`](src/api/payment/index.ts),
[`api/systemConfig`](src/api/systemConfig/index.ts) (rút gọn, chỉ GET).

**Cài thêm dependency** (đã được duyệt): `qrcode` + `@types/qrcode` — render payload VietQR
(chuỗi EMV) thành ảnh QR ngay trên trình duyệt, không gọi dịch vụ ngoài.

**Lưu ý lệch spec đã xác nhận với bạn**: `GET /SystemConfig` chỉ role `Admin` gọi được (Staff bị
403). Xử lý: Admin tạo hóa đơn thì form tự điền giá điện/nước/phí dịch vụ; Staff tự nhập tay, có
banner giải thích, không chặn luồng.

**Phí dịch vụ tính theo số người ở — thiết kế cuối (2026-08-22, backend đổi 2 lần)**: lần đầu mình
làm phần nhân "đơn giá × số người" ở FE, dùng 1 `SystemConfig` key `ServiceFeePerPerson` chung cho
cả hệ thống. Bạn tự sửa lại backend theo hướng khác (per-room, không phải global) — đã bỏ cách cũ,
chuyển hẳn sang thiết kế mới của bạn:
- `Room.ServiceFee` (decimal) — đơn giá dịch vụ/người/tháng, cấu hình **riêng cho từng phòng**
  (không còn ở Cấu hình hệ thống nữa — đã xóa field `ServiceFeePerPerson` khỏi
  [`SystemConfigPage`](src/features/admin/systemConfig/SystemConfigPage.tsx), thêm banner giải
  thích đã dời đi đâu). Sửa được qua `POST/PUT /Room` và cả 2 endpoint upload ảnh.
- `CreateInvoiceDto.ServiceFee` đổi thành `decimal?` (trước là bắt buộc) — ý nghĩa cũng đổi: giờ
  là **đơn giá/người**, không phải tổng tiền. Bỏ trống (`null`/không gửi field) thì backend tự lấy
  `Contract.Room.ServiceFee`; Staff vẫn gõ tay được đơn giá khác để ghi đè. Backend tự nhân với
  `Contract.NumberOfOccupants` — **FE không tự nhân nữa** (bản trước có tự nhân ở FE rồi gửi tổng
  lên, giờ bỏ hẳn vì backend nhân rồi, tự nhân 2 lần sẽ sai).
- `RoomDto.CurrentOccupants` (int?, mới) — số người đang ở thực tế của phòng, `null` nếu phòng
  đang trống. **Bug đã sửa (2026-08-22)**: bản đầu backend tính sai bằng
  `1 + activeContract.Occupants.Count` (đếm theo bảng `Occupant`), lệch với
  `Contract.NumberOfOccupants` khi Admin đặt số người thẳng lúc duyệt mà chưa ai khai tên qua
  "Thêm người" — VD hợp đồng ghi 2 người nhưng chưa khai tên ai thì hiện sai thành 1. Đã sửa
  `RoomService.MapToDto` dùng thẳng `activeContract.NumberOfOccupants` (nguồn dữ liệu chính thức
  duy nhất), live-test xác nhận đúng.

FE: [`InvoiceCreatePage`](src/features/admin/invoices/InvoiceCreatePage.tsx) — ô "Đơn giá / người"
để trống mặc định, gọi `GET /Room/{id}` theo hợp đồng đang chọn để hiện đơn giá + số người ở tham
khảo (không bắt buộc nhập); khi submit, để trống thì gửi `undefined` (không phải `0`, tránh ghi đè
nhầm đơn giá phòng thành 0đ). [`RoomManagerPage`](src/features/admin/rooms/RoomManagerPage.tsx) —
thêm ô "Phí dịch vụ / người / tháng" vào form tạo/sửa phòng, cột "Số người ở" trong bảng
(`currentOccupants`).

Trang [`MyContractsPage`](src/features/contract/MyContractsPage.tsx) (Tenant) và
[`ContractManagerPage`](src/features/admin/contracts/ContractManagerPage.tsx) (Admin/Staff) đều
hiện số người ở; modal chi tiết hợp đồng của Tenant liệt kê rõ "Các khoản tiền" (Tiền cọc, Giá
thuê/tháng) thay vì để lẫn trong danh sách chung.

Live-test xác nhận đúng công thức: đặt `Room.ServiceFee = 120.000`, hợp đồng có 2 người ở, tạo hóa
đơn không gửi `serviceFee` → item tự thêm `"Phí dịch vụ (120.000đ x 2 người)" = 240.000`, cộng
đúng vào `totalAmount`.

**Việc còn để ngỏ (chưa làm, cần số liệu thật từ bạn)**: hóa đơn Phòng 201 kỳ 8/2026 (đã
"Đã thanh toán") được tạo từ trước khi có tính năng này nên không có dòng "Phí dịch vụ". Bạn đã
xác nhận muốn sửa lại hóa đơn này (cộng thêm dòng phí dịch vụ + cập nhật số tiền `Payment` đã ghi
nhận cho khớp) nhưng mình chưa có 2 số liệu thật cần thiết: đơn giá dịch vụ/người thật của phòng
201, và số người ở thật của hợp đồng đó — giờ bạn có thể tự khai qua "Thêm người ở cùng" ở trang
Hợp đồng của tôi, và tự đặt đơn giá thật ở Quản lý phòng → phòng 201. Báo lại khi xong để mình sửa
hóa đơn cũ theo đúng số liệu đó.

Live-test xác nhận toàn bộ vòng đời: `PUT /Payment/confirm-cash` (Staff) → hóa đơn chuyển
`DaThanhToan` → **hợp đồng tự chuyển `ChoCoc` → `DangHieuLuc`** → lịch sử thanh toán đúng
`PaymentDto[]`. Đã render thử QR payload thật qua `qrcode` thành PNG hợp lệ.

Ngoài kênh thông báo, [`MyInvoicesPage`](src/features/invoice/MyInvoicesPage.tsx) tự tính phía
FE (không gọi thêm API): hóa đơn `ChuaThanhToan` có hạn trong ≤3 ngày tới được viền cam + nhãn
"Sắp đến hạn — còn N ngày", kèm banner tổng số hóa đơn sắp đến hạn ở đầu trang.

**Giá điện/nước chốt trong hợp đồng + số công tơ đầu-cuối (2026-08-22)**: `Contract.ElectricUnitPrice`/
`WaterUnitPrice` (backend làm trước, xác nhận qua Swagger) — đơn giá điện/nước chốt 1 lần lúc
duyệt hợp đồng, giống hệt cách `NumberOfOccupants`/`ServiceFee` hoạt động. `CreateInvoiceDto`'s
`ElectricUnitPrice`/`WaterUnitPrice` là `decimal?` — bỏ trống thì backend tự lấy đúng giá đã chốt
trong hợp đồng. `Invoice` lưu lại cả 2 chỉ số cũ/mới (không chỉ mỗi số đã dùng) cho cả điện lẫn nước.

FE nối đủ 5 phần:
1. [`ContractManagerPage`](src/features/admin/contracts/ContractManagerPage.tsx) — modal Duyệt hợp
   đồng có 2 ô "Đơn giá điện (đ/kWh)" / "Đơn giá nước (đ/m³)", prefill từ `GET /SystemConfig`
   (`DefaultElectricUnitPrice`/`DefaultWaterUnitPrice`), Admin sửa được trước khi bấm Duyệt. Bảng
   danh sách có cột "Điện / Nước" hiện giá đã chốt của từng hợp đồng.
2. [`InvoiceCreatePage`](src/features/admin/invoices/InvoiceCreatePage.tsx) — **đã bỏ hẳn 2 ô nhập
   giá điện/nước** (trước đó có nhập tay, giờ khóa cứng theo hợp đồng để tránh gõ nhầm) — thay bằng
   dòng chữ read-only "Giá điện: Xđ/kWh (theo hợp đồng)" ngay trên 2 ô chỉ số cũ/mới; nếu hợp đồng
   chưa có giá (hợp đồng cũ, duyệt trước khi có tính năng này) thì hiện cảnh báo đỏ "Hợp đồng chưa
   chốt giá điện/nước" và chặn submit — không cho tạo hóa đơn 0đ tiền điện/nước do thiếu dữ liệu.
   Payload gửi lên **không còn field `electricUnitPrice`/`waterUnitPrice`** nữa, chỉ gửi 4 chỉ số
   cũ/mới — backend tự lấy giá từ hợp đồng.
3. [`MyInvoicesPage`](src/features/invoice/MyInvoicesPage.tsx) (Tenant) và
   [`InvoiceManagerPage`](src/features/admin/invoices/InvoiceManagerPage.tsx) (Admin/Staff) — đã
   làm từ trước, hiện rõ "Chỉ số 100 → 220 (120 kWh) × 3.500đ" thay vì chỉ mỗi số đã dùng; hóa đơn
   cũ không có dữ liệu chỉ số thì tự fallback về hiển thị cũ, không hiện "0 → 0".
4. [`MyContractsPage`](src/features/contract/MyContractsPage.tsx) và `ContractManagerPage` — đã
   hiện "Đơn giá điện"/"Đơn giá nước" cạnh "Số người ở" trong chi tiết hợp đồng.
5. `types/contract.ts`/`types/invoice.ts` — đã khớp field mới (`electricUnitPrice`,
   `waterUnitPrice` trên `ContractDto`; `electricOldReading/NewReading/UnitPrice`,
   `waterOldReading/NewReading/UnitPrice` trên `InvoiceDto`).

Live-test toàn bộ luồng bằng dữ liệu thật (không mock): đăng ký thuê phòng 301 → Admin duyệt với
`electricUnitPrice=4000, waterUnitPrice=40000` → xác nhận cọc (`DangHieuLuc`) → tạo hóa đơn hàng
tháng **chỉ gửi 4 chỉ số công tơ, không gửi giá** → hóa đơn trả về đúng
`electricUnitPrice: 4000, waterUnitPrice: 40000` (tự lấy từ hợp đồng), tiền điện = 80kWh × 4.000 =
320.000đ, tiền nước = 13m³ × 40.000 = 520.000đ, cộng đúng vào `totalAmount`; Tenant xem
`GET /Invoice/my` thấy đủ chỉ số cũ/mới. Dữ liệu test đã dọn sạch sau khi verify.

**Gán đơn giá điện/nước cho hợp đồng đang hiệu lực còn thiếu (2026-08-22)**: phát hiện 1 hợp đồng
thật (không phải test hôm đó) — hợp đồng #2, phòng 101 — duyệt trước khi có tính năng chốt giá nên
`ElectricUnitPrice`/`WaterUnitPrice` = 0, sẽ bị chặn khi tạo hóa đơn hàng tháng. Thay vì vá tay 1
lần qua SQL, xây hẳn tính năng:
- `PUT /Contract/{id}/set-unit-price` (Admin only) — `SetContractUnitPriceDto { ElectricUnitPrice,
  WaterUnitPrice }`, chỉ áp dụng cho hợp đồng `DangHieuLuc`, không cần quay lại bước approve.
- Gán giá thành công → backend **tự tạo `Notification`** (`Type = HopDong`) gửi thẳng cho Tenant
  của hợp đồng đó, nội dung nêu rõ đơn giá mới — không cần FE gọi thêm `POST /Notification` như các
  luồng khác (khác với `notifyTenant` util — auto ở đây vì đây là hành động 1 chiều từ Admin, không
  qua form riêng).
- FE: [`ContractManagerPage`](src/features/admin/contracts/ContractManagerPage.tsx) — banner cảnh
  báo màu vàng ở đầu trang liệt kê tất cả hợp đồng `DangHieuLuc` đang thiếu giá (tính riêng, không
  phụ thuộc bộ lọc trạng thái hiện tại), mỗi hợp đồng có nút "Gán giá" mở form 2 ô nhập; cột "Điện
  / Nước" trong bảng cũng có nút "Gán giá" ngay tại dòng nếu thiếu.

Live-test đúng hợp đồng #2 qua API thật: gọi `PUT /Contract/2/set-unit-price` với
`{electricUnitPrice: 3500, waterUnitPrice: 35000}` → `200`, `Notification` mới xuất hiện ở
`GET /Notification/my` của Tenant với nội dung đúng đơn giá; tạo hóa đơn hàng tháng cho hợp đồng #2
ngay sau đó → thành công (trước đó sẽ bị chặn). Xác nhận DB không còn hợp đồng `DangHieuLuc` nào
thiếu giá sau khi xử lý.

**Khách xem giá điện/nước trước khi đăng ký thuê (2026-08-22)**: khách chưa có hợp đồng thì chưa
có giá chốt thật — cần 1 nguồn giá tham khảo public. Thêm `GET /SystemConfig/public-rates`
(`[AllowAnonymous]`, đặt trong `SystemConfigController` vốn yêu cầu `Admin` ở class-level nhưng
override bằng `[AllowAnonymous]` ở action) — chỉ trả về `{ electricUnitPrice, waterUnitPrice }` từ
2 key `DefaultElectricUnitPrice`/`DefaultWaterUnitPrice`, **không** lộ toàn bộ `SystemConfig` (tránh
lộ thông tin tài khoản ngân hàng cho người chưa đăng nhập).

FE gọi endpoint này (không cần đăng nhập) ở 3 nơi:
- [`RoomListPage`](src/features/room/RoomListPage.tsx) — banner "Ước tính giá điện/nước: Xđ/kWh,
  Yđ/m³ (theo giá chung hiện hành, có thể thay đổi khi ký hợp đồng)".
- [`RoomDetailPage`](src/features/room/RoomDetailPage.tsx) — khối "Chi phí dự kiến" cạnh mô tả
  phòng, gồm phí dịch vụ/người (từ `Room.ServiceFee`, đã có sẵn) + ước tính điện/nước.
- [`ContractRequestPage`](src/features/contract/ContractRequestPage.tsx) — khối "Chi phí ước tính"
  đầy đủ 3 khoản (giá thuê/tháng, đơn giá dịch vụ/người, ước tính điện/nước) ngay trước nút xác
  nhận đăng ký, kèm chú thích rõ giá điện/nước sẽ chốt chính thức khi duyệt hợp đồng, có thể khác
  giá tham khảo này nếu có thỏa thuận riêng.

Live-test: `curl /api/SystemConfig/public-rates` không cần token → trả đúng
`{"electricUnitPrice":3500,"waterUnitPrice":35000}`.

### Maintenance

| Trang | Route | Role | API |
|---|---|---|---|
| Gửi yêu cầu bảo trì | `/yeu-cau-bao-tri/moi` | Tenant | `POST /Maintenance`, `POST /Maintenance/upload` |
| Yêu cầu của tôi | `/yeu-cau-cua-toi` | Tenant | `GET /Maintenance/my` |
| Quản lý bảo trì (phân công, cập nhật trạng thái) | `/admin/maintenance` | Admin, Staff | `GET /Maintenance?status=`, `PUT /Maintenance/{id}/assign\|status` |

File API: [`api/maintenance`](src/api/maintenance/index.ts),
[`api/user`](src/api/user/index.ts) (`getUsers(role?)`).

**Lưu ý lệch spec (cùng dạng SystemConfig)**: `GET /User` cũng chỉ role `Admin` gọi được — Staff
bị 403 khi cần lấy danh sách nhân viên để phân công. Xử lý: Admin thấy dropdown chọn nhân viên
đầy đủ; Staff nhập tay ID nhân viên (có banner giải thích), `PUT /Maintenance/{id}/assign` vẫn
hoạt động bình thường cho Staff.

Live-test xác nhận đúng: Tenant gửi yêu cầu → Staff tự phân công → trạng thái tự chuyển
`Moi → DaPhanCong` → cập nhật `DangXuLy → HoanThanh` kèm ghi chú → Tenant thấy đúng
`resolvedAt`, `note`, `assignedToUserName`.

### Notification

| Trang | Route | Role | API |
|---|---|---|---|
| Thông báo của tôi | `/thong-bao` | Bất kỳ user đã đăng nhập (không giới hạn role — đúng như backend) | `GET /Notification/my`, `PUT /Notification/{id}/read` |

File API: [`api/notification`](src/api/notification/index.ts). Dùng `PrivateRoute` vì
`NotificationController` không giới hạn role cho 2 endpoint này. Icon chuông trên Header hiện
cho mọi user đã đăng nhập. Nút **"Đọc tất cả"** (không có endpoint bulk ở backend — gọi song
song `PUT /Notification/{id}/read` cho từng thông báo chưa đọc qua `Promise.allSettled`, báo lỗi
nếu có cái thất bại).

### User/SystemConfig/Report

| Trang | Route | Role | API |
|---|---|---|---|
| Quản lý người dùng | `/admin/users` | Admin | `GET /User?role=`, `POST /User/staff`, `POST /User/tenant`, `PUT /User/{id}/role` |
| Cấu hình hệ thống | `/admin/system-config` | Admin | `GET/PUT /SystemConfig` |
| Dashboard báo cáo | `/admin/report` | Admin | `GET /Report/dashboard` |
| Nhật ký hoạt động (phân trang thật) | `/admin/logs` | Admin | `GET /Report/logs?page=&pageSize=` (`PagedResultDto<ActivityLogDto>`) |

File API: [`api/user`](src/api/user/index.ts) (đầy đủ), [`api/report`](src/api/report/index.ts).
Trang Quản lý người dùng ban đầu chỉ là **màn hình đổi role** (nâng role `User` mặc định lên
`Tenant`/`Staff`/`Admin`).

**Tạo thẳng tài khoản khách thuê (2026-08-22)**: thêm `POST /User/tenant`
(`CreateTenantAccountDto { FullName, Email, Password }`, Admin only) — mirror y hệt
`POST /User/staff` đã có sẵn nhưng gán cứng `Role = "Tenant"` thay vì `"Staff"`. Tài khoản tạo ra
có role `Tenant` ngay lập tức, không cần bước "Đổi role" thủ công như tài khoản tự đăng ký. Chưa
tạo kèm hồ sơ `Tenant` (bảng nghiệp vụ riêng, khác User) — khách tự điền ở `/ho-so` hoặc hồ sơ tự
tạo khi khách đăng ký thuê phòng (`UpsertForUser`), giống hệt cách tài khoản Tenant tự đăng ký hoạt
động từ trước.

FE thêm nút "Tạo tài khoản khách thuê" cạnh nút "Tạo tài khoản nhân viên" có sẵn trên
[`UserManagerPage`](src/features/admin/users/UserManagerPage.tsx), modal giống hệt cấu trúc modal
tạo nhân viên (Họ tên/Email/Mật khẩu).

Live-test qua API thật: tạo tài khoản mới → `role: "Tenant"` ngay trong response; đăng nhập bằng
tài khoản đó → gọi được `GET /Contract/my` (route chỉ role `Tenant`) ngay lập tức, không cần đổi
role tay; tạo trùng email → `400 "Email đã tồn tại."`; xuất hiện đúng trong
`GET /User?role=Tenant`. Dữ liệu test đã xóa sau khi verify.

## 6. Thông báo tự động 2 chiều + nhắc sắp đến hạn

Ban đầu backend **không tự tạo thông báo** cho bất kỳ hành động nào. Vì `POST /Notification`
chỉ `Staff`/`Admin` gọi được, 2 chiều có cách làm khác nhau:

- **Admin/Staff → Tenant (FE tự gọi thêm)**: helper
  [`utils/notifyTenant.ts`](src/utils/notifyTenant.ts) (`notifyTenant(tenantId, payload)`,
  `notifyTenantByContract(contractId, payload)` — tự tra `userId` thật của khách thuê qua
  `GET /Tenant/{id}` rồi gọi `POST /Notification`, lỗi không chặn hành động chính). Gắn ở:
  duyệt/từ chối/kết thúc hợp đồng, xác nhận thanh toán + tạo hóa đơn mới, phân công + cập nhật
  trạng thái bảo trì.
- **Tenant → Admin/Staff (backend tự làm, 2026-08-22)**: bạn đã sửa `ContractService.Request()`
  và `MaintenanceRequestService.Create()` để tự tạo thông báo ("Yêu cầu thuê phòng mới" / "Yêu
  cầu bảo trì mới") gửi cho Admin/Staff ngay khi Tenant submit — FE không cần sửa gì, trang
  Thông báo + chuông poll đã nhận được ngay.

**Nhắc nhở sắp đến hạn (bổ sung backend 2026-08-22)**: thêm field `relatedContractId` vào
`NotificationDto` + 2 endpoint mới (`Staff`/`Admin`), gửi cho **cả khách thuê lẫn Admin/Staff**:

| Endpoint | Ý nghĩa | Nút FE |
|---|---|---|
| `POST /Notification/remind-upcoming-invoices?daysBefore=3` | Hóa đơn `ChuaThanhToan` có `DueDate` trong N ngày tới | "Nhắc hóa đơn sắp đến hạn" ở `/admin/invoices` |
| `POST /Notification/remind-upcoming-contracts?daysBefore=7` | Hợp đồng `DangHieuLuc` có `EndDate` trong N ngày tới | "Nhắc hợp đồng sắp hết hạn" ở `/admin/contracts` |

Đã live-test cả 2 endpoint: trả đúng `{message, count}`, gửi đúng cả khách thuê và Admin/Staff,
Tenant gọi bị chặn 403.

**Chuông thông báo tự cập nhật (polling)**: backend chưa có WebSocket/SignalR nên
[`App.tsx`](src/App.tsx) tự gọi lại `GET /Notification/my` mỗi 30 giây khi đã đăng nhập, hiện
badge số chưa đọc trên icon chuông. Không tức thời 100% — tối đa lệch 30s.

**Chuông đổi thành dropdown thay vì điều hướng sang trang riêng (2026-08-22)**: trước đó bấm
chuông chuyển thẳng sang `/thong-bao` (rời trang đang xem). Đổi thành
[`NotificationDropdown`](src/components/Common/NotificationDropdown.tsx) — panel nổi bung ra ngay
dưới chuông (giống kiểu chuông thông báo phổ biến), tự đóng khi bấm ra ngoài, không cần rời trang.
Không thêm API mới — vẫn dùng `GET /Notification/my` (gọi khi mở dropdown) và
`PUT /Notification/{id}/read` (bấm vào từng thông báo hoặc "Đọc tất cả"). Hiện tối đa 8 thông báo
mới nhất, có nút "Xem thêm thông báo" ở cuối để mở trang `/thong-bao` đầy đủ (vẫn giữ nguyên, dùng
cho lịch sử đầy đủ). `Header` trong `App.tsx` không tự quản lý `unreadCount` nữa — badge số chưa
đọc trên icon chuông giờ nằm gọn trong component này, vẫn đọc từ `NotificationCountProvider` chung
để không lệch số với trang đầy đủ.

## 7. Menu điều hướng theo role

Menu khai báo tập trung tại [`constants/menuConfig.ts`](src/constants/menuConfig.ts)
(`adminMenu`, `tenantMenu` — mỗi mục có `label/path/icon/roles`), không rải điều kiện role
trong component render. Route path giữ nguyên 100% như đã live-test ở mục 5.

**Menu công khai** (Header, mọi lúc): Trang chủ (`/`) · Danh sách phòng (`/rooms`).

**Menu Tenant** (icon trên Header, chỉ hiện khi đăng nhập role `Tenant`): Hợp đồng của tôi ·
Hóa đơn của tôi · Yêu cầu bảo trì · Hồ sơ cá nhân. Icon Thông báo hiện cho **mọi** user đã đăng
nhập, không riêng Tenant.

**Khu vực quản trị** (`/admin/*`, role `Admin`/`Staff`): [`AdminLayout`](src/features/admin/AdminLayout.tsx)
— sidebar trái, lọc mục hiển thị theo role qua `adminMenu`, route con dùng nested `<Route>` +
`<Outlet/>`. Vào thẳng `/admin` tự chuyển tới mục đầu tiên user có quyền xem
(`AdminIndexRedirect`).

| Sidebar Admin | Staff cũng thấy? |
|---|---|
| Quản lý phòng | ✅ |
| Quản lý hợp đồng | ✅ |
| Quản lý hóa đơn | ✅ |
| Quản lý bảo trì | ✅ |
| Quản lý tòa nhà | ❌ chỉ Admin |
| Quản lý người dùng | ❌ chỉ Admin |
| Cấu hình hệ thống | ❌ chỉ Admin (403 với Staff) |
| Dashboard báo cáo | ❌ chỉ Admin (403 với Staff) |
| Nhật ký hoạt động | ❌ chỉ Admin |

## 8. Dọn dẹp — đã xóa hẳn phần shop giày cũ

Xóa toàn bộ 4 trang shop cũ dùng `mockData.ts` (đã có bản thay thế thật 1-1, trừ AdminChat):
- `DashboardPage` (shop, `/admin`) → thay bằng `ReportDashboardPage` (`/admin/report`)
- `ProductManagerPage` (shop, `/admin/products`) → thay bằng `RoomManagerPage` (`/admin/rooms`)
- `OrderManagerPage` (shop, `/admin/orders`) → thay bằng `ContractManagerPage` + `InvoiceManagerPage`
- `AdminChatPage` (shop, `/admin/chat`) → không có bản thay thế, xóa cùng `ChatWidget` (bong bóng
  chat nổi) vì không còn nơi nào để Admin trả lời

Xóa luôn `mockData.ts` (không còn nơi nào dùng). `AdminRoute` (component cũ chỉ dùng cho các
trang này) cũng đã gỡ khỏi `App.tsx`, thay bằng `RoleRoute` chung cho mọi trang.

Build sạch sau khi dọn, bundle giảm từ 846KB → 803KB.

## 9. Hướng dẫn test thủ công

1. Chạy backend (`ShopAPI`, cổng `5141`) và FE (`npm run dev`, cổng `5173`).
2. DB dev có sẵn seed data: tòa nhà "Nhà trọ Demo" (5 phòng, đủ trạng thái Trống/Đã thuê/Đang
   sửa) và các tài khoản mẫu `admin@rental.com`, `staff@rental.com`, `tenant1@rental.com`,
   `tenant2@rental.com` (không có sẵn mật khẩu ở đây — dùng tài khoản test bên dưới nếu cần).
3. **Tài khoản test đã tạo sẵn, dùng được ngay** (email nội bộ `@test.local`):
   - Tenant (đã có hồ sơ khách thuê): `schema.probe2.trohub@test.local` / `Test@12345`
   - Staff: `staff.probe.trohub@test.local` / `Test@12345`
4. Đăng ký tài khoản mới qua `/login` sẽ có role mặc định `User`, chưa dùng được trang nào
   ngoài `/rooms`, `/rooms/:id` — vào `/admin/users` (role Admin) để đổi role.
5. ⚠️ DB dev từng bị reset khi backend đổi migration — nếu tài khoản test ở trên biến mất/login
   báo lỗi, khả năng cao DB vừa bị recreate, cần tạo lại.

## 10. Giới hạn / việc còn để ngỏ

- Chưa có component Toast/Notification dùng chung trong project — các trang mới dùng banner lỗi
  inline (cùng kiểu `LoginPage` đang dùng) thay vì toast như spec ban đầu giả định.
- Tên thương hiệu "TROHUB" là tên tạm (đổi ở [`App.tsx`](src/App.tsx), 1 chỗ).
- Chưa live-test `terminate` hợp đồng qua UI để tránh phá dữ liệu seed/fixture đang dùng chung
  cho nhiều lần test — logic gọi API giống hệt pattern approve/reject đã verify nên rủi ro thấp.
