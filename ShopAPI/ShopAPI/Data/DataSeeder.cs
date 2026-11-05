using Microsoft.EntityFrameworkCore;
using ShopAPI.Models;

namespace ShopAPI.Data
{
    public static class DataSeeder
    {
        public static int SeedSampleData(AppDbContext context)
        {
            // 1. Đảm bảo có ít nhất 1 tài khoản Admin/Chủ sở hữu cho tòa nhà
            var defaultAdmin = context.Users.FirstOrDefault(u => u.Role == "Admin") ?? context.Users.FirstOrDefault();
            if (defaultAdmin == null)
            {
                defaultAdmin = new User
                {
                    FullName = "Ban Quản lý TroHub",
                    Email = "admin@trohub.vn",
                    Password = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                    Role = "Admin",
                    PhoneNumber = "0988.123.456",
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(defaultAdmin);
                context.SaveChanges();
            }

            // 2. Tạo các tòa nhà mẫu (nếu chưa có)
            var buildingCauGiay = context.Buildings.FirstOrDefault(b => b.Name.Contains("Cầu Giấy"));
            if (buildingCauGiay == null)
            {
                buildingCauGiay = new Building
                {
                    Name = "Tòa nhà TroHub Cầu Giấy",
                    Address = "Số 18 Ngõ 86 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
                    Description = "Tòa nhà chung cư mini 7 tầng, có thang máy, khóa vân tay, hầm để xe máy rộng rãi, camera an ninh 24/7.",
                    OwnerId = defaultAdmin.Id,
                    CreatedAt = DateTime.UtcNow
                };
                context.Buildings.Add(buildingCauGiay);
                context.SaveChanges();
            }

            var buildingThanhXuan = context.Buildings.FirstOrDefault(b => b.Name.Contains("Thanh Xuân"));
            if (buildingThanhXuan == null)
            {
                buildingThanhXuan = new Building
                {
                    Name = "Tòa nhà TroHub Thanh Xuân",
                    Address = "Số 45 Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội",
                    Description = "Tòa nhà mới xây 6 tầng, ban công thoáng mát, gần các trường đại học lớn và trạm xe buýt nhanh BRT.",
                    OwnerId = defaultAdmin.Id,
                    CreatedAt = DateTime.UtcNow
                };
                context.Buildings.Add(buildingThanhXuan);
                context.SaveChanges();
            }

            var buildingBaDinh = context.Buildings.FirstOrDefault(b => b.Name.Contains("Ba Đình"));
            if (buildingBaDinh == null)
            {
                buildingBaDinh = new Building
                {
                    Name = "Căn hộ dịch vụ TroHub Ba Đình",
                    Address = "Số 12 Ngách 34/2 Đội Cấn, Liễu Giai, Ba Đình, Hà Nội",
                    Description = "Khu căn hộ studio và duplex cao cấp, full nội thất gỗ tự nhiên, cửa sổ lớn đón ánh sáng tự nhiên.",
                    OwnerId = defaultAdmin.Id,
                    CreatedAt = DateTime.UtcNow
                };
                context.Buildings.Add(buildingBaDinh);
                context.SaveChanges();
            }

            // Danh sách ảnh mẫu MinIO
            var minioImages = new[]
            {
                "http://localhost:9000/boarding-house/rooms/0e962cff-0999-4a57-8bbe-e71159a786aa.jpg",
                "http://localhost:9000/boarding-house/rooms/41876e3b-6869-4706-ba5f-e6145cbf467d.jpg",
                "http://localhost:9000/boarding-house/rooms/51e571a2-3f65-4176-8806-c3a57c9de8d9.jpg",
                "http://localhost:9000/boarding-house/rooms/6dbc9686-9dbe-4d2f-9d87-c62d5e956608.jpg",
                "http://localhost:9000/boarding-house/rooms/ab96fb23-9b74-4b1f-8471-bc580dbd2c2a.jpg",
                "http://localhost:9000/boarding-house/rooms/acb0e70a-6224-4016-a202-ed5a64254510.jpg",
                "http://localhost:9000/boarding-house/rooms/e117c528-49b5-4422-9c38-5b4b79dea456.jpg",
                "http://localhost:9000/boarding-house/rooms/e38832bf-5153-47c9-8d98-977d0081d5a9.jpg",
                "http://localhost:9000/boarding-house/rooms/e7eac9d1-32a1-4deb-be75-33362a4435a4.jpg",
                "http://localhost:9000/boarding-house/rooms/faa75ab8-bf5c-4305-9c66-b6258b3d1a99.jpg"
            };

            // 3. Danh sách phòng mẫu phong phú
            var sampleRooms = new[]
            {
                new
                {
                    BuildingId = buildingCauGiay.Id,
                    RoomNumber = "101",
                    RoomType = "Phòng Studio",
                    Area = 30m,
                    Price = 4500000m,
                    ServiceFee = 150000m,
                    Amenities = "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Khóa vân tay (1 bộ), Wifi riêng (1 thiết bị)",
                    Description = "Studio full đồ cao cấp Cầu Giấy, gần các tòa nhà văn phòng Duy Tân.",
                    ImageUrl = minioImages[0],
                    ExtraMedia = new[] { minioImages[1], minioImages[2] }
                },
                new
                {
                    BuildingId = buildingCauGiay.Id,
                    RoomNumber = "201",
                    RoomType = "Phòng 1 ngủ 1 khách",
                    Area = 45m,
                    Price = 5800000m,
                    ServiceFee = 180000m,
                    Amenities = "Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)",
                    Description = "Căn 1 ngủ 1 khách riêng biệt, thiết kế hiện đại, đầy đủ tiện nghi xách vali ở ngay.",
                    ImageUrl = minioImages[1],
                    ExtraMedia = new[] { minioImages[3] }
                },
                new
                {
                    BuildingId = buildingThanhXuan.Id,
                    RoomNumber = "301",
                    RoomType = "Phòng gác xép",
                    Area = 33m,
                    Price = 4300000m,
                    ServiceFee = 150000m,
                    Amenities = "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)",
                    Description = "Gác xép ban công siêu thoáng, trần cao mát mẻ, gần Ngã Tư Sở.",
                    ImageUrl = minioImages[2],
                    ExtraMedia = new[] { minioImages[4] }
                },
                new
                {
                    BuildingId = buildingBaDinh.Id,
                    RoomNumber = "401",
                    RoomType = "Phòng Duplex",
                    Area = 50m,
                    Price = 7000000m,
                    ServiceFee = 180000m,
                    Amenities = "Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)",
                    Description = "Căn hộ Duplex thông tầng Ba Đình, nội thất Bắc Âu sang trọng, view thành phố tuyệt đẹp.",
                    ImageUrl = minioImages[3],
                    ExtraMedia = new[] { minioImages[5] }
                },
                new
                {
                    BuildingId = buildingBaDinh.Id,
                    RoomNumber = "501",
                    RoomType = "Phòng Studio",
                    Area = 35m,
                    Price = 5000000m,
                    ServiceFee = 150000m,
                    Amenities = "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)",
                    Description = "Studio tầng 5 lộng gió, ban công view ngắm trọn Hồ Tây lãng mạn.",
                    ImageUrl = minioImages[4],
                    ExtraMedia = new[] { minioImages[6] }
                }
            };

            int addedCount = 0;
            var now = DateTime.UtcNow;

            foreach (var r in sampleRooms)
            {
                var existingRoom = context.Rooms.FirstOrDefault(x => x.BuildingId == r.BuildingId && x.RoomNumber == r.RoomNumber);
                if (existingRoom == null)
                {
                    var newRoom = new Room
                    {
                        BuildingId = r.BuildingId,
                        RoomNumber = r.RoomNumber,
                        RoomType = r.RoomType,
                        Area = r.Area,
                        Price = r.Price,
                        ServiceFee = r.ServiceFee,
                        Status = RoomStatus.Trong,
                        Amenities = r.Amenities,
                        Description = r.Description,
                        ImageUrl = r.ImageUrl,
                        CreatedAt = now.AddMinutes(addedCount * 2)
                    };
                    context.Rooms.Add(newRoom);
                    context.SaveChanges();

                    int sortOrder = 0;
                    context.RoomMedias.Add(new RoomMedia
                    {
                        RoomId = newRoom.Id,
                        Url = r.ImageUrl,
                        Type = "Image",
                        SortOrder = sortOrder++,
                        CreatedAt = DateTime.UtcNow
                    });

                    foreach (var extra in r.ExtraMedia)
                    {
                        context.RoomMedias.Add(new RoomMedia
                        {
                            RoomId = newRoom.Id,
                            Url = extra,
                            Type = "Image",
                            SortOrder = sortOrder++,
                            CreatedAt = DateTime.UtcNow
                        });
                    }

                    context.SaveChanges();
                    addedCount++;
                }
                else
                {
                    existingRoom.RoomType = r.RoomType;
                    existingRoom.Amenities = r.Amenities;
                    existingRoom.Description = r.Description;
                    existingRoom.ImageUrl = r.ImageUrl;
                    context.SaveChanges();
                }
            }

            return addedCount;
        }
    }
}
