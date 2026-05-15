using EasyPhones.Application.Exceptions;
using EasyPhones.Application.Services;
using EasyPhones.Domain.Entities;
using EasyPhones.Domain.Repositories;

namespace EasyPhones.Infrastructure.Services;

public class FileService : IFileService
{
    private readonly IFileRepository _files;

    public FileService(IFileRepository files) => _files = files;

    public async Task<SavedFile> SaveAsync(FileUploadInput input, CancellationToken ct)
    {
        var sanitised = SanitiseName(input.OriginalName);
        var path = $"{input.Module}/{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{sanitised}";
        var id = Guid.NewGuid().ToString();

        var record = new FileRecord
        {
            Id = id,
            OriginalName = input.OriginalName,
            MimeType = input.MimeType,
            Size = input.Size,
            Path = path,
            Data = input.Buffer,
            UploadedBy = input.UploadedBy,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _files.AddAsync(record, ct);
        return new SavedFile(id, path);
    }

    public async Task<ServedFile> GetByPathAsync(string path, CancellationToken ct)
    {
        var file = await _files.GetByPathAsync(path, ct)
            ?? throw ApiException.NotFound("File not found.");
        return new ServedFile(file.MimeType, file.Size, file.OriginalName, file.Data);
    }

    public Task DeleteByPathAsync(string path, CancellationToken ct)
        => _files.DeleteByPathAsync(path, ct);

    public string ServeUrl(string path, string baseUrl)
        => $"{baseUrl}/api/files/{path}";

    private static string SanitiseName(string name)
        => System.Text.RegularExpressions.Regex.Replace(name, @"[^a-zA-Z0-9._\-]", "_");
}
