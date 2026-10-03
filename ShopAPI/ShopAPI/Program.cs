using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using ShopAPI.Data;
using ShopAPI.Interfaces;
using ShopAPI.Middleware;
using ShopAPI.Repositories;
using ShopAPI.Services;
using System.Text;
using System.Threading.RateLimiting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/shopapi-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)
    .Enrich.FromLogContext()
    .CreateBootstrapLogger();

var builder = WebApplication.CreateBuilder(args);

// Giới hạn kích thước request tối đa 100MB (đủ cho video upload)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024; // 100MB
});

builder.Host.UseSerilog((context, services, config) => config
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/shopapi-.txt", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30));

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Controllers
builder.Services.AddControllers();

// Chuẩn hóa response lỗi validation thành { "message": "..." } (nhất quán với API)
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault() ?? "Dữ liệu gửi lên không hợp lệ.";

        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new { message = firstError });
    };
});


// CORS — đọc từ appsettings.json thay vì hardcode
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? ["http://localhost:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Rate Limiting — chống brute force login (5 request/phút per IP)
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", limiterOptions =>
    {
        limiterOptions.PermitLimit = 5;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        limiterOptions.QueueLimit = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, _) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Bạn đã thử quá nhiều lần. Vui lòng đợi 1 phút rồi thử lại."
        });
    };
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
        )
    };
});
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBuildingRepository, BuildingRepository>();
builder.Services.AddScoped<IBuildingService, BuildingService>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<ITenantRepository, TenantRepository>();
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<IContractRepository, ContractRepository>();
builder.Services.AddScoped<IContractService, ContractService>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IVietQrService, VietQrService>();
builder.Services.AddScoped<IMaintenanceRequestRepository, MaintenanceRequestRepository>();
builder.Services.AddScoped<IMaintenanceRequestService, MaintenanceRequestService>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<ISystemConfigService, SystemConfigService>();
builder.Services.AddScoped<IReportService, ReportService>();

// Background Service — tự động nhắc nhở hóa đơn/hợp đồng mỗi ngày lúc 8h sáng
builder.Services.AddHostedService<DailyReminderService>();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TroHub API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT theo dạng: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Seed default system config values (unit prices, VietQR bank info) if missing
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var defaults = new (string Key, string Value, string Description)[]
    {
        ("BankBin", builder.Configuration["VietQr:BankBin"] ?? "", "Mã BIN ngân hàng nhận thanh toán (VietQR)"),
        ("BankAccountNumber", builder.Configuration["VietQr:BankAccountNumber"] ?? "", "Số tài khoản nhận thanh toán (VietQR)"),
        ("BankAccountName", builder.Configuration["VietQr:BankAccountName"] ?? "", "Tên chủ tài khoản nhận thanh toán (VietQR)"),
        ("DefaultElectricUnitPrice", "3500", "Đơn giá điện mặc định (đ/kWh)"),
        ("DefaultWaterUnitPrice", "18000", "Đơn giá nước mặc định (đ/m3)"),
        ("DefaultServiceFee", "100000", "Phí dịch vụ mặc định mỗi hóa đơn (đ)")
    };

    foreach (var (key, value, description) in defaults)
    {
        if (!context.SystemConfigs.Any(x => x.Key == key))
        {
            context.SystemConfigs.Add(new ShopAPI.Models.SystemConfig
            {
                Key = key,
                Value = value,
                Description = description
            });
        }
    }

    context.SaveChanges();
}

// --- Middleware Pipeline ---
// 1. Global exception handler (phải đứng đầu để bắt lỗi của mọi middleware sau)
app.UseMiddleware<ExceptionHandlerMiddleware>();

// 2. Static files, HTTPS redirect
app.UseStaticFiles();
app.UseHttpsRedirection();

// 3. CORS
app.UseCors("ReactApp");

// 4. Rate limiting
app.UseRateLimiter();

// 5. Auth
app.UseAuthentication();
app.UseAuthorization();

// Swagger — chỉ Dev
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();