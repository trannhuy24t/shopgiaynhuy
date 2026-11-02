@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG HỆ THỐNG TRỌ HUB (MINIO + BACKEND + FRONTEND)
echo ========================================================

echo [1/3] Đang kiểm tra và khởi động MinIO Docker...
docker compose up -d minio >nul 2>&1
if %errorlevel% neq 0 (
    echo [CẢNH BÁO] Không thể bật Docker MinIO tự động. Hãy đảm bảo Docker Desktop đang mở.
) else (
    echo [OK] MinIO đang chạy tại http://localhost:9000 (Console: http://localhost:9001)
)

echo.
echo [2/3] Đang khởi động Backend ASP.NET ShopAPI (cổng 5141)...
start "ShopAPI Backend" cmd /k "cd ShopAPI\ShopAPI && dotnet run --launch-profile http"

echo.
echo [3/3] Đang khởi động Frontend React (cổng 5173)...
start "React Frontend" cmd /k "cd my-first-app && npm run dev"

echo.
echo ========================================================
echo   ĐÃ KHỞI ĐỘNG XONG TẤT CẢ DỊCH VỤ!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:5141
echo   - MinIO:    http://localhost:9000 (Console: 9001)
echo ========================================================
pause

