import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WishlistContextType {
  items: string[];
  toggle: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('furniture-wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('furniture-wishlist', JSON.stringify(items));
  }, [items]);

  const toggle = (productId: string) => {
    setItems((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isWishlisted = (productId: string) => items.includes(productId);

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, totalItems: items.length }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
