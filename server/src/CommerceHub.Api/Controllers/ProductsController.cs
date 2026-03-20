using CommerceHub.Api.DTOs;
using CommerceHub.Api.Services;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CommerceHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IFileStorageService _fileStorageService;
    private readonly IValidator<StockAdjustmentDto> _stockValidator;

    public ProductsController(
        IProductService productService,
        IFileStorageService fileStorageService,
        IValidator<StockAdjustmentDto> stockValidator)
    {
        _productService = productService;
        _fileStorageService = fileStorageService;
        _stockValidator = stockValidator;
    }

    /// <summary>
    /// Gets all products from the catalog safely.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CommerceHub.Api.Models.Product>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _productService.GetAllAsync();
        return Ok(result.Data);
    }

    /// <summary>
    /// Creates a new product cataloging optional environment photo uploads securely natively mapped into FileStorageService routing endpoints!
    /// </summary>
    [Authorize]
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromForm] CreateProductDto request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        string? photoUrl = null;
        if (request.PhotoFile != null)
        {
            photoUrl = await _fileStorageService.SaveFileAsync(request.PhotoFile, "products");
        }

        var product = new CommerceHub.Api.Models.Product
        {
            Name = request.Name,
            Brand = request.Brand,
            Category = request.Category,
            Description = request.Description ?? string.Empty,
            Stock = request.Stock,
            Price = request.Price,
            TechnicalName = request.TechnicalName,
            ExpiryDate = request.ExpiryDate,
            PhotoUrl = photoUrl
        };

        var result = await _productService.CreateAsync(product);
        return Created($"/api/products/{result.Data!.Id}", result.Data);
    }

    /// <summary>
    /// Direct inventory adjustment. Atomic operation that prevents negative stock levels.
    /// </summary>
    [Authorize]
    [HttpPatch("{id}/stock")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> AdjustStock(string id, [FromBody] StockAdjustmentDto request)
    {
        var validation = await _stockValidator.ValidateAsync(request);
        if (!validation.IsValid)
        {
            return BadRequest(new { errors = validation.Errors.Select(e => e.ErrorMessage) });
        }

        var result = await _productService.AdjustStockAsync(id, request);

        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new { error = result.ErrorMessage });
        }

        return Ok(new
        {
            productId = result.Data!.Id,
            name = result.Data.Name,
            stock = result.Data.Stock,
            updatedAt = result.Data.UpdatedAt
        });
    }

    [HttpPatch("{id:length(24)}/discount")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateDiscount(string id, [FromBody] UpdateDiscountDto request)
    {
        var success = await _productService.UpdateDiscountAsync(id, request.DiscountAmount, request.IsDiscountActive);

        if (!success)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpGet("search")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string name)
    {
        var result = await _productService.SearchAsync(name);
        return Ok(result.Data);
    }

    [HttpPatch("{id:length(24)}/restock")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RestockWithPrice(string id, [FromBody] RestockAdjustmentDto request)
    {
        var result = await _productService.RestockWithPriceAsync(id, request.AddedQuantity, request.NewPrice);
        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new { error = result.ErrorMessage });
        }
        return Ok(result.Data);
    }
}
