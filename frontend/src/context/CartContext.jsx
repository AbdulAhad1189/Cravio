import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../api/axios';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const EMPTY_CART = { items: [], total: 0, item_count: 0, restaurant: null };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'customer') {
      setCart(EMPTY_CART);
      return;
    }
    setCartLoading(true);
    try {
      const res = await cartAPI.get();
      setCart(res.data.cart || EMPTY_CART);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = useCallback(async (food_id, quantity = 1) => {
    const res = await cartAPI.addItem(food_id, quantity);
    setCart(res.data.cart);
    return res.data.cart;
  }, []);

  const updateItem = useCallback(async (food_id, quantity) => {
    const res = await cartAPI.updateItem(food_id, quantity);
    setCart(res.data.cart);
  }, []);

  const removeItem = useCallback(async (food_id) => {
    const res = await cartAPI.removeItem(food_id);
    setCart(res.data.cart);
  }, []);

  const clearCart = useCallback(async () => {
    await cartAPI.clear();
    setCart(EMPTY_CART);
  }, []);

  const itemCount = cart?.item_count || 0;

  return (
    <CartContext.Provider value={{ cart, cartLoading, fetchCart, addItem, updateItem, removeItem, clearCart, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
