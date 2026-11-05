USE RentalManagementDB;
GO

SET NOCOUNT ON;

DECLARE @AdminId INT = 3;

-- Tạo các tòa nhà mới với CreatedAt đầy đủ
IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Name LIKE N'%Cầu Giấy%')
BEGIN
    INSERT INTO Buildings (Name, Address, Description, OwnerId, CreatedAt)
    VALUES (N'Tòa nhà TroHub Cầu Giấy', N'Số 18 Ngõ 86 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội', N'Tòa nhà chung cư mini 7 tầng, có thang máy, khóa vân tay, camera an ninh 24/7.', @AdminId, GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Name LIKE N'%Thanh Xuân%')
BEGIN
    INSERT INTO Buildings (Name, Address, Description, OwnerId, CreatedAt)
    VALUES (N'Tòa nhà TroHub Thanh Xuân', N'Số 45 Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội', N'Tòa nhà mới xây 6 tầng, ban công thoáng mát, gần các trường đại học lớn.', @AdminId, GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM Buildings WHERE Name LIKE N'%Ba Đình%')
BEGIN
    INSERT INTO Buildings (Name, Address, Description, OwnerId, CreatedAt)
    VALUES (N'Căn hộ dịch vụ TroHub Ba Đình', N'Số 12 Ngách 34/2 Đội Cấn, Liễu Giai, Ba Đình, Hà Nội', N'Khu căn hộ studio và duplex cao cấp, full nội thất gỗ tự nhiên.', @AdminId, GETUTCDATE());
END

DECLARE @B_CauGiay INT = (SELECT TOP 1 Id FROM Buildings WHERE Name LIKE N'%Cầu Giấy%');
DECLARE @B_ThanhXuan INT = (SELECT TOP 1 Id FROM Buildings WHERE Name LIKE N'%Thanh Xuân%');
DECLARE @B_BaDinh INT = (SELECT TOP 1 Id FROM Buildings WHERE Name LIKE N'%Ba Đình%');

-- Phòng 101 (Tòa Cầu Giấy)
IF NOT EXISTS (SELECT 1 FROM Rooms WHERE BuildingId = @B_CauGiay AND RoomNumber = '101')
BEGIN
    INSERT INTO Rooms (BuildingId, RoomNumber, RoomType, Area, Price, ServiceFee, Status, Amenities, Description, ImageUrl, CreatedAt)
    VALUES (@B_CauGiay, '101', N'Phòng Studio', 30.00, 4500000, 150000, 'Trong',
            N'Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Khóa vân tay (1 bộ), Wifi riêng (1 thiết bị)',
            N'Studio full đồ cao cấp Cầu Giấy, gần các tòa nhà văn phòng Duy Tân.',
            'https://images.unsplash.com/photo-1554995207-c18c20360250?auto=format&fit=crop&w=800&q=80', DATEADD(MINUTE, 38, GETUTCDATE()));
END

-- Phòng 201 (Tòa Cầu Giấy)
IF NOT EXISTS (SELECT 1 FROM Rooms WHERE BuildingId = @B_CauGiay AND RoomNumber = '201')
BEGIN
    INSERT INTO Rooms (BuildingId, RoomNumber, RoomType, Area, Price, ServiceFee, Status, Amenities, Description, ImageUrl, CreatedAt)
    VALUES (@B_CauGiay, '201', N'Phòng 1 ngủ 1 khách', 45.00, 5800000, 180000, 'Trong',
            N'Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)',
            N'Căn 1 ngủ 1 khách riêng biệt, thiết kế hiện đại, đầy đủ tiện nghi xách vali ở ngay.',
            'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80', DATEADD(MINUTE, 40, GETUTCDATE()));
END

-- Phòng 301 (Tòa Thanh Xuân)
IF NOT EXISTS (SELECT 1 FROM Rooms WHERE BuildingId = @B_ThanhXuan AND RoomNumber = '301')
BEGIN
    INSERT INTO Rooms (BuildingId, RoomNumber, RoomType, Area, Price, ServiceFee, Status, Amenities, Description, ImageUrl, CreatedAt)
    VALUES (@B_ThanhXuan, '301', N'Phòng gác xép', 33.00, 4300000, 150000, 'Trong',
            N'Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)',
            N'Gác xép ban công siêu thoáng, trần cao mát mẻ, gần Ngã Tư Sở.',
            'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80', DATEADD(MINUTE, 42, GETUTCDATE()));
END

-- Phòng 401 (Tòa Ba Đình)
IF NOT EXISTS (SELECT 1 FROM Rooms WHERE BuildingId = @B_BaDinh AND RoomNumber = '401')
BEGIN
    INSERT INTO Rooms (BuildingId, RoomNumber, RoomType, Area, Price, ServiceFee, Status, Amenities, Description, ImageUrl, CreatedAt)
    VALUES (@B_BaDinh, '401', N'Phòng Duplex', 50.00, 7000000, 180000, 'Trong',
            N'Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)',
            N'Căn hộ Duplex thông tầng Ba Đình, nội thất Bắc Âu sang trọng, view thành phố tuyệt đẹp.',
            'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80', DATEADD(MINUTE, 44, GETUTCDATE()));
END

-- Phòng 501 (Tòa Ba Đình)
IF NOT EXISTS (SELECT 1 FROM Rooms WHERE BuildingId = @B_BaDinh AND RoomNumber = '501')
BEGIN
    INSERT INTO Rooms (BuildingId, RoomNumber, RoomType, Area, Price, ServiceFee, Status, Amenities, Description, ImageUrl, CreatedAt)
    VALUES (@B_BaDinh, '501', N'Phòng Studio', 35.00, 5000000, 150000, 'Trong',
            N'Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)',
            N'Studio tầng 5 lộng gió, ban công view ngắm trọn Hồ Tây lãng mạn.',
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', DATEADD(MINUTE, 46, GETUTCDATE()));
END
GO

SELECT COUNT(*) AS TongSoPhongHienTai FROM Rooms;
SELECT r.Id, b.Name AS TenToaNha, r.RoomNumber, r.RoomType, r.Price, r.Status
FROM Rooms r
JOIN Buildings b ON r.BuildingId = b.Id
ORDER BY r.Id DESC;
GO
