export interface Product {
    id: string;
    name: string;
    description: string;
    stock: number;
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
