using EasyPhones.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace EasyPhones.WebAPI.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private readonly IFileService _files;

    public FilesController(IFileService files) => _files = files;

    /// <summary>Serve a stored file (image/blob) by module and filename.</summary>
    [HttpGet("{module}/{filename}")]
    [ResponseCache(Duration = 31536000, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> Serve(string module, string filename, CancellationToken ct)
    {
        // Allow cross-origin image loads (Flutter mobile)
        Response.Headers.Append("Cross-Origin-Resource-Policy", "cross-origin");
        Response.Headers.Append("Access-Control-Allow-Origin", "*");

        var path = $"{module}/{filename}";
        var file = await _files.GetByPathAsync(path, ct);

        return File(file.Data, file.MimeType, file.OriginalName);
    }
}
