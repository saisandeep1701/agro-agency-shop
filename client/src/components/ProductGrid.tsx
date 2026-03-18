import React, { useEffect, useState } from 'react';
import { Product, CheckoutRequestDto } from '../types';

interface ProductGridProps {
    searchQuery: string;
    onAddToCart: (product: Product) => void;
}

const API_BASE_URL = 'http://localhost:5100'; // CommerceHub docker-compose mapped port

const ProductGrid: React.FC<ProductGridProps> = ({ searchQuery, onAddToCart }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [alerts, setAlerts] = useState<{ message: string, type: string, id: number }[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            const url = searchQuery 
                ? `${API_BASE_URL}/api/products?search=${encodeURIComponent(searchQuery)}`
                : `${API_BASE_URL}/api/products`;

            try {
                const response = await fetch(url);
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
    }, [searchQuery]);

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
            items: [
                {
                    productId: product.id,
                    quantity: 1
                }
            ]
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(checkoutDto)
            });

            if (response.ok) {
                addAlert('Order placed successfully! Thank you for your purchase.', 'success');
                setProducts(prev => prev.map(p => 
                    p.id === product.id ? { ...p, stock: p.stock - 1 } : p
                ));
                onAddToCart(product);
            } else if (response.status === 409) {
                addAlert('Transaction failed: One or more items in your cart exceed available stock. Inventory has been safely restored.', 'warning');
            } else if (response.status === 404) {
                addAlert('Error: Product not found.', 'danger');
            } else if (response.status === 400) {
                const errData = await response.json();
                addAlert(`Validation Error: ${errData.title || errData.message || 'Invalid request'}`, 'danger');
            } else {
                addAlert('An unexpected error occurred during checkout.', 'danger');
            }
        } catch (error) {
            console.error('Error during checkout:', error);
            addAlert('Checkout failed. Please ensure the backend is running.', 'danger');
        }
    };

    return (
        <div className="container px-4 py-5" id="featured-3">
            <h2 className="pb-2 border-bottom">Products</h2>
            
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
                    <div className="spinner-border text-success" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}
            
            {!loading && !error && products.length === 0 && (
                <div className="text-center text-muted my-5">No products found.</div>
            )}

            <div className="row g-4 py-5 row-cols-1 row-cols-lg-3" id="productGrid">
                {!loading && !error && products.map(product => {
                    const stockClass = product.stock > 0 ? 'text-success' : 'text-danger';
                    const stockText = product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock';

                    return (
                        <div className="col" key={product.id}>
                            <div className="card h-100 shadow-sm border-secondary text-bg-dark">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h5 className="card-title text-success mb-0">{product.name}</h5>
                                        <div>
                                            {product.name.toLowerCase().includes('organic') && <span className="badge rounded-pill bg-success me-2">Bio-Certified</span>}
                                            <span className="badge rounded-pill text-bg-secondary">ID: {product.id.substring(0, 8)}...</span>
                                        </div>
                                    </div>
                                    <p className="card-text">{product.description || 'No description available'}</p>
                                    <p className="card-text"><small className={`${stockClass} fw-bold`}>{stockText}</small></p>
                                </div>
                                <div className="card-footer bg-transparent border-secondary text-center">
                                    <button 
                                        className="btn btn-outline-success w-100" 
                                        onClick={() => buyProduct(product)} 
                                        disabled={product.stock <= 0}
                                    >
                                        Buy Now
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
