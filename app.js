const API_BASE_URL = 'http://localhost:5038'; // Update this port if your backend runs on a different port

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();

    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('searchInput').value;
            fetchProducts(query);
        });
    }
});

async function fetchProducts(searchQuery = '') {
    const url = searchQuery 
        ? `${API_BASE_URL}/api/products?search=${encodeURIComponent(searchQuery)}`
        : `${API_BASE_URL}/api/products`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.status}`);
        }
        
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        showAlert('Failed to load products. Please ensure the backend is running.', 'danger');
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    if (!products || products.length === 0) {
        grid.innerHTML = '<div class="col-12"><p class="text-center text-muted">No products found.</p></div>';
        return;
    }

    products.forEach(product => {
        const stockClass = product.stock > 0 ? 'text-success' : 'text-danger';
        const stockText = product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock';
        
        const cardHtml = `
            <div class="col">
                <div class="card h-100 shadow-sm border-secondary text-bg-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title text-success mb-0">${product.name}</h5>
                            <span class="badge rounded-pill text-bg-secondary">ID: ${product.id.substring(0,8)}...</span>
                        </div>
                        <p class="card-text">${product.description || 'No description available'}</p>
                        <p class="card-text"><small class="${stockClass} fw-bold">${stockText}</small></p>
                    </div>
                    <div class="card-footer bg-transparent border-secondary text-center">
                        <button class="btn btn-outline-success w-100" onclick="buyProduct('${product.id}')" ${product.stock <= 0 ? 'disabled' : ''}>Buy Now</button>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHtml;
    });
}

async function buyProduct(productId) {
    const checkoutDto = {
        customerId: "Customer-123", // Dummy ID for now
        items: [
            {
                productId: productId,
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
            showAlert('Order placed successfully! Thank you for your purchase.', 'success');
            // Refresh products to update stock
            fetchProducts(document.getElementById('searchInput').value);
        } else if (response.status === 409) {
            showAlert('Conflict: Product is out of stock or insufficient quantity.', 'warning');
        } else if (response.status === 404) {
            showAlert('Error: Product not found.', 'danger');
        } else if (response.status === 400) {
            // Note: If model validation fails, it might be 400
            const errData = await response.json();
            showAlert(`Validation Error: ${errData.title || errData.message || 'Invalid request'}`, 'danger');
        } else {
            showAlert('An unexpected error occurred during checkout.', 'danger');
        }
    } catch (error) {
        console.error('Error during checkout:', error);
        showAlert('Checkout failed. Please ensure the backend is running.', 'danger');
    }
}

function showAlert(message, type) {
    const alertContainer = document.getElementById('alertContainer');
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    alertContainer.innerHTML = alertHtml;
    
    // Auto clear after 5 seconds
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}
