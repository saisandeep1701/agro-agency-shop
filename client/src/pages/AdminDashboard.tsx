import React, { useEffect, useState } from 'react';
import { Product, Order, StockAdjustmentDto } from '../types';
import { Link } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5100';

const AdminDashboard: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Expiry State
    const [showExpiryToast, setShowExpiryToast] = useState(false);
    const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);

    // File Upload Form State
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('Pesticides');
    const [stock, setStock] = useState<number | ''>('');
    const [price, setPrice] = useState<number | ''>('');
    const [technicalName, setTechnicalName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const [productsRes, ordersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/products`),
                fetch(`${API_BASE_URL}/api/orders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (!productsRes.ok || !ordersRes.ok) throw new Error("Failed to fetch dashboard data.");

            const productsData: Product[] = await productsRes.json();
            const ordersData: Order[] = await ordersRes.json();

            setProducts(productsData);
            setOrders(ordersData);

            // Calculate Expiry Data
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const expiring = productsData.filter((p) => {
                if (!p.expiryDate) return false;
                return new Date(p.expiryDate) <= thirtyDaysFromNow;
            });

            if (expiring.length > 0) {
                setExpiringProducts(expiring);
                setShowExpiryToast(true);
            } else {
                setShowExpiryToast(false);
            }

        } catch (err: any) {
            console.error(err);
            setError("Error loading admin data. Ensure backend is running at " + API_BASE_URL);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !brand || stock === '' || price === '') {
            alert("Please fill out required fields.");
            return;
        }

        const formData = new FormData();
        formData.append("Name", name);
        formData.append("Brand", brand);
        formData.append("Category", category);
        formData.append("Stock", stock.toString());
        formData.append("Price", price.toString());
        if (technicalName) formData.append("TechnicalName", technicalName);
        if (expiryDate) formData.append("ExpiryDate", expiryDate);
        if (photoFile) formData.append("PhotoFile", photoFile);

        try {
            const token = localStorage.getItem('adminToken');
            // Do NOT specify Content-Type; browser resolves multipart boundary securely
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                alert("Product created successfully!");
                fetchDashboardData();
                setName(''); setBrand(''); setCategory('Pesticides'); setStock(''); setPrice('');
                setTechnicalName(''); setExpiryDate(''); setPhotoFile(null);
            } else {
                const err = await response.json();
                alert(`Failed: ${JSON.stringify(err)}`);
            }
        } catch (err) {
            console.error(err);
            alert("Error communicating with server.");
        }
    };

    const handleRestock = async (productId: string) => {
        const adjustment: StockAdjustmentDto = { productId, quantityToAdjust: 50, reason: "Admin Restock" };
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

    const isProductExpiring = (dateStr?: string) => {
        if (!dateStr) return false;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return new Date(dateStr) <= thirtyDaysFromNow;
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-light" /></div>;
    if (error) return <div className="alert alert-danger m-5">{error}</div>;

    return (
        <div className="container py-5 text-white">
            <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
                <h2>Admin Dashboard</h2>
                <Link to="/" className="btn btn-outline-light">Back to Store</Link>
            </div>

            {/* EXPIRY TOAST */}
            {showExpiryToast && expiringProducts.length > 0 && (
                <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1050 }}>
                    <div className="toast show align-items-center text-bg-danger border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="d-flex">
                            <div className="toast-body fw-bold fs-6">
                                ⚠️ ALERT: {expiringProducts.length} Product(s) expiring within 30 days!
                            </div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setShowExpiryToast(false)} aria-label="Close"></button>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
                {/* NEW: MOBILE PRODUCT ENTRY */}
                <div className="col-12 col-xl-4 mb-4">
                    <div className="card text-bg-dark border-secondary shadow h-100" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)' }}>
                        <div className="card-header border-secondary">
                            <h4 className="mb-0 text-success">📱 Direct Entry</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleCreateProduct}>
                                <div className="mb-3">
                                    <label className="form-label">Brand & Product Name *</label>
                                    <div className="input-group">
                                        <input type="text" className="form-control text-bg-dark border-secondary" placeholder="Brand (e.g. Syngenta)" value={brand} onChange={e => setBrand(e.target.value)} required />
                                        <input type="text" className="form-control text-bg-dark border-secondary" placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Category *</label>
                                    <select className="form-select text-bg-dark border-secondary" value={category} onChange={e => setCategory(e.target.value)}>
                                        <option value="Pesticides">Pesticides</option>
                                        <option value="Fertilizers">Fertilizers</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Technical Name (Optional)</label>
                                    <input type="text" className="form-control text-bg-dark border-secondary" placeholder="e.g. Glyphosate 41% SL" value={technicalName} onChange={e => setTechnicalName(e.target.value)} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Price & Initial Stock *</label>
                                    <div className="input-group">
                                        <span className="input-group-text bg-secondary text-white border-secondary">$</span>
                                        <input type="number" step="0.01" className="form-control text-bg-dark border-secondary" placeholder="Price" value={price} onChange={e => setPrice(Number(e.target.value))} required />
                                        <input type="number" className="form-control text-bg-dark border-secondary" placeholder="Stock" value={stock} onChange={e => setStock(Number(e.target.value))} required />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-warning">Expiry Date (Critical)</label>
                                    <input type="date" className="form-control text-bg-dark border-secondary" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-info">📸 Mobile Camera Capture</label>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        capture="environment" 
                                        className="form-control text-bg-dark border-secondary" 
                                        onChange={e => setPhotoFile(e.target.files?.[0] || null)} 
                                    />
                                    <small className="text-secondary mt-1 d-block">Will stream directly to CommerceHub Static Files over native FormData</small>
                                </div>
                                <button type="submit" className="btn btn-success fw-bold w-100">Upload to Database</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8 mb-4">
                    <div className="card text-bg-dark border-secondary shadow h-100" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)' }}>
                        <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">Live Inventory</h4>
                            <button className="btn btn-sm btn-outline-light" onClick={fetchDashboardData}>Refresh</button>
                        </div>
                        <div className="card-body" style={{ maxHeight: '700px', overflowY: 'auto' }}>
                            <table className="table table-dark table-striped table-hover align-middle border-secondary">
                                <thead>
                                    <tr>
                                        <th>Name & Tech Specs</th>
                                        <th>Status / Expiry</th>
                                        <th>Stock</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const isExpiring = isProductExpiring(p.expiryDate);
                                        return (
                                            <tr key={p.id}>
                                                <td>
                                                    <div className="text-light fw-bold mb-1" style={{ fontSize: '1.05rem' }}>{p.brand?.toUpperCase()}</div>
                                                    <div className="fw-bold">{p.name} <small className="text-muted ms-1">({p.sku})</small></div>
                                                    {p.technicalName && <div className="text-secondary opacity-75 fst-italic" style={{ fontSize: '0.85rem' }}>{p.technicalName}</div>}
                                                </td>
                                                <td>
                                                    <div>
                                                        {p.stock <= 0 && <span className="badge text-bg-danger me-1">Out</span>}
                                                        {p.stock > 0 && p.stock < 10 && <span className="badge text-bg-warning text-dark me-1">Low</span>}
                                                    </div>
                                                    <div>
                                                        {isExpiring && <span className="badge text-bg-danger mt-1">Expiring Soon</span>}
                                                        {!isExpiring && p.expiryDate && <span className="badge border border-success text-success mt-1">Valid ({new Date(p.expiryDate).toLocaleDateString()})</span>}
                                                    </div>
                                                </td>
                                                <td className="fw-bold fs-5">{p.stock}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-dark border-light" onClick={() => handleRestock(p.id)}>
                                                        + Restock (50)
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {products.length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-muted">No products found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card text-bg-dark border-secondary shadow" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)' }}>
                        <div className="card-header border-secondary">
                            <h4 className="mb-0">Recent Order Logs</h4>
                        </div>
                        <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table table-dark table-sm table-striped align-middle border-secondary">
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
