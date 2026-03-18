import React, { useEffect, useState } from 'react';
import { Product, Order, StockAdjustmentDto } from '../types';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5100';

const AdminDashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [productsRes, ordersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/products`),
                fetch(`${API_BASE_URL}/api/orders`)
            ]);

            if (!productsRes.ok || !ordersRes.ok) {
                throw new Error("Failed to fetch dashboard data.");
            }

            const productsData = await productsRes.json();
            const ordersData = await ordersRes.json();

            setProducts(productsData);
            setOrders(ordersData);
        } catch (err: any) {
            console.error(err);
            setError("Error loading admin data. Ensure backend is running at " + API_BASE_URL);
        } finally {
            setLoading(false);
        }
    };

    const handleRestock = async (productId: string) => {
        const adjustment: StockAdjustmentDto = {
            productId,
            quantityToAdjust: 50,
            reason: "Admin Restock"
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(adjustment)
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProducts(prev => prev.map(p => p.id === updatedProduct.productId ? { ...p, stock: updatedProduct.stock } : p));
            } else {
                alert("Failed to restock product.");
            }
        } catch (error) {
            console.error(error);
            alert("Error communicating with the server.");
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" /></div>;
    if (error) return <div className="alert alert-danger m-5">{error}</div>;

    return (
        <div className="container py-5">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <h2>Admin Dashboard</h2>
                <Link to="/" className="btn btn-outline-secondary">Back to Store</Link>
            </div>

            <div className="row">
                <div className="col-lg-7 mb-4">
                    <div className="card text-bg-dark border-secondary shadow h-100">
                        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Inventory Manager</h4>
                            <button className="btn btn-sm btn-outline-light" onClick={fetchDashboardData}>Refresh</button>
                        </div>
                        <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="table table-dark table-striped table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Stock</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => (
                                        <tr key={p.id}>
                                            <td><small className="text-muted">{p.id.substring(0,8)}</small></td>
                                            <td>{p.name}</td>
                                            <td>
                                                {p.stock < 10 && <span className="badge text-bg-danger">Low Stock</span>}
                                                {p.stock > 50 && <span className="badge text-bg-success">Healthy</span>}
                                                {p.stock >= 10 && p.stock <= 50 && <span className="badge text-bg-warning text-dark">Adequate</span>}
                                            </td>
                                            <td className="fw-bold">{p.stock}</td>
                                            <td>
                                                <button className="btn btn-sm btn-success" onClick={() => handleRestock(p.id)}>
                                                    + Restock (50)
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {products.length === 0 && (
                                        <tr><td colSpan={5} className="text-center text-muted">No products found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="col-lg-5 mb-4">
                    <div className="card text-bg-dark border-secondary shadow h-100">
                        <div className="card-header border-secondary">
                            <h4 className="mb-0">Order Logs</h4>
                        </div>
                        <div className="card-body" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="table table-dark table-sm table-striped align-middle">
                                <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Customer</th>
                                        <th>Total</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => (
                                        <tr key={o.id}>
                                            <td><small className="text-muted">{o.id.substring(0,8)}</small></td>
                                            <td>{o.customerId}</td>
                                            <td>${o.totalAmount}</td>
                                            <td><span className="badge text-bg-info text-dark">{o.status}</span></td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-muted">No orders found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
