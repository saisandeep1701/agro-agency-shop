using Microsoft.AspNetCore.Http;

namespace CommerceHub.Api.Services;

public interface IFileStorageService
{
    /// <summary>
    /// Saves an IFormFile to the specified folder within wwwroot and returns the relative URL.
    /// </summary>
    Task<string?> SaveFileAsync(IFormFile file, string folderName);
}
