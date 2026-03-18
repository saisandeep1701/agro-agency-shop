using CommerceHub.Api.Configuration;
using CommerceHub.Api.Messaging;
using CommerceHub.Api.Middleware;
using CommerceHub.Api.Repositories;
using CommerceHub.Api.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});


builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection(MongoDbSettings.SectionName));
builder.Services.Configure<RabbitMqSettings>(
    builder.Configuration.GetSection(RabbitMqSettings.SectionName));

// ---------------------------------------------------------------------------
// MongoDB
// ---------------------------------------------------------------------------
builder.Services.AddSingleton<MongoDbContext>();

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------
builder.Services.AddSingleton<IEventPublisher, RabbitMqEventPublisher>();

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IProductService, ProductService>();

// ---------------------------------------------------------------------------
// Validation (registers all validators from this assembly)
// ---------------------------------------------------------------------------
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ---------------------------------------------------------------------------
// Authentication & Authorization
// ---------------------------------------------------------------------------
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// ---------------------------------------------------------------------------
// Controllers + Swagger
// ---------------------------------------------------------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "CommerceHub API",
        Version = "v1",
        Description = "Commerce Hub Microservice — Order processing with atomic inventory management"
    });
});

var app = builder.Build();

// ---------------------------------------------------------------------------
// Middleware Pipeline
// ---------------------------------------------------------------------------
app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseCors("AllowFrontend");

var supportedCultures = new[] { "en-US", "es-ES", "fr-FR" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

app.UseRequestLocalization(localizationOptions);

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Make Program class accessible for integration tests
public partial class Program { }
