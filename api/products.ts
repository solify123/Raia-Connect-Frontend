import { apiClient } from './client';
import { Product } from '../types/Product';

export interface GetProductsParams {
  category?: string;
  search?: string;
}

export async function getProducts(params?: GetProductsParams): Promise<Product[]> {
  const queryParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([_, value]) => value !== undefined)
      ) as Record<string, string | number | boolean>
    : undefined;
  return apiClient.get<Product[]>('/products', { params: queryParams });
}
