using Microsoft.AspNetCore.Http;

namespace ShopAPI.Interfaces
{
    public interface IStorageService
    {
        /// <summary>
        /// Tải file lên storage (MinIO) và trả về URL công khai của file.
        /// </summary>
        /// <param name="file">File từ client gửi lên</param>
        /// <param name="subFolder">Thư mục phân loại (rooms, maintenance, v.v.)</param>
        /// <returns>Đường dẫn URL của file</returns>
        Task<string> UploadFileAsync(IFormFile file, string subFolder);

        /// <summary>
        /// Tải ảnh base64 (chữ ký số, canvas) lên storage (MinIO) và trả về URL.
        /// </summary>
        Task<string> UploadBase64ImageAsync(string base64Data, string subFolder, string filePrefix = "sig");

        /// <summary>
        /// Xóa file trên storage dựa vào URL
        /// </summary>
        /// <param name="fileUrl">URL của file</param>
        Task DeleteFileAsync(string? fileUrl);
    }
}

