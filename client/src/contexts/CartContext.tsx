import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedColor: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, color: string) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, color: string) => {
    setItems(current => {
      const existing = current.find(item => item.id === product.id && item.selectedColor === color);
      
      if (existing) {
        return current.map(item =>
          item.cartId === existing.cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, cartId: `${product.id}-${color}`, quantity: 1, selectedColor: color }];
    });
  };

  const removeFromCart = (cartId: string) => {
    setItems(current => current.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(current =>
      current.map(item =>
        item.cartId === cartId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  // Calculate using discount_price if available, else standard price
  const total = items.reduce((sum, item) => {
    const itemPrice = item.discount_price || item.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
