import { apiClient } from './client';

export interface CheckoutRequest {
  productId: string;
  quantity?: number;
}

export interface CheckoutResponse {
  success: boolean;
  orderId?: string;
  message?: string;
}

export async function checkout(productId: string, quantity: number = 1): Promise<CheckoutResponse> {
  return apiClient.post<CheckoutResponse>('/checkout', {
    productId,
    quantity,
  });
}
