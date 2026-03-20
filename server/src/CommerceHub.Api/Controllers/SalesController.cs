using CommerceHub.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CommerceHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class SalesController : ControllerBase
{
    private readonly IOrderRepository _orderRepository;

    public SalesController(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    [HttpGet("report")]
    public async Task<IActionResult> GetSalesReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
    {
        if (startDate > endDate)
        {
            return BadRequest("Start date cannot be after end date.");
        }

        var orders = await _orderRepository.GetOrdersByDateRangeAsync(startDate, endDate);

        var totalOrders = orders.Count();
        var totalRevenue = orders.Sum(o => o.TotalAmount);

        return Ok(new
        {
            StartDate = startDate,
            EndDate = endDate,
            TotalOrders = totalOrders,
            TotalRevenue = totalRevenue,
            Orders = orders
        });
    }
}
