import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { API_CONFIG } from '@/config/apiConfig';


export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_CONFIG.products.list);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
}
