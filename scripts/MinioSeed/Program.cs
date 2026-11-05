using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Data.SqlClient;
using Minio;
using Minio.DataModel.Args;

namespace MinioSeed
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.OutputEncoding = System.Text.Encoding.UTF8;
            Console.WriteLine("=== BẮT ĐẦU NẠP ẢNH LÊN MINIO & CHUẨN HÓA TOÀN BỘ FONT TIẾNG VIỆT ===");

            string endpoint = "localhost:9000";
            string accessKey = "admin";
            string secretKey = "password123";
            string bucketName = "boarding-house";
            string connectionString = "Server=LAPTOP-CU2R9HHH\\SQLEXPRESS01;Database=RentalManagementDB;User Id=sa;Password=123456;TrustServerCertificate=True;";

            // --- PHẦN 1: MINIO UPLOAD ---
            var minioClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(accessKey, secretKey)
                .Build();

            bool bucketExists = await minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucketName));
            if (!bucketExists)
            {
                await minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucketName));
            }

            string policyJson = $@"{{
                ""Version"": ""2012-10-17"",
                ""Statement"": [
                    {{
                        ""Effect"": ""Allow"",
                        ""Principal"": {{""AWS"": [""*""]}},
                        ""Action"": [""s3:GetObject""],
                        ""Resource"": [""arn:aws:s3:::{bucketName}/*""]
                    }}
                ]
            }}";

            try
            {
                await minioClient.SetPolicyAsync(new SetPolicyArgs().WithBucket(bucketName).WithPolicy(policyJson));
            }
            catch { }

            string sourceDir = @"C:\hoc_reactjs\ShopAPI\ShopAPI\wwwroot\images\rooms";
            var files = Directory.GetFiles(sourceDir, "*.jpg");
            var uploadedUrls = new List<string>();

            foreach (var filePath in files)
            {
                var fileInfo = new FileInfo(filePath);
                if (fileInfo.Length < 100) continue;

                string fileName = Path.GetFileName(filePath);
                string objectName = $"rooms/{fileName}";

                using (var stream = File.OpenRead(filePath))
                {
                    await minioClient.PutObjectAsync(new PutObjectArgs()
                        .WithBucket(bucketName)
                        .WithObject(objectName)
                        .WithStreamData(stream)
                        .WithObjectSize(stream.Length)
                        .WithContentType("image/jpeg"));
                }

                string url = $"http://localhost:9000/{bucketName}/{objectName}";
                uploadedUrls.Add(url);
            }

            Console.WriteLine($"Đã xác thực {uploadedUrls.Count} ảnh sẵn sàng trên MinIO.");

            // --- PHẦN 2: CHUẨN HÓA TIẾNG VIỆT CHUẨN (FIX LỖI FONT TOÀN DIỆN TRONG DATABASE) ---
            using (var conn = new SqlConnection(connectionString))
            {
                await conn.OpenAsync();

                // 1. Sửa tất cả tòa nhà
                var buildingsData = new[]
                {
                    new { Id = 1, Name = "Nhà trọ Demo", Address = "Số 124 Viên Đình, Hùng Vương, Ứng Hòa, Hà Nội", Desc = "Nhà trọ sinh viên tiện nghi, an ninh tốt, gần chợ và bến xe buýt." },
                    new { Id = 3, Name = "Chung cư Yên Xá", Address = "Số 55 Yên Xá, Tân Triều, Thanh Trì, Hà Nội", Desc = "Chung cư mini cao cấp có thang máy, bảo vệ 24/7, ban công thoáng mát." },
                    new { Id = 7, Name = "Tòa nhà TroHub Cầu Giấy", Address = "Số 18 Ngõ 86 Duy Tân, Dịch Vọng Hậu, Cầu Giấy, Hà Nội", Desc = "Tòa nhà chung cư mini 7 tầng, có thang máy, khóa vân tay, camera an ninh 24/7." },
                    new { Id = 8, Name = "Tòa nhà TroHub Thanh Xuân", Address = "Số 45 Ngõ 192 Lê Trọng Tấn, Khương Mai, Thanh Xuân, Hà Nội", Desc = "Tòa nhà mới xây 6 tầng, ban công thoáng mát, gần các trường đại học lớn." },
                    new { Id = 9, Name = "Căn hộ dịch vụ TroHub Ba Đình", Address = "Số 12 Ngách 34/2 Đội Cấn, Liễu Giai, Ba Đình, Hà Nội", Desc = "Khu căn hộ studio và duplex cao cấp, full nội thất gỗ tự nhiên." }
                };

                foreach (var b in buildingsData)
                {
                    using var cmd = new SqlCommand("UPDATE Buildings SET Name = @name, Address = @addr, Description = @desc WHERE Id = @id", conn);
                    cmd.Parameters.AddWithValue("@name", b.Name);
                    cmd.Parameters.AddWithValue("@addr", b.Address);
                    cmd.Parameters.AddWithValue("@desc", b.Desc);
                    cmd.Parameters.AddWithValue("@id", b.Id);
                    await cmd.ExecuteNonQueryAsync();
                    Console.WriteLine($"Đã chuẩn hóa Tòa nhà: [{b.Id}] {b.Name}");
                }

                // 2. Sửa toàn bộ 15 phòng với ảnh MinIO & tiếng Việt chuẩn
                var roomFixes = new Dictionary<int, (string roomType, string desc, string amenities)>
                {
                    [1] = ("Phòng đơn", "Phòng đơn khép kín gọn gàng, ban công thoáng mát, chi phí tiết kiệm.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Bàn ghế làm việc (1 bộ), Wifi riêng (1 thiết bị)"),
                    [2] = ("Phòng Studio", "Phòng Studio khép kín hiện đại, bếp nấu ăn riêng không ám mùi.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Khóa vân tay (1 bộ)"),
                    [3] = ("Phòng gác xép", "Phòng gác xép cao ráo thoáng mát, có ban công đón ánh nắng tự nhiên.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Ban công / Cửa sổ thoáng"),
                    [4] = ("Phòng đơn", "Phòng đơn tầng 2, sạch sẽ, an ninh tốt, đã có khách thuê ổn định.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Giường nệm (1 bộ), Tủ quần áo (1 chiếc)"),
                    [5] = ("Phòng đơn", "Phòng tầng 3 yên tĩnh, cửa sổ trời thông thoáng mát mẻ quanh năm.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Bàn ghế làm việc (1 bộ)"),
                    [7] = ("Phòng 1 ngủ 1 khách", "Căn hộ 1 phòng ngủ 1 phòng khách riêng biệt, đầy đủ nội thất cao cấp.",
                           "Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Khóa vân tay (1 bộ)"),
                    [8] = ("Phòng Studio", "Phòng Studio tầng 1 sạch đẹp, không cần leo thang, thuận tiện di chuyển.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Khóa vân tay (1 bộ)"),
                    [9] = ("Phòng gác xép", "Gác xép cao ráo thông thoáng, ban công phơi đồ ngập nắng.",
                           "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Ban công / Cửa sổ thoáng"),
                    [10] = ("Phòng gác xép", "Căn hộ mini gác lửng Yên Xá, mới tinh 100%, có thang máy và bảo vệ 24/24.",
                            "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Ban công / Cửa sổ thoáng"),
                    [11] = ("Phòng 2 ngủ 1 khách", "Căn 2 phòng ngủ 1 phòng khách cao cấp, thích hợp gia đình hoặc nhóm bạn ở 3-4 người.",
                            "Điều hòa (3 chiếc), Bình nóng lạnh (2 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (2 bộ), Tủ quần áo (2 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (2 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)"),
                    [17] = ("Phòng Studio", "Studio full đồ cao cấp Cầu Giấy, gần các tòa nhà văn phòng Duy Tân.",
                            "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Khóa vân tay (1 bộ), Wifi riêng (1 thiết bị)"),
                    [18] = ("Phòng 1 ngủ 1 khách", "Căn 1 ngủ 1 khách riêng biệt, thiết kế hiện đại, đầy đủ tiện nghi xách vali ở ngay.",
                            "Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)"),
                    [19] = ("Phòng gác xép", "Gác xép ban công siêu thoáng, trần cao mát mẻ, gần Ngã Tư Sở.",
                            "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)"),
                    [20] = ("Phòng Duplex", "Căn hộ Duplex thông tầng Ba Đình, nội thất Bắc Âu sang trọng, view thành phố tuyệt đẹp.",
                            "Điều hòa (2 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Máy giặt (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Bàn ghế làm việc (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)"),
                    [21] = ("Phòng Studio", "Studio tầng 5 lộng gió, ban công view ngắm trọn Hồ Tây lãng mạn.",
                            "Điều hòa (1 chiếc), Bình nóng lạnh (1 bình), Tủ lạnh (1 chiếc), Giường nệm (1 bộ), Tủ quần áo (1 chiếc), Kệ bếp / Bếp từ (1 bộ), Sofa (1 bộ), Ban công / Cửa sổ thoáng, Khóa vân tay (1 bộ)")
                };

                int imgIdx = 0;
                foreach (var kvp in roomFixes)
                {
                    int rId = kvp.Key;
                    var (rType, desc, amenities) = kvp.Value;
                    string minioUrl = uploadedUrls[imgIdx % uploadedUrls.Count];
                    imgIdx++;

                    using var cmd = new SqlCommand(@"
                        UPDATE Rooms 
                        SET RoomType = @type, Description = @desc, Amenities = @amenities, ImageUrl = @url 
                        WHERE Id = @id", conn);

                    cmd.Parameters.AddWithValue("@type", rType);
                    cmd.Parameters.AddWithValue("@desc", desc);
                    cmd.Parameters.AddWithValue("@amenities", amenities);
                    cmd.Parameters.AddWithValue("@url", minioUrl);
                    cmd.Parameters.AddWithValue("@id", rId);
                    await cmd.ExecuteNonQueryAsync();

                    // Cập nhật RoomMedias
                    using var delMedia = new SqlCommand("DELETE FROM RoomMedias WHERE RoomId = @id", conn);
                    delMedia.Parameters.AddWithValue("@id", rId);
                    await delMedia.ExecuteNonQueryAsync();

                    using var insMedia1 = new SqlCommand("INSERT INTO RoomMedias (RoomId, Url, Type, SortOrder, CreatedAt) VALUES (@id, @url, 'Image', 0, GETUTCDATE())", conn);
                    insMedia1.Parameters.AddWithValue("@id", rId);
                    insMedia1.Parameters.AddWithValue("@url", minioUrl);
                    await insMedia1.ExecuteNonQueryAsync();

                    string extraUrl = uploadedUrls[imgIdx % uploadedUrls.Count];
                    using var insMedia2 = new SqlCommand("INSERT INTO RoomMedias (RoomId, Url, Type, SortOrder, CreatedAt) VALUES (@id, @url, 'Image', 1, GETUTCDATE())", conn);
                    insMedia2.Parameters.AddWithValue("@id", rId);
                    insMedia2.Parameters.AddWithValue("@url", extraUrl);
                    await insMedia2.ExecuteNonQueryAsync();

                    Console.WriteLine($"Đã chuẩn hóa Phòng ID [{rId}]: {rType} | Ảnh MinIO: {minioUrl}");
                }
            }

            Console.WriteLine("=== HOÀN TẤT 100%: TẤT CẢ ẢNH ĐÃ LƯU TRÊN MINIO VÀ CHUẨN HÓA TIẾNG VIỆT ===");
        }
    }
}
