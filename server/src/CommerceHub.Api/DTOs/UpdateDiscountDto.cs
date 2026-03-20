using System.ComponentModel.DataAnnotations;

namespace CommerceHub.Api.DTOs;

public class UpdateDiscountDto
{
    [Required]
    [Range(0, 1000000)]
    public decimal DiscountAmount { get; set; }

    [Required]
    public bool IsDiscountActive { get; set; }
}
