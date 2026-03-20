using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CommerceHub.Api.Models;

public class Product
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = null!;

    [BsonElement("name")]
    public string Name { get; set; } = null!;

    [BsonElement("brand")]
    [BsonIgnoreIfNull]
    public string Brand { get; set; } = null!;

    [BsonElement("category")]
    [BsonIgnoreIfNull]
    public string Category { get; set; } = null!;

    [BsonElement("sku")]
    public string Sku { get; set; } = null!;

    [BsonElement("description")]
    public string Description { get; set; } = string.Empty;

    [BsonElement("stock")]
    public int Stock { get; set; }

    [BsonElement("price")]
    public decimal Price { get; set; }

    [BsonElement("discountPercentage")]
    public decimal DiscountPercentage { get; set; } = 0;

    [BsonElement("isDiscountActive")]
    public bool IsDiscountActive { get; set; } = false;

    [BsonElement("technicalName")]
    [BsonIgnoreIfNull]
    public string? TechnicalName { get; set; }

    [BsonElement("expiryDate")]
    [BsonIgnoreIfNull]
    public DateTime? ExpiryDate { get; set; }

    [BsonElement("photoUrl")]
    [BsonIgnoreIfNull]
    public string? PhotoUrl { get; set; }

    [BsonElement("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [BsonIgnore]
    public bool ExpiringSoon => ExpiryDate.HasValue && ExpiryDate.Value <= DateTime.UtcNow.AddDays(30);
}
