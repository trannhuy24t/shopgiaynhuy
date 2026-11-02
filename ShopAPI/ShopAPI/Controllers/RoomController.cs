using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopAPI.DTOs;
using ShopAPI.Interfaces;

namespace ShopAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RoomController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly IStorageService _storageService;

        public RoomController(IRoomService roomService, IStorageService storageService)
        {
            _roomService = roomService;
            _storageService = storageService;
        }

        // Khách thuê xem phòng trống, không cần đăng nhập
        [HttpGet("available")]
        public IActionResult GetAvailable([FromQuery] int? buildingId)
        {
            var rooms = _roomService.GetAvailable(buildingId);

            return Ok(rooms);
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var room = _roomService.GetById(id);

            if (room == null)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            return Ok(room);
        }

        [Authorize(Roles = "Admin,Staff")]
        [HttpGet]
        public IActionResult GetAll([FromQuery] int? buildingId, [FromQuery] string? status)
        {
            var rooms = _roomService.GetAll(buildingId, status);

            return Ok(rooms);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public IActionResult Create(CreateRoomDto dto)
        {
            var room = _roomService.Create(dto);

            return Ok(room);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost("upload")]
        public async Task<IActionResult> CreateWithImage([FromForm] CreateRoomWithImageDto dto)
        {
            var allFiles = new List<IFormFile>();
            if (dto.Files != null && dto.Files.Count > 0)
            {
                allFiles.AddRange(dto.Files.Where(f => f.Length > 0));
            }
            if (dto.Image != null && dto.Image.Length > 0 && !allFiles.Contains(dto.Image))
            {
                allFiles.Insert(0, dto.Image);
            }

            string? primaryImageUrl = null;
            var mediaItems = new List<RoomMediaInputDto>();

            foreach (var file in allFiles)
            {
                var (mediaItem, error) = await SaveMediaSafeAsync(file);
                if (error != null)
                {
                    return BadRequest(new { message = error });
                }
                if (mediaItem != null)
                {
                    mediaItems.Add(mediaItem);
                    if (primaryImageUrl == null && mediaItem.Type == "Image")
                    {
                        primaryImageUrl = mediaItem.Url;
                    }
                }
            }

            var room = _roomService.Create(new CreateRoomDto
            {
                BuildingId = dto.BuildingId,
                RoomNumber = dto.RoomNumber,
                RoomType = dto.RoomType,
                Area = dto.Area,
                Price = dto.Price,
                ServiceFee = dto.ServiceFee,
                Amenities = dto.Amenities,
                Description = dto.Description,
                ImageUrl = primaryImageUrl
            });

            if (mediaItems.Count > 0)
            {
                _roomService.AddMedia(room.Id, mediaItems);
            }

            return Ok(_roomService.GetById(room.Id));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut]
        public IActionResult Update(UpdateRoomDto dto)
        {
            var result = _roomService.Update(dto);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            return Ok(new { message = "Cập nhật thành công." });
        }

        // Sửa phòng kèm đổi ảnh (multipart/form-data). Bỏ trống field Image để giữ ảnh cũ.
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/upload")]
        public async Task<IActionResult> UpdateWithImage(int id, [FromForm] UpdateRoomWithImageDto dto)
        {
            var existing = _roomService.GetById(id);

            if (existing == null)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            var (newImageUrl, error) = await SaveImageSafeAsync(dto.Image);
            if (error != null)
            {
                return BadRequest(new { message = error });
            }

            var imageUrl = newImageUrl ?? existing.ImageUrl;

            var result = _roomService.Update(new UpdateRoomDto
            {
                Id = id,
                RoomNumber = dto.RoomNumber,
                RoomType = dto.RoomType,
                Area = dto.Area,
                Price = dto.Price,
                ServiceFee = dto.ServiceFee,
                Amenities = dto.Amenities,
                Description = dto.Description,
                ImageUrl = imageUrl
            });

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            if (dto.Files != null && dto.Files.Count > 0)
            {
                var mediaItems = new List<RoomMediaInputDto>();
                foreach (var file in dto.Files.Where(f => f.Length > 0))
                {
                    var (mediaItem, mediaError) = await SaveMediaSafeAsync(file);
                    if (mediaError != null) return BadRequest(new { message = mediaError });
                    if (mediaItem != null) mediaItems.Add(mediaItem);
                }
                if (mediaItems.Count > 0)
                {
                    _roomService.AddMedia(id, mediaItems);
                }
            }

            return Ok(_roomService.GetById(id));
        }

        private const long MaxImageSize = 5 * 1024 * 1024;   // 5MB
        private const long MaxVideoSize = 50 * 1024 * 1024;  // 50MB

        private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
        private static readonly string[] AllowedVideoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv", ".m4v"];

        private async Task<(string? Url, string? Error)> SaveImageSafeAsync(IFormFile? image)
        {
            if (image == null || image.Length == 0) return (null, null);

            var ext = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (!AllowedImageExtensions.Contains(ext))
                return (null, $"Chỉ chấp nhận ảnh: {string.Join(", ", AllowedImageExtensions)}");

            if (image.Length > MaxImageSize)
                return (null, "Ảnh không được vượt quá 5MB.");

            try
            {
                var url = await _storageService.UploadFileAsync(image, "rooms");
                return (url, null);
            }
            catch (Exception ex)
            {
                return (null, ex.Message);
            }
        }

        private async Task<(RoomMediaInputDto? Media, string? Error)> SaveMediaSafeAsync(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var isVideo = AllowedVideoExtensions.Contains(ext);
            var isImage = AllowedImageExtensions.Contains(ext);

            if (!isVideo && !isImage)
                return (null, $"Định dạng không hỗ trợ: {ext}");

            var sizeLimit = isVideo ? MaxVideoSize : MaxImageSize;
            if (file.Length > sizeLimit)
                return (null, isVideo ? "Video không được vượt quá 50MB." : "Ảnh không được vượt quá 5MB.");

            try
            {
                var subFolder = isVideo ? "videos/rooms" : "images/rooms";
                var url = await _storageService.UploadFileAsync(file, subFolder);
                return (new RoomMediaInputDto { Url = url, Type = isVideo ? "Video" : "Image" }, null);
            }
            catch (Exception ex)
            {
                return (null, ex.Message);
            }
        }

        // Thêm nhiều ảnh/video vào thư viện của phòng (multipart/form-data, field "files" lặp lại nhiều lần)
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/media")]
        public async Task<IActionResult> AddMedia(int id, [FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "Chưa chọn file nào." });
            }

            var items = new List<RoomMediaInputDto>();
            foreach (var file in files.Where(f => f.Length > 0))
            {
                var (mediaItem, error) = await SaveMediaSafeAsync(file);
                if (error != null) return BadRequest(new { message = error });
                items.Add(mediaItem!);
            }

            var media = _roomService.AddMedia(id, items);

            if (media == null)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            return Ok(media);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/media/{mediaId}")]
        public async Task<IActionResult> RemoveMedia(int id, int mediaId)
        {
            var url = _roomService.RemoveMedia(id, mediaId);

            if (url == null)
            {
                return NotFound(new { message = "Không tìm thấy ảnh/video." });
            }

            await _storageService.DeleteFileAsync(url);

            return Ok(new { message = "Xóa thành công." });
        }

        // Chọn 1 ảnh trong thư viện làm ảnh đại diện
        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/media/{mediaId}/primary")]
        public IActionResult SetPrimaryMedia(int id, int mediaId)
        {
            var result = _roomService.SetPrimaryMedia(id, mediaId);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy ảnh trong thư viện phòng này." });
            }

            return Ok(new { message = "Đã đặt làm ảnh đại diện." });
        }

        // Staff cập nhật trạng thái phòng
        [Authorize(Roles = "Admin,Staff")]
        [HttpPut("status")]
        public IActionResult UpdateStatus(UpdateRoomStatusDto dto)
        {
            var result = _roomService.UpdateStatus(dto);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            return Ok(new { message = "Cập nhật trạng thái phòng thành công." });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var result = _roomService.Delete(id);

            if (!result)
            {
                return NotFound(new { message = "Không tìm thấy phòng." });
            }

            return Ok(new { message = "Xóa thành công." });
        }
    }
}
