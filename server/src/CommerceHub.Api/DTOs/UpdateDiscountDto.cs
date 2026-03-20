using System.ComponentModel.DataAnnotations;

namespace CommerceHub.Api.DTOs;

public class UpdateDiscountDto
{
    [Required]
    [Range(0, 100)]
    public decimal DiscountPercentage { get; set; }

    [Required]
    public bool IsDiscountActive { get; set; }
}
