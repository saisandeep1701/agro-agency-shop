using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace CommerceHub.Api.DTOs;

public class CreateProductDto
{
    [Required]
    public string Name { get; set; } = null!;

    [Required]
    public string Sku { get; set; } = null!;

    public string? Description { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }

    public string? TechnicalName { get; set; }

    public DateTime? ExpiryDate { get; set; }

    public IFormFile? PhotoFile { get; set; }
}
