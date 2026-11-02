# TÀI LIỆU CÁC LUỒNG HOẠT ĐỘNG HỆ THỐNG QUẢN LÝ NHÀ TRỌ & CHUNG CƯ MINI (TROHUB)

> **Phiên bản:** 2.0  
> **Kiến trúc:** Frontend (React + TypeScript + Tailwind CSS) · Backend (ASP.NET Core Web API + EF Core + SQL Server) · Xác thực (JWT Bearer)

---

## MỤC LỤC
1. [Tổng quan hệ thống & Ma trận phân quyền (RBAC)](#1-tổng-quan-hệ-thống--ma-trận-phân-quyền-rbac)
2. [Vòng đời các thực thể chính (State Machine)](#2-vòng-đời-các-thực-thể-chính-state-machine)
3. [Luồng 1: Xác thực & Đăng nhập (Auth Flow)](#3-luồng-1-xác-thực--đăng-nhập-auth-flow)
4. [Luồng 2: Tìm kiếm & Đăng ký thuê phòng (Room Discovery & Rental Request)](#4-luồng-2-tìm-kiếm--đăng-ký-thuê-phòng-room-discovery--rental-request)
5. [Luồng 3: Duyệt hợp đồng & Đặt cọc giữ phòng (Contract Approval & Deposit)](#5-luồng-3-duyệt-hợp-đồng--đặt-cọc-giữ-phòng-contract-approval--deposit)
6. [Luồng 4: Kích hoạt hợp đồng & Nhận phòng (Contract Activation & Check-in)](#6-luồng-4-kích-hoạt-hợp-đồng--nhận-phòng-contract-activation--check-in)
7. [Luồng 5: Tính tiền & Thu hóa đơn hàng tháng (Monthly Billing & Meter Reading)](#7-luồng-5-tính-tiền--thu-hóa-đơn-hàng-tháng-monthly-billing--meter-reading)
8. [Luồng 6: Yêu cầu bảo trì & Xử lý sự cố (Maintenance Workflow)](#8-luồng-6-yêu-cầu-bảo-trì--xử-lý-sự-cố-maintenance-workflow)
9. [Luồng 7: Kết thúc hợp đồng & Trả phòng (Check-out & Contract Termination)](#9-luồng-7-kết-thúc-hợp-đồng--trả-phòng-check-out--contract-termination)
10. [Luồng 8: Quản trị cấu hình & Báo cáo thống kê (Admin & Dashboard)](#10-luồng-8-quản-trị-cấu-hình--báo-cáo-thống-kê-admin--dashboard)

---

## 1. TỔNG QUAN HỆ THỐNG & MA TRẬN PHÂN QUYỀN (RBAC)

Hệ thống phục vụ 3 nhóm đối tượng người dùng chính cùng khách vãng lai:

| Vai trò (Role) | Ký hiệu | Trách nhiệm chính |
|---|---|---|
| **Khách vãng lai (Guest)** | `Guest` | Xem danh sách phòng trống, tra cứu đơn giá tham khảo, liên hệ chủ trọ, đăng ký tài khoản. |
| **Khách thuê (Tenant)** | `Tenant` | Đăng ký thuê phòng, ký hợp đồng số, thanh toán cọc/hóa đơn hàng tháng qua VietQR, báo hỏng thiết bị, khai báo người ở cùng. |
| **Nhân viên (Staff)** | `Staff` | Ghi chỉ số công tơ điện nước, lập hóa đơn, xác nhận thanh toán tiền mặt/chuyển khoản, tiếp nhận và xử lý bảo trì. |
| **Chủ trọ / Quản trị (Admin)**| `Admin` | Toàn quyền hệ thống: duyệt hợp đồng, quản lý tòa nhà/phòng, phân quyền người dùng, cấu hình VietQR, xem báo cáo doanh thu. |

### Ma trận quyền hạn chi tiết

```
+------------------------------------+-------+--------+-------+-------+
| Tính năng                          | Guest | Tenant | Staff | Admin |
+------------------------------------+-------+--------+-------+-------+
| Xem phòng trống & chi tiết giá     |   V   |   V    |   V   |   V   |
| Đăng ký tài khoản khách thuê       |   V   |   -    |   -   |   -   |
| Tạo yêu cầu thuê phòng & ký số     |   -   |   V    |   -   |   -   |
| Khai báo người ở cùng              |   -   |   V    |   V   |   V   |
| Thanh toán VietQR & xem hóa đơn    |   -   |   V    |   V   |   V   |
| Gửi yêu cầu bảo trì                |   -   |   V    |   -   |   -   |
| Duyệt / từ chối hợp đồng           |   -   |   -    |   V   |   V   |
| Lập hóa đơn đơn lẻ & hàng loạt     |   -   |   -    |   V   |   V   |
| Xác nhận thanh toán tiền mặt/QR    |   -   |   -    |   V   |   V   |
| Phân công & cập nhật bảo trì       |   -   |   -    |   V   |   V   |
| Quản lý Tòa nhà & Phòng            |   -   |   -    |   -   |   V   |
| Phân quyền User (Staff/Tenant)     |   -   |   -    |   -   |   V   |
| Cấu hình VietQR & Đơn giá chung   |   -   |   -    |   -   |   V   |
| Xem Báo cáo Dashboard & Audit Log  |   -   |   -    |   -   |   V   |
+------------------------------------+-------+--------+-------+-------+
```

---

## 2. VÒNG ĐỜI CÁC THỰC THỂ CHÍNH (STATE MACHINE)

### 2.1. Vòng đời Hợp đồng (Contract)
```mermaid
stateDiagram-v2
    [*] --> ChoDuyet: Khách gửi yêu cầu thuê & ký số
    ChoDuyet --> TuChoi: Admin từ chối yêu cầu
    ChoDuyet --> ChoCoc: Admin duyệt, chốt giá điện/nước, sinh hóa đơn cọc
    ChoCoc --> DangHieuLuc: Xác nhận thanh toán cọc thành công
    DangHieuLuc --> DaKetThuc: Hết thời hạn / Trả phòng & thanh lý
    TuChoi --> [*]
    DaKetThuc --> [*]
```

### 2.2. Vòng đời Hóa đơn (Invoice)
```mermaid
stateDiagram-v2
    [*] --> ChuaThanhToan: Tạo hóa đơn cọc / Tạo hóa đơn tháng
    ChuaThanhToan --> QuaHan: Quá ngày hạn nộp chưa thanh toán
    ChuaThanhToan --> DaThanhToan: Quét QR thành công / Thu tiền mặt
    QuaHan --> DaThanhToan: Thu tiền muộn & xác nhận
    DaThanhToan --> [*]
```

### 2.3. Vòng đời Phòng (Room)
```mermaid
stateDiagram-v2
    [*] --> Trong: Khởi tạo phòng mới / Thanh lý hợp đồng xong
    Trong --> DaThue: Hợp đồng cọc được thanh toán (DangHieuLuc)
    DaThue --> Trong: Khách chuyển đi & nghiệm thu
    Trong --> DangSua: Bảo dưỡng, sơn sửa định kỳ
    DangSua --> Trong: Hoàn thành sửa chữa
```

### 2.4. Vòng đời Yêu cầu bảo trì (Maintenance Request)
```mermaid
stateDiagram-v2
    [*] --> Moi: Khách gửi phản ánh sự cố
    Moi --> DaPhanCong: Quản lý gán nhân viên phụ trách
    DaPhanCong --> DangXuLy: Nhân viên tới kiểm tra / sửa chữa
    DangXuLy --> HoanThanh: Sửa chữa thành công & nghiệm thu
    Moi --> DaHuy: Yêu cầu sai / khách tự xử lý
    DaPhanCong --> DaHuy: Hủy yêu cầu
    HoanThanh --> [*]
    DaHuy --> [*]
```

---

## 3. LUỒNG 1: XÁC THỰC & ĐĂNG NHẬP (AUTH FLOW)

### Mục đích:
Xác thực danh tính người dùng qua JWT token, phân quyền truy cập và điều hướng đúng giao diện theo vai trò.

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant Web as Web Frontend (React)
    participant API as Backend (ShopAPI)
    participant DB as SQL Server

    User->>Web: Nhập Email & Mật khẩu
    Web->>API: POST /api/auth/login
    API->>DB: Truy vấn User theo Email & kiểm tra Hash BCrypt
    alt Đăng nhập thành công
        API-->>Web: Trả về Token (JWT), RefreshToken, Role, UserInfo
        Web->>Web: Lưu Token vào LocalStorage & cập nhật AuthContext
        alt Role == Admin | Staff
            Web->>User: Điều hướng tới /admin (Trang quản trị)
        else Role == Tenant
            Web->>User: Điều hướng tới / (Trang chủ khách thuê)
        end
    else Sai thông tin
        API-->>Web: HTTP 400 { message: "Email hoặc mật khẩu không chính xác" }
        Web->>User: Hiển thị thông báo lỗi trên form
    end
```

---

## 4. LUỒNG 2: TÌM KIẾM & ĐĂNG KÝ THUÊ PHÒNG

### Mục đích:
Khách hàng khám phá các phòng trống, xem thông số minh bạch (giá phòng, dự tính điện nước), điền thông tin và ký chữ ký số online.

```mermaid
flowchart TD
    A[Khách truy cập Trang chủ / Danh sách phòng] --> B[Lọc theo Tòa nhà, Mức giá, Loại phòng]
    B --> C[Xem chi tiết phòng: Ảnh, Diện tích, Tiện ích, Giá tham khảo]
    C --> D{Khách đã đăng nhập?}
    D -- Chưa --> E[Chuyển hướng Đăng nhập / Đăng ký tài khoản Tenant]
    E --> F[Vào trang Điền form Đăng ký thuê phòng]
    D -- Đã đăng nhập --> F
    F --> G[Nhập thời hạn thuê, số người ở, CCCD, SĐT khẩn cấp]
    G --> H[Khách ký tên trực tiếp trên Digital Signature Pad]
    H --> I[Xem bản nháp hợp đồng tích hợp chữ ký số]
    I --> J[Gửi yêu cầu thuê phòng]
    J --> K[API tạo Hợp đồng trạng thái ChoDuyet]
    K --> L[Gửi Notification tới Admin/Staff]
    L --> M[Hiển thị màn hình chờ duyệt & link theo dõi tại Hợp đồng của tôi]
```

---

## 5. LUỒNG 3: DUYỆT HỢP ĐỒNG & ĐẶT CỌC GIỮ PHÒNG

### Mục đích:
Admin/Staff kiểm tra tính hợp lệ của người thuê, chốt đơn giá điện nước chính thức vào điều khoản hợp đồng và sinh hóa đơn cọc.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    actor Tenant as Khách thuê
    participant System as Web App & ShopAPI

    System->>Admin: Thông báo: Có hợp đồng mới chờ duyệt (#ID)
    Admin->>System: Mở Quản lý hợp đồng (/admin/contracts)
    Admin->>System: Xem trước điều khoản & chữ ký khách thuê (Xem file Word/PDF)
    alt Từ chối hợp đồng
        Admin->>System: PUT /api/contract/{id}/reject (Nhập lý do)
        System->>Tenant: Thông báo: Hợp đồng bị từ chối kèm lý do
    else Đồng ý duyệt
        Admin->>System: PUT /api/contract/{id}/approve (Chốt Đơn giá Điện & Nước)
        System->>System: Cập nhật Contract: Status = ChoCoc
        System->>System: Tự động tạo Invoice: Type = Coc, Số tiền = Tiền cọc hợp đồng
        System->>Tenant: Gửi thông báo: Hợp đồng đã duyệt, vui lòng nộp cọc giữ phòng
    end
```

---

## 6. LUỒNG 4: KÍCH HOẠT HỢP ĐỒNG & NHẬN PHÒNG

### Mục đích:
Khách hoàn tất nghĩa vụ tiền cọc để kích hoạt hợp đồng hiệu lực và chính thức chuyển trạng thái phòng thành Đã Thuê.

```mermaid
flowchart TD
    A[Khách thuê vào 'Hóa đơn của tôi' / 'Hợp đồng của tôi'] --> B[Mở Hóa đơn cọc trạng thái ChưaThanhToan]
    B --> C{Chọn cách thanh toán}
    C -- Quét VietQR -- D[Hệ thống tạo mã VietQR động theo tài khoản ngân hàng chủ trọ]
    D --> E[Khách quét QR trên Mobile Banking và chuyển khoản đúng nội dung]
    E --> F[Khách gửi xác nhận chuyển khoản trên hệ thống]
    C -- Nộp Tiền mặt -- G[Khách gặp trực tiếp Admin/Staff tại văn phòng]
    F --> H[Admin/Staff kiểm tra tiền về tài khoản hoặc nhận tiền mặt]
    G --> H
    H --> I[Admin bấm Xác nhận thanh toán hóa đơn cọc]
    I --> J[Hóa đơn cọc: DaThanhToan]
    J --> K[Hợp đồng: Chuyển sang DangHieuLuc]
    K --> L[Phòng: Tự động chuyển từ Trong sang DaThue]
    L --> M[Khách thuê nhận phòng & có thể Khai báo danh sách người ở cùng]
```

---

## 7. LUỒNG 5: TÍNH TIỀN & THU HÓA ĐƠN HÀNG THÁNG

### Mục đích:
Tính toán tiền phòng, tiền điện, tiền nước định kỳ theo chỉ số công tơ thực tế và gửi thông báo thu tiền tự động.

### Công thức tính toán hệ thống:
$$\text{Tiền điện} = (\text{Chỉ số điện mới} - \text{Chỉ số điện cũ}) \times \text{Đơn giá điện hợp đồng}$$
$$\text{Tiền nước} = (\text{Chỉ số nước mới} - \text{Chỉ số nước cũ}) \times \text{Đơn giá nước hợp đồng}$$
$$\text{Tổng hóa đơn} = \text{Tiền phòng} + \text{Tiền điện} + \text{Tiền nước} + \text{Phí dịch vụ khác}$$

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên (Staff)
    actor Tenant as Khách thuê
    participant System as Web App & ShopAPI

    Staff->>System: Đi chốt chỉ số công tơ cuối kỳ
    Staff->>System: Vào 'Tạo hóa đơn' hoặc 'Tạo hàng loạt theo tòa nhà'
    Staff->>System: Nhập Số điện mới & Số nước mới (Số cũ hệ thống tự điền)
    System->>System: Tự nhân với Đơn giá điện/nước đã chốt trong Hợp đồng
    Staff->>System: Bấm Tạo hóa đơn kỳ tháng MM/YYYY
    System->>System: Lưu Invoice: Type = HangThang, Status = ChuaThanhToan
    System->>Tenant: Gửi Notification: Đã có hóa đơn tiền phòng kỳ này
    Tenant->>System: Khách mở xem chi tiết số điện/nước cũ -> mới & quét VietQR
    Tenant->>System: Chuyển khoản thành công
    Staff->>System: Kiểm tra & bấm Xác nhận thanh toán
    System->>System: Invoice chuyển trạng thái: DaThanhToan
    System->>Tenant: Thông báo: Hóa đơn kỳ MM/YYYY đã thanh toán thành công
```

### Xử lý quá hạn & nhắc nợ:
- Hóa đơn quá hạn nộp sẽ tự chuyển / đánh dấu `QuaHan`.
- Admin/Staff có thể bấm nút **Nhắc nợ quá hạn** hoặc **Nhắc sắp đến hạn** trên thanh công cụ để hệ thống tự động bắn Notification hàng loạt tới các phòng chưa đóng tiền.

---

## 8. LUỒNG 6: YÊU CẦU BẢO TRÌ & XỬ LÝ SỰ CỐ

### Mục đích:
Tiếp nhận và giải quyết nhanh chóng các phản ánh hư hỏng thiết bị (điều hòa, bình nóng lạnh, bóng đèn, khóa cửa,...) của khách thuê.

```mermaid
flowchart LR
    subgraph Khách_Thuê
        A[Phát hiện sự cố thiết bị] --> B[Gửi Yêu cầu bảo trì: Tiêu đề, Mô tả, Mức độ ưu tiên]
    end

    subgraph Ban_Quản_Lý
        B --> C[Admin/Staff nhận thông báo yêu cầu mới]
        C --> D[Phân công nhân viên kỹ thuật phụ trách]
        D --> E[Kỹ thuật viên liên hệ khách & đến kiểm tra sửa chữa]
        E --> F{Kết quả sửa chữa}
        F -- Hoàn tất -- G[Cập nhật trạng thái: Hoàn thành + Ghi chú]
        F -- Yêu cầu hủy/sai -- H[Cập nhật trạng thái: Đã hủy]
    end

    subgraph Nghiệm_Thu
        G --> I[Hệ thống gửi thông báo kết quả tới Khách thuê]
        H --> I
    end
```

---

## 9. LUỒNG 7: KẾT THÚC HỢP ĐỒNG & TRẢ PHÒNG

### Mục đích:
Thanh lý hợp đồng an toàn, nghiệm thu bàn giao tài sản phòng, quyết toán tiền cọc và đưa phòng trở lại trạng thái sẵn sàng cho thuê mới.

```mermaid
sequenceDiagram
    autonumber
    actor Tenant as Khách thuê
    actor Staff as Quản lý / Staff
    participant System as Hệ thống

    Tenant->>Staff: Báo trả phòng khi hết hạn hoặc trước hạn
    Staff->>Tenant: Đến kiểm tra hiện trạng phòng & chốt chỉ số công tơ cuối
    Staff->>System: Lập hóa đơn quyết toán tiền điện/nước kỳ cuối
    Tenant->>Staff: Thanh toán các khoản nợ còn tồn (nếu có)
    Staff->>Tenant: Quyết toán hoàn trả tiền cọc (trừ chi phí hư hao nếu có)
    Staff->>System: PUT /api/contract/{id}/terminate (Kết thúc hợp đồng)
    System->>System: Contract: Status = DaKetThuc
    System->>System: Room: Chuyển từ DaThue về Trong
    System->>Tenant: Gửi thông báo thanh lý hợp đồng hoàn tất
    System->>System: Phòng xuất hiện lại trên Danh sách phòng trống để đón khách mới
```

---

## 10. LUỒNG 8: QUẢN TRỊ CẤU HÌNH & BÁO CÁO THỐNG KÊ

### Mục đích:
Hỗ trợ chủ trọ quản lý doanh thu minh bạch, theo dõi lịch sử biến động và thiết lập các thông số tự động của toàn hệ thống.

```mermaid
flowchart TD
    subgraph Cấu_Hình_Hệ_Thống
        CF1[Thiết lập Tài khoản Ngân hàng: Tên ngân hàng, Số TK, Tên chủ TK] --> CF2[Mã VietQR tự động sinh khớp số tiền & nội dung phòng]
        CF3[Cấu hình Đơn giá Điện/Nước công khai tham khảo] --> CF4[Hiển thị ngoài trang chủ cho khách xem trước khi thuê]
    end

    subgraph Báo_Cáo_Dashboard
        R1[Biểu đồ doanh thu thực tế theo tháng & năm]
        R2[Tỷ lệ lấp đầy phòng: Đang thuê / Còn trống / Đang sửa]
        R3[Tổng công nợ chưa thu & danh sách phòng nợ tiền]
        R4[Nhật ký hoạt động Audit Log: Lưu vết toàn bộ hành động thêm/sửa/xóa của Admin/Staff]
    end
```

---

## TỔNG KẾT BẢNG MÃ LỖI & QUY TẮC NGHIỆP VỤ ĐẶC THÙ

1. **Ràng buộc một phòng - một hợp đồng hiệu lực:**  
   Một phòng đang ở trạng thái `DaThue` hoặc có hợp đồng `DangHieuLuc` thì không thể tạo thêm hợp đồng hiệu lực mới.
2. **Bảo toàn lịch sử chỉ số công tơ:**  
   Hóa đơn tháng mới bắt buộc có `Số công tơ cũ` $\ge$ `Số công tơ mới của hóa đơn liền trước`.
3. **Chữ ký số pháp lý:**  
   Khách thuê ký trực tiếp trên pad cảm ứng lúc gửi yêu cầu thuê; chữ ký được nhúng vĩnh viễn vào file mẫu Word/PDF hợp đồng.
4. **Cơ chế Theme thông minh:**  
   Hệ thống hỗ trợ cả Light Mode và Dark Mode trên 100% các màn hình quản trị và khách thuê, tự động nhận diện tương phản màu chữ và thanh cuộn bảng dữ liệu chuẩn UX.

