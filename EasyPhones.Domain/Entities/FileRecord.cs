using EasyPhones.Domain.Entities.Base;

namespace EasyPhones.Domain.Entities;

public class FileRecord : BaseEntity
{
    public string OriginalName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long Size { get; set; }
    public string Path { get; set; } = string.Empty;
    public byte[] Data { get; set; } = Array.Empty<byte>();
    public string? UploadedBy { get; set; }
}
