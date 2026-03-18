export interface Product {
    id: string;
    name: string;
    sku: string;
    description: string;
    stock: number;
    price: number;
    technicalName?: string;
    expiryDate?: string;
    photoUrl?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface CheckoutRequestDto {
    customerId: string;
    items: { productId: string; quantity: number }[];
}

export interface StockAdjustmentDto {
    productId: string;
    quantityToAdjust: number;
    reason: string;
}

export interface OrderItem {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface Order {
    id: string;
    customerId: string;
    items: OrderItem[];
    status: string;
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}
