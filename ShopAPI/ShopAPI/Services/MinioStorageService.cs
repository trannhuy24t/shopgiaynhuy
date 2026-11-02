using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;
using ShopAPI.Interfaces;

namespace ShopAPI.Services
{
    public class MinioStorageService : IStorageService
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;
        private readonly string _endpoint;
        private readonly bool _withSsl;
        private readonly ILogger<MinioStorageService> _logger;
        private bool _bucketInitialized = false;
        private readonly SemaphoreSlim _initLock = new(1, 1);

        public MinioStorageService(IConfiguration configuration, ILogger<MinioStorageService> logger)
        {
            _logger = logger;
            _endpoint = configuration["Minio:Endpoint"] ?? "localhost:9000";
            var accessKey = configuration["Minio:AccessKey"] ?? "admin";
            var secretKey = configuration["Minio:SecretKey"] ?? "password123";
            _bucketName = configuration["Minio:BucketName"] ?? "boarding-house";
            _withSsl = bool.TryParse(configuration["Minio:WithSSL"], out var ssl) && ssl;

            var clientBuilder = new MinioClient()
                .WithEndpoint(_endpoint)
                .WithCredentials(accessKey, secretKey);

            if (_withSsl)
            {
                clientBuilder = clientBuilder.WithSSL();
            }

            _minioClient = clientBuilder.Build();
        }

        private async Task EnsureBucketExistsAsync()
        {
            if (_bucketInitialized) return;

            await _initLock.WaitAsync();
            try
            {
                if (_bucketInitialized) return;

                var existsArgs = new BucketExistsArgs().WithBucket(_bucketName);
                bool found = await _minioClient.BucketExistsAsync(existsArgs);
                if (!found)
                {
                    _logger.LogInformation("Bucket '{BucketName}' chưa tồn tại. Đang tạo mới trên MinIO...", _bucketName);
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucketName));

                    // Cấu hình chính sách cho phép đọc ảnh/video công khai qua đường dẫn HTTP
                    string policyJson = $@"{{
                        ""Version"": ""2012-10-17"",
                        ""Statement"": [
                            {{
                                ""Effect"": ""Allow"",
                                ""Principal"": {{""AWS"": [""*""]}},
                                ""Action"": [""s3:GetObject""],
                                ""Resource"": [""arn:aws:s3:::{_bucketName}/*""]
                            }}
                        ]
                    }}";

                    try
                    {
                        await _minioClient.SetPolicyAsync(new SetPolicyArgs().WithBucket(_bucketName).WithPolicy(policyJson));
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Không thể gán chính sách truy cập công khai cho bucket '{BucketName}'.", _bucketName);
                    }
                }

                _bucketInitialized = true;
            }
            finally
            {
                _initLock.Release();
            }
        }

        public async Task<string> UploadFileAsync(IFormFile file, string subFolder)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File upload không hợp lệ hoặc rỗng.");
            }

            try
            {
                await EnsureBucketExistsAsync();

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var cleanFolder = string.IsNullOrWhiteSpace(subFolder) ? "media" : subFolder.Trim('/', '\\');
                var objectName = $"{cleanFolder}/{Guid.NewGuid()}{ext}";

                using var stream = file.OpenReadStream();
                var putArgs = new PutObjectArgs()
                    .WithBucket(_bucketName)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(file.ContentType ?? "application/octet-stream");

                await _minioClient.PutObjectAsync(putArgs);

                var scheme = _withSsl ? "https" : "http";
                var fileUrl = $"{scheme}://{_endpoint}/{_bucketName}/{objectName}";
                _logger.LogInformation("Đã upload file thành công lên MinIO: {FileUrl}", fileUrl);

                return fileUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi upload file lên MinIO ({Endpoint}/{BucketName}): {Message}", _endpoint, _bucketName, ex.Message);
                throw new InvalidOperationException($"Không thể kết nối hoặc tải file lên MinIO ({_endpoint}). Vui lòng kiểm tra dịch vụ MinIO đã khởi động chưa. Chi tiết: {ex.Message}", ex);
            }
        }

        public async Task<string> UploadBase64ImageAsync(string base64Data, string subFolder, string filePrefix = "sig")
        {
            if (string.IsNullOrWhiteSpace(base64Data))
            {
                throw new ArgumentException("Dữ liệu ảnh base64 rỗng.");
            }

            try
            {
                await EnsureBucketExistsAsync();

                string cleanBase64 = base64Data;
                string extension = ".png";
                string contentType = "image/png";

                if (base64Data.Contains(","))
                {
                    var parts = base64Data.Split(',', 2);
                    cleanBase64 = parts[1];
                    if (parts[0].Contains("image/jpeg") || parts[0].Contains("image/jpg"))
                    {
                        extension = ".jpg";
                        contentType = "image/jpeg";
                    }
                    else if (parts[0].Contains("image/webp"))
                    {
                        extension = ".webp";
                        contentType = "image/webp";
                    }
                }

                byte[] imageBytes = Convert.FromBase64String(cleanBase64);
                using var stream = new MemoryStream(imageBytes);

                var cleanFolder = string.IsNullOrWhiteSpace(subFolder) ? "signatures" : subFolder.Trim('/', '\\');
                var objectName = $"{cleanFolder}/{filePrefix}_{Guid.NewGuid()}{extension}";

                var putArgs = new PutObjectArgs()
                    .WithBucket(_bucketName)
                    .WithObject(objectName)
                    .WithStreamData(stream)
                    .WithObjectSize(stream.Length)
                    .WithContentType(contentType);

                await _minioClient.PutObjectAsync(putArgs);

                var scheme = _withSsl ? "https" : "http";
                var fileUrl = $"{scheme}://{_endpoint}/{_bucketName}/{objectName}";
                _logger.LogInformation("Đã upload chữ ký số lên MinIO: {FileUrl}", fileUrl);

                return fileUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi upload base64 lên MinIO ({Endpoint}/{BucketName}): {Message}", _endpoint, _bucketName, ex.Message);
                throw new InvalidOperationException($"Không thể tải chữ ký số lên MinIO. Chi tiết: {ex.Message}", ex);
            }
        }

        public async Task DeleteFileAsync(string? fileUrl)
        {
            if (string.IsNullOrWhiteSpace(fileUrl)) return;

            try
            {
                // Nếu là file lưu cục bộ cũ (bắt đầu bằng /images/ hoặc /videos/)
                if (fileUrl.StartsWith("/"))
                {
                    var localPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", fileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (File.Exists(localPath))
                    {
                        File.Delete(localPath);
                        _logger.LogInformation("Đã xóa file cục bộ: {Path}", localPath);
                    }
                    return;
                }

                // Nếu là URL MinIO
                if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
                {
                    var path = uri.AbsolutePath.TrimStart('/');
                    // Loại bỏ tên bucket ở đầu đường dẫn nếu có
                    var prefix = _bucketName + "/";
                    var objectName = path.StartsWith(prefix) ? path.Substring(prefix.Length) : path;

                    await _minioClient.RemoveObjectAsync(new RemoveObjectArgs()
                        .WithBucket(_bucketName)
                        .WithObject(objectName));

                    _logger.LogInformation("Đã xóa object '{ObjectName}' khỏi MinIO bucket '{BucketName}'", objectName, _bucketName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể xóa file '{FileUrl}': {Message}", fileUrl, ex.Message);
            }
        }
    }
}

