import React, { useEffect, useState } from 'react';
import { Product, CheckoutRequestDto } from '../types';

interface ProductGridProps {
    searchQuery: string;
    onAddToCart: (product: Product) => void;
}

const API_BASE_URL = 'http://localhost:5100';

const ProductGrid: React.FC<ProductGridProps> = ({ searchQuery, onAddToCart }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [alerts, setAlerts] = useState<{ message: string, type: string, id: number }[]>([]);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            
            try {
                // The backend GetAll() endpoint returns all stock without backend-side search logic.
                // We fetch all products and filter them natively against both search and category pills.
                const response = await fetch(`${API_BASE_URL}/api/products`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.status}`);
                }
                const data: Product[] = await response.json();
                setProducts(data);
            } catch (err: any) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please ensure the backend is running at ' + API_BASE_URL);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const addAlert = (message: string, type: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { message, type, id }]);
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== id));
        }, 5000);
    };

    const buyProduct = async (product: Product) => {
        const checkoutDto: CheckoutRequestDto = {
            customerId: "Customer-123", // Dummy ID for demo
            items: [{ productId: product.id, quantity: 1 }]
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutDto)
            });

            if (response.ok) {
                addAlert(`Order placed successfully! Thank you for purchasing ${product.name}.`, 'success');
                setProducts(prev => prev.map(p => 
                    p.id === product.id ? { ...p, stock: p.stock - 1 } : p
                ));
                onAddToCart(product);
            } else if (response.status === 409) {
                addAlert('Transaction failed: Inventory threshold exceeded.', 'warning');
            } else {
                addAlert('An unexpected error occurred during checkout.', 'danger');
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            addAlert('Checkout failed. Please ensure the backend is responding.', 'danger');
        }
    };

    // Category Inference engine parsing against product name / SKU patterns natively
    const getCategory = (p: Product): string => {
        const name = p.name.toLowerCase();
        const sku = p.sku?.toLowerCase() || '';
        
        if (name.includes('organic') || sku.includes('org')) return 'Organic';
        if (name.includes('pesticide') || name.includes('weed') || name.includes('glyphosate') || sku.includes('pest') || sku.includes('gly')) return 'Pesticides';
        if (name.includes('fertilizer') || name.includes('urea') || sku.includes('fert') || sku.includes('ur')) return 'Fertilizers';
        
        return 'Other'; 
    };

    const displayProducts = products.filter(p => {
        const category = getCategory(p);
        if (category === 'Organic') return false;

        const matchesCategory = activeCategory === 'All' || category === activeCategory;
        const matchesSearch = !searchQuery || 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="container px-4 py-5" id="featured-3">
            <h2 className="pb-2 border-bottom">Our Catalog</h2>
            
            {/* Dynamic Category Pill Filters */}
            <div className="d-flex justify-content-center gap-2 mb-5 mt-4 flex-wrap">
                {['All', 'Pesticides', 'Fertilizers'].map(cat => (
                    <button 
                        key={cat}
                        className={`btn ${activeCategory === cat ? 'btn-dark border-light text-white' : 'btn-outline-light text-white'} rounded-pill px-4 fw-bold`}
                        style={activeCategory === cat ? { background: '#000' } : {}}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div id="alertContainer" className="mb-4">
                {alerts.map(alert => (
                    <div key={alert.id} className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
                        {alert.message}
                        <button type="button" className="btn-close" onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} aria-label="Close"></button>
                    </div>
                ))}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {loading && (
                <div className="text-center my-5">
                    <div className="spinner-border text-success" role="status"></div>
                </div>
            )}
            
            {!loading && !error && displayProducts.length === 0 && (
                <div className="text-center text-muted my-5">No products found matching your active filters.</div>
            )}

            <div className="row g-4 py-3 row-cols-1 row-cols-lg-3" id="productGrid">
                {!loading && !error && displayProducts.map(product => {
                    const stockClass = product.stock > 0 ? 'text-success' : 'text-danger';
                    const stockText = product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock';

                    return (
                        <div className="col" key={product.id}>
                            <div className={`card h-100 shadow-sm text-bg-dark border-secondary`}>
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div className="badge bg-light text-dark fw-bold">{product.brand?.toUpperCase()}</div>
                                        {product.isDiscountActive && product.discountAmount ? (
                                            <div className="badge bg-danger shadow fs-6 fw-bold border border-light">
                                                🔥 SALE! -{Math.round((product.discountAmount / product.price) * 100)}%
                                            </div>
                                        ) : null}
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-0">
                                        <h5 className="card-title mb-0 text-light fw-bold">
                                            {product.name}
                                            {product.technicalName && <span className="d-block fst-italic text-secondary mt-1" style={{ fontSize: '0.8rem' }}>{product.technicalName}</span>}
                                        </h5>
                                        <span className="badge rounded-pill text-bg-secondary shadow-sm">ID: {product.id.substring(0, 8)}</span>
                                    </div>
                                    {product.technicalName && <div className="text-secondary mb-2 fst-italic" style={{ fontSize: '0.85rem' }}>{product.technicalName}</div>}
                                    {!product.technicalName && <div className="mb-2"></div>}
                                    <p className="card-text text-light mt-2">{product.description || 'No description available for this item.'}</p>
                                    <div className="d-flex justify-content-between mt-3 align-items-center">
                                        <span className={`${stockClass} fw-bold`}>{stockText}</span>
                                        <div className="text-end">
                                            {product.isDiscountActive && product.discountAmount ? (
                                                <div className="d-flex flex-column align-items-end">
                                                    <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.9rem' }}>
                                                        ${product.price ? product.price.toFixed(2) : '0.00'}
                                                    </span>
                                                    <span className="fw-bold text-success fs-5">
                                                        ${(product.price - product.discountAmount).toFixed(2)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="fw-bold text-light fs-5">
                                                    ${product.price ? product.price.toFixed(2) : '0.00'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`card-footer bg-transparent text-center border-secondary`}>
                                    <button 
                                        className="btn btn-dark border-secondary text-white w-100 fw-bold" 
                                        style={{ background: '#000' }}
                                        onClick={() => buyProduct(product)} 
                                        disabled={product.stock <= 0}
                                    >
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProductGrid;
