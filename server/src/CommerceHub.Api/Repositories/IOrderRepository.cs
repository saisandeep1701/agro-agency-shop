using CommerceHub.Api.Models;

namespace CommerceHub.Api.Repositories;

public interface IOrderRepository
{
    Task<IEnumerable<Order>> GetAllAsync();
    
    /// <summary>
    /// Fetches all active order clusters strictly bound by a Start and End date constraint!
    /// </summary>
    Task<IEnumerable<Order>> GetOrdersByDateRangeAsync(DateTime start, DateTime end);
    Task<Order?> GetByIdAsync(string id);
    Task<Order> CreateAsync(Order order);
    Task<Order?> UpdateAsync(string id, Order order);
}
