import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Product } from '../types/product';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.getProducts().then(({ data, error: err }) => {
      if (cancelled) return;
      setLoading(false);
      if (err) setError(err);
      else if (data) setProducts(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refetch = () => {
    setLoading(true);
    setError(null);
    api.getProducts().then(({ data, error: err }) => {
      setLoading(false);
      if (err) setError(err);
      else if (data) setProducts(data);
    });
  };

  return { products, loading, error, refetch };
}
