import React, { useEffect, useState } from 'react';
import { Product, CheckoutRequestDto } from '../types';

interface GreenRevolutionProps {
    onAddToCart: (product: Product) => void;
}

const API_BASE_URL = 'http://localhost:5100';

const GreenRevolution: React.FC<GreenRevolutionProps> = ({ onAddToCart }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [alerts, setAlerts] = useState<{ message: string, type: string, id: number }[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/products`);
                if (response.ok) {
                    let data: Product[] = await response.json();
                    data = data.filter(p => p.name.toLowerCase().includes('organic'));
                    setProducts(data);
                }
            } catch (err) {
                console.error('Error fetching organic products:', err);
            }
        };
        fetchProducts();
    }, []);

    const addAlert = (message: string, type: string) => {
        const id = Date.now();
        setAlerts(prev => [...prev, { message, type, id }]);
        setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 5000);
    };

    const buyProduct = async (product: Product) => {
        const checkoutDto: CheckoutRequestDto = {
            customerId: "Customer-123",
            items: [{ productId: product.id, quantity: 1 }]
        };
        try {
            const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutDto)
            });
            if (response.ok) {
                addAlert('Organic Order placed! Earth thanks you!', 'success');
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: p.stock - 1 } : p));
                onAddToCart(product);
            } else {
                addAlert('Organic transaction failed.', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (products.length === 0) return null;

    return (
        <div className="bg-success-subtle py-5" id="green-revolution">
            <div className="container px-4">
                <div id="organicAlerts" className="mb-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className={`alert alert-${alert.type} alert-dismissible`} role="alert">
                            {alert.message}
                        </div>
                    ))}
                </div>
                <h2 className="pb-2 border-bottom border-success text-success fw-bold">The Green Revolution 🌱</h2>
                <div className="row g-4 py-4 row-cols-1 row-cols-lg-3">
                    {products.map((product, index) => {
                        const ecoImages = [
                            'https://images.unsplash.com/photo-1518531933067-c838169ee249?auto=format&fit=crop&q=80&w=400&h=200',
                            'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&q=80&w=400&h=200'
                        ];
                        const imgSrc = ecoImages[index % 2];
                        const stockClass = product.stock > 0 ? 'text-success' : 'text-danger';

                        return (
                            <div className="col" key={product.id}>
                                <div className="card h-100 shadow border-success text-bg-light">
                                    <img 
                                        src={imgSrc} 
                                        className="card-img-top" 
                                        alt="Eco-friendly packaging" 
                                        style={{ height: '200px', objectFit: 'cover' }}
                                    />
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h5 className="card-title text-success mb-0">{product.name}</h5>
                                            <span className="badge rounded-pill bg-success shadow-sm">Bio-Certified</span>
                                        </div>
                                        <p className="card-text text-dark">{product.description || 'Sustainably sourced agricultural bio-product.'}</p>
                                        <p className="card-text"><small className={`${stockClass} fw-bold`}>In Stock ({product.stock})</small></p>
                                    </div>
                                    <div className="card-footer bg-transparent border-success p-3 text-center">
                                        <button className="btn btn-success fw-bold w-100 shadow-sm" onClick={() => buyProduct(product)} disabled={product.stock <= 0}>
                                            Add Organic Form — ${product.price}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GreenRevolution;
