namespace EasyPhones.Application.Services;

public interface IFileService
{
    Task<SavedFile> SaveAsync(FileUploadInput input, CancellationToken ct = default);
    Task<ServedFile> GetByPathAsync(string path, CancellationToken ct = default);
    Task DeleteByPathAsync(string path, CancellationToken ct = default);
    string ServeUrl(string path, string baseUrl);
}

public record FileUploadInput(
    string OriginalName,
    string MimeType,
    long Size,
    byte[] Buffer,
    string Module,
    string? UploadedBy
);

public record SavedFile(string Id, string Path);

public record ServedFile(string MimeType, long Size, string OriginalName, byte[] Data);
