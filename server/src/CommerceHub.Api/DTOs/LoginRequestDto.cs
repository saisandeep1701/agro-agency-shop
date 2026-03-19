using System.ComponentModel.DataAnnotations;

namespace CommerceHub.Api.DTOs;

public class LoginRequestDto
{
    [Required]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;
}
