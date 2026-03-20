import React, { useEffect, useState } from 'react';
import { Product, Order } from '../types';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { startOfDay, endOfDay, subDays, startOfMonth, startOfYear } from 'date-fns';

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

    // Smart Form State (V7)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // V7 Restock Form State
    const [restockAddedQuantity, setRestockAddedQuantity] = useState<number | ''>('');
    const [restockNewPrice, setRestockNewPrice] = useState<number | ''>('');

    // Sales Analytics State
    const [startDate, setStartDate] = useState<Date>(startOfDay(new Date()));
    const [endDate, setEndDate] = useState<Date>(endOfDay(new Date()));
    const [salesData, setSalesData] = useState<{totalRevenue: number, totalOrders: number} | null>(null);

    // Inline Discount States (mapping per product ID overrides)
    const [discountInputs, setDiscountInputs] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        fetchSalesData(startDate, endDate);
    }, [startDate, endDate]);

    // V7 Dynamic API Search Debounce
    useEffect(() => {
        // Only run Live Search if there isn't a Selected Product holding the modal state
        if (!searchQuery || selectedProduct) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch(`${API_BASE_URL}/api/products/search?name=${encodeURIComponent(searchQuery)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (error) {
                console.error("Search fetch failed:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedProduct]);

    const fetchSalesData = async (start: Date, end: Date) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/sales/report?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSalesData(data);
            }
        } catch (e) {
            console.error("Sales fetch error", e);
        }
    };

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

            if (!productsRes.ok) {
                throw new Error(`Failed to fetch products. HTTP ${productsRes.status} ${productsRes.statusText}`);
            }
            if (!ordersRes.ok) {
                throw new Error(`Failed to fetch orders. HTTP ${ordersRes.status} ${ordersRes.statusText} (likely Unauthorized)`);
            }

            const productsData: Product[] = await productsRes.json();
            const ordersData: Order[] = await ordersRes.json();

            setProducts(productsData);
            setOrders(ordersData);

            // Calculate Expiry Data using new API flag natively
            const expiring = productsData.filter((p) => p.expiringSoon === true);

            if (expiring.length > 0) {
                setExpiringProducts(expiring);
                setShowExpiryToast(true);
            } else {
                setShowExpiryToast(false);
            }

        } catch (err: any) {
            console.error(err);
            setError(`Error loading admin data: ${err.message}`);
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

    const handleRestockWithPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        const qty = Number(restockAddedQuantity) || 0;
        const newP = Number(restockNewPrice) || selectedProduct.price;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_BASE_URL}/api/products/${selectedProduct.id}/restock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ addedQuantity: qty, newPrice: newP })
            });

            if (res.ok) {
                alert(`Successfully restocked & updated price!`);
                fetchDashboardData();
                setSelectedProduct(null);
                setSearchQuery('');
                setRestockAddedQuantity('');
                setRestockNewPrice('');
            } else {
                const err = await res.json();
                alert(`Failed to restock: ${err.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error(error);
            alert("Error communicating with server.");
        }
    };


    const handleRestock = async (productId: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ adjustment: 50 })
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

    const handleApplyDiscount = async (productId: string, isActive: boolean) => {
        const amount = discountInputs[productId] || 0;
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/api/products/${productId}/discount`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ discountAmount: amount, isDiscountActive: isActive })
            });

            if (response.ok) {
                fetchDashboardData();
            } else {
                alert("Failed to apply discount.");
            }
        } catch (error) {
            console.error(error);
            alert("Error communicating with the server.");
        }
    };

    const handleDiscountChange = (productId: string, val: string) => {
        setDiscountInputs(prev => ({ ...prev, [productId]: Number(val) }));
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-light" /></div>;
    if (error) return <div className="alert alert-danger m-5">{error}</div>;

    // Helper logic deriving Stock / Analytics outputs
    const stockValuation = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock < 10);
    
    // Calculate Fast/Slow Movers
    const orderFrequency: { [key: string]: number } = {};
    orders.forEach(o => { o.items.forEach(item => { orderFrequency[item.productId] = (orderFrequency[item.productId] || 0) + item.quantity; }); });
    const productStats = products.map(p => ({ ...p, totalSold: orderFrequency[p.id] || 0 })).sort((a,b) => b.totalSold - a.totalSold);
    const fastMovers = productStats.slice(0, 3);
    const slowMovers = [...productStats].reverse().slice(0, 3);

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
                            <h4 className="mb-0 text-success">📱 Smart Entry</h4>
                        </div>
                        <div className="card-body">
                            <div className="mb-4 pb-2 border-bottom border-secondary">
                                <label className="form-label text-info fw-bold">Live Search &amp; Quick Add</label>
                                <input type="text" className="form-control text-bg-dark text-light border-secondary" placeholder="Search Product Name, Brand, or SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                {isSearching && <small className="text-muted mt-1 d-block">Searching...</small>}
                                
                                {/* LIVE SEARCH RESULTS DROPDOWN */}
                                {searchQuery && !selectedProduct && searchResults.length > 0 && (
                                    <div className="list-group position-absolute w-100 shadow-lg mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                        {searchResults.map(result => (
                                            <button 
                                                key={result.id || (result as any)._id} 
                                                type="button" 
                                                className="list-group-item list-group-item-action list-group-item-dark border-secondary"
                                                onClick={() => { 
                                                    const selectedId = result.id || (result as any)._id;
                                                    console.log("Selected Product ID:", selectedId);
                                                    console.log("Product Selected:", result);
                                                    setSelectedProduct({ ...result, id: selectedId }); 
                                                    setRestockNewPrice(result.price); 
                                                    setSearchQuery(''); 
                                                    setSearchResults([]); 
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>[{result.brand?.toUpperCase()}] - {result.name}</strong>
                                                        {result.technicalName && <span className="ms-2 text-secondary fst-italic" style={{fontSize:'0.85rem'}}>- {result.technicalName}</span>}
                                                    </div>
                                                    <span className="badge bg-success">${result.price.toFixed(2)}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searchQuery && !selectedProduct && searchResults.length === 0 && !isSearching && (
                                    <small className="text-warning mt-1 d-block">No match found — Form generates NEW product.</small>
                                )}
                            </div>

                            {selectedProduct ? (
                                <form onSubmit={handleRestockWithPrice}>
                                    <div className="alert bg-transparent border-dark p-3 shadow-lg" style={{ border: '2px solid black', boxShadow: '0 0 15px rgba(0, 0, 0, 0.4)' }}>
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <h5 className="text-light fw-bold mb-0">Restock: [{selectedProduct.brand?.toUpperCase()}] {selectedProduct.name}</h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedProduct(null)} aria-label="Close"></button>
                                        </div>
                                        <div className="mb-1 text-light"><strong>Product:</strong> [{selectedProduct.brand?.toUpperCase()}] {selectedProduct.name}</div>
                                        <div className="mb-3 text-light"><strong>Current Stock:</strong> {selectedProduct.stock}</div>
                                        
                                        <div className="row g-2 mb-3">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-bold text-light">Add Quantity</label>
                                                <input type="number" className="form-control text-bg-dark border-secondary text-light" placeholder="Quantity to Add" value={restockAddedQuantity} onChange={e => setRestockAddedQuantity(e.target.value ? Number(e.target.value) : '')} required />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label fw-bold text-light">New Unit Price</label>
                                                <div className="input-group">
                                                    <span className="input-group-text bg-secondary text-white border-secondary">$</span>
                                                    <input type="number" step="0.01" className="form-control text-bg-dark border-secondary" placeholder="Price" value={restockNewPrice} onChange={e => setRestockNewPrice(e.target.value ? Number(e.target.value) : '')} required />
                                                </div>
                                            </div>
                                        </div>

                                        <button type="submit" className="btn btn-success fw-bold w-100">Commit Dual Update</button>
                                    </div>
                                </form>
                            ) : (
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
                            )}
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
                                        <th>Stock & Discount</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
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
                                                        {p.expiringSoon && <span className="badge border border-danger text-danger mt-1 fw-bold">⚠️ Warning: Expiring Soon</span>}
                                                        {!p.expiringSoon && p.expiryDate && <span className="badge border border-success text-success mt-1">Valid ({new Date(p.expiryDate).toLocaleDateString()})</span>}
                                                    </div>
                                                </td>
                                                <td className="fw-bold fs-5">
                                                    <div>{p.stock} Unit(s)</div>
                                                    <div className="mt-2 d-flex flex-column" style={{ maxWidth: '140px' }}>
                                                        <div className="input-group input-group-sm mb-1">
                                                            <span className="input-group-text bg-secondary text-white border-secondary">$</span>
                                                            <input type="number" 
                                                                   className="form-control text-bg-dark border-secondary text-light" 
                                                                   placeholder="Amount" 
                                                                   value={discountInputs[p.id] !== undefined ? discountInputs[p.id] : (p.discountAmount || 0)} 
                                                                   onChange={(e) => handleDiscountChange(p.id, e.target.value)} 
                                                            />
                                                            <button className="btn btn-outline-success" onClick={() => handleApplyDiscount(p.id, true)}>On</button>
                                                            <button className="btn btn-outline-danger" onClick={() => handleApplyDiscount(p.id, false)}>Off</button>
                                                        </div>
                                                        {p.isDiscountActive && <small className="text-success fw-bold">Active (-${p.discountAmount})</small>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-dark border-light mb-2 w-100" onClick={() => handleRestock(p.id)}>
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

            {/* NEW: SALES ANALYTICS */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card text-bg-dark border-secondary shadow" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)' }}>
                        <div className="card-header border-secondary d-flex justify-content-between align-items-center flex-wrap">
                            <h4 className="mb-0 text-info">📈 Sales Analytics</h4>
                            <div className="d-flex gap-2 mt-2 mt-md-0">
                                <button className="btn btn-sm btn-outline-light" onClick={() => { setStartDate(startOfDay(new Date())); setEndDate(endOfDay(new Date())); }}>Today</button>
                                <button className="btn btn-sm btn-outline-light" onClick={() => { setStartDate(subDays(new Date(), 7)); setEndDate(endOfDay(new Date())); }}>This Week</button>
                                <button className="btn btn-sm btn-outline-light" onClick={() => { setStartDate(startOfMonth(new Date())); setEndDate(endOfDay(new Date())); }}>This Month</button>
                                <button className="btn btn-sm btn-outline-light" onClick={() => { setStartDate(startOfYear(new Date())); setEndDate(endOfDay(new Date())); }}>This Year</button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row align-items-center mb-4">
                                <div className="col-12 col-md-6 d-flex flex-column flex-md-row gap-3 text-light">
                                    <div className="d-flex flex-column">
                                        <label className="text-muted small fw-bold">START DATE</label>
                                        <DatePicker selected={startDate} onChange={(date: Date | null) => date && setStartDate(date)} className="form-control text-bg-dark border-secondary bg-dark text-light" />
                                    </div>
                                    <div className="d-flex flex-column">
                                        <label className="text-muted small fw-bold">END DATE</label>
                                        <DatePicker selected={endDate} onChange={(date: Date | null) => date && setEndDate(date)} className="form-control text-bg-dark border-secondary bg-dark text-light" />
                                    </div>
                                </div>
                                <div className="col-12 col-md-6 mt-4 mt-md-0 text-md-end">
                                    <div className="bg-dark border border-secondary p-3 rounded d-inline-block shadow-sm">
                                        <div className="text-muted text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px' }}>Total Revenue Generated</div>
                                        <h2 className="mb-0 text-success fw-bold">${salesData ? salesData.totalRevenue.toFixed(2) : '0.00'}</h2>
                                        <small className="text-muted">From {salesData ? salesData.totalOrders : 0} Total Orders</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12 mb-4">
                    <div className="card text-bg-dark border-secondary shadow" style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(15px)' }}>
                        <div className="card-header border-secondary">
                            <h4 className="mb-0 text-warning">📦 Stock Analytics</h4>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-12 col-md-4">
                                    <div className="bg-dark border border-secondary p-3 rounded h-100 shadow-sm">
                                        <div className="text-muted text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px' }}>Total Inventory Valuation</div>
                                        <h2 className="mb-0 text-warning fw-bold">${stockValuation.toFixed(2)}</h2>
                                        <small className="text-muted">Net Worth of Unliquidated Goods</small>
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <div className="bg-dark border border-secondary p-3 rounded h-100 shadow-sm">
                                        <div className="text-muted text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px' }}>Fast Movers</div>
                                        {fastMovers.length > 0 ? fastMovers.map(p => (
                                            <div key={p.id} className="d-flex justify-content-between border-bottom border-secondary py-1">
                                                <span>{p.name} <small className="text-muted">({p.sku})</small></span>
                                                <span className="text-success fw-bold">{p.totalSold} Sold</span>
                                            </div>
                                        )) : <span className="text-muted">No sales data yet.</span>}
                                    </div>
                                </div>
                                <div className="col-12 col-md-4">
                                    <div className="bg-dark border border-secondary p-3 rounded h-100 shadow-sm">
                                        <div className="text-muted text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px' }}>Slow Movers</div>
                                        {slowMovers.length > 0 ? slowMovers.map(p => (
                                            <div key={p.id} className="d-flex justify-content-between border-bottom border-secondary py-1">
                                                <span>{p.name} <small className="text-muted">({p.sku})</small></span>
                                                <span className="text-danger fw-bold">{p.totalSold} Sold</span>
                                            </div>
                                        )) : <span className="text-muted">No sales data yet.</span>}
                                    </div>
                                </div>
                            </div>
                            {lowStockItems.length > 0 && (
                                <div className="mt-4 p-3 bg-danger bg-opacity-10 border border-danger rounded">
                                    <h5 className="text-danger fw-bold mb-3">⚠️ Critical Low Stock Targets (&lt; 10 Units)</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        {lowStockItems.map(p => (
                                            <span key={p.id} className="badge bg-danger text-light px-3 py-2 border border-light">
                                                {p.name} ({p.stock} left)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
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
