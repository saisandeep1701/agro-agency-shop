using CommerceHub.Api.DTOs;
using CommerceHub.Api.Models;
using CommerceHub.Api.Repositories;

namespace CommerceHub.Api.Services;

public class ProductService : IProductService
{
    private readonly IProductRepository _productRepository;
    private readonly ILogger<ProductService> _logger;

    public ProductService(IProductRepository productRepository, ILogger<ProductService> logger)
    {
        _productRepository = productRepository;
        _logger = logger;
    }

    public async Task<ServiceResult<IEnumerable<Product>>> GetAllAsync()
    {
        var products = await _productRepository.GetAllAsync();
        return ServiceResult<IEnumerable<Product>>.Ok(products);
    }

    public async Task<ServiceResult<Product>> CreateAsync(Product product)
    {
        product.Sku = await GenerateUniqueSkuAsync(product.Brand, product.Category, product.Name);
        var created = await _productRepository.CreateAsync(product);
        _logger.LogInformation("Product {ProductId} successfully created securely mapping Form bytes. Auto-SKU assigned: {Sku}", created.Id, created.Sku);
        return ServiceResult<Product>.Ok(created);
    }

    private async Task<string> GenerateUniqueSkuAsync(string brand, string category, string name)
    {
        var bPrefix = string.IsNullOrWhiteSpace(brand) ? "XXX" : (brand.Length >= 3 ? brand.Substring(0, 3) : brand.PadRight(3, 'X')).ToUpper();
        var cPrefix = string.IsNullOrWhiteSpace(category) ? "XXX" : (category.Length >= 3 ? category.Substring(0, 3) : category.PadRight(3, 'X')).ToUpper();
        var nPrefix = string.IsNullOrWhiteSpace(name) ? "XXX" : (name.Length >= 3 ? name.Substring(0, 3) : name.PadRight(3, 'X')).ToUpper();

        var random = new Random();
        string sku;
        do
        {
            sku = $"{bPrefix}-{cPrefix}-{nPrefix}-{random.Next(1000, 10000)}";
        } 
        while (await _productRepository.SkuExistsAsync(sku));

        return sku;
    }

    public async Task<bool> UpdateDiscountAsync(string id, decimal percentage, bool isActive)
    {
        var product = await _productRepository.GetByIdAsync(id);
        if (product == null)
        {
            return false;
        }

        product.DiscountPercentage = percentage;
        product.IsDiscountActive = isActive;
        product.UpdatedAt = DateTime.UtcNow;

        var updatedProduct = await _productRepository.UpdateAsync(id, product);
        return updatedProduct != null;
    }

    public async Task<ServiceResult<Product>> AdjustStockAsync(string productId, StockAdjustmentDto request)
    {
        // First check if product exists to give a useful error
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null)
        {
            return ServiceResult<Product>.Fail(404, $"Product with ID '{productId}' not found.");
        }

        var updatedProduct = await _productRepository.AdjustStockAsync(productId, request.Adjustment);

        if (updatedProduct == null)
        {
            _logger.LogWarning(
                "Stock adjustment rejected for product {ProductId}. Adjustment: {Adjustment}, Current stock: {Stock}",
                productId, request.Adjustment, product.Stock);
            return ServiceResult<Product>.Fail(409,
                $"Stock adjustment would result in negative stock. " +
                $"Current stock: {product.Stock}, Requested adjustment: {request.Adjustment}.");
        }

        _logger.LogInformation("Stock adjusted for product {ProductId}: {Adjustment}. New stock: {Stock}",
            productId, request.Adjustment, updatedProduct.Stock);

        return ServiceResult<Product>.Ok(updatedProduct);
    }
}
