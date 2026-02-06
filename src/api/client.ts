const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }
    if (!res.ok) {
      const message =
        (data as { error?: string })?.error ?? res.statusText ?? `Request failed (${res.status})`;
      return { error: message, status: res.status };
    }
    return { data: data as T, status: res.status };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Network error';
    return { error: message, status: 0 };
  }
}

export const api = {
  getProducts: () => request<import('../types/product').Product[]>(`/products`),
  checkout: (productId: string, quantity?: number) =>
    request<{ message: string; product: import('../types/product').Product }>(`/checkout`, {
      method: 'POST',
      body: JSON.stringify({ productId, quantity: quantity ?? 1 }),
    }),
};
