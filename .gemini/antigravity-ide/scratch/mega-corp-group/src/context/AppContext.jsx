  import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const AppContext = createContext();

// Products are now stored in Supabase database - no hardcoded fallback

const PRE_SEEDED_USERS = [
  {
    name: 'System Administrator',
    email: 'princelouisprince@gmail.com',
    password: 'Louis123',
    role: 'admin'
  }
];

export const AppContextProvider = ({ children }) => {
  // Products
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Users Database
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('mega_corp_users');
    const loadedUsers = saved ? JSON.parse(saved) : PRE_SEEDED_USERS;
    // Ensure admin user always exists
    const adminExists = loadedUsers.some(u => u.email === PRE_SEEDED_USERS[0].email);
    if (!adminExists) {
      return [...loadedUsers, PRE_SEEDED_USERS[0]];
    }
    return loadedUsers;
  });

  // Current User Session
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mega_corp_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Shopping Cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('mega_corp_cart_v2');
    return saved ? JSON.parse(saved) : [];
  });

  // UI States
  const [view, setView] = useState('home'); // home, shop, admin
  const [adminView, setAdminView] = useState('overview'); // overview, products, orders, customers, inventory, cms, media, analytics, notifications, settings
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // login, signup
  const [cartOpen, setCartOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('mega_corp_dark_mode') === 'true';
  });

  // Fetch products directly from Supabase DB (no local fallback)
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      
      try {
        if (!supabase) {
          throw new Error('Supabase client is not initialized. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.');
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const transformedProducts = data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: parseFloat(p.price),
          category: p.category,
          image: p.image,
          images: p.images || [],
          stock: p.stock || 0,
          status: p.status || 'Available',
          featured: p.featured || false,
          sku: p.sku,
          discountPrice: p.discount_price ? parseFloat(p.discount_price) : '',
          ingredients: p.ingredients
        }));
        
        setProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductsError(error.message);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    
    fetchProducts();
    
    // Set up real-time subscription
    let subscription;
    if (supabase) {
      subscription = supabase
        .channel('products-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
          fetchProducts();
        })
        .subscribe();
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('mega_corp_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('mega_corp_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('mega_corp_session');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mega_corp_cart_v2', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
      localStorage.setItem('mega_corp_dark_mode', String(darkMode));
    }
  }, [darkMode]);

  // Auth Handlers (with backend Supabase Auth sync)
  const login = async (email, password) => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (foundUser) {
      const sessionUser = { name: foundUser.name, email: foundUser.email, role: foundUser.role };
      
      if (supabase) {
        try {
          // Attempt to log in to Supabase
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) {
            console.warn('Supabase login failed, trying automatic signup...', error.message);
            // If the user doesn't exist in Supabase auth yet, sign them up automatically
            const { error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: foundUser.name,
                  role: foundUser.role
                }
              }
            });
            if (!signUpError) {
              await supabase.auth.signInWithPassword({ email, password });
            } else {
              console.error('Supabase auto signup failed:', signUpError.message);
            }
          }
        } catch (err) {
          console.error('Supabase auth login error:', err);
        }
      }
      
      setUser(sessionUser);
      setAuthModalOpen(false);
      return { success: true, user: sessionUser };
    }
    return { success: false, error: 'Invalid email or password.' };
  };

  const signup = async (name, email, password) => {
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'Email already registered.' };
    }
    
    if (supabase) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: 'customer'
            }
          }
        });
        if (error) {
          console.error('Supabase signup failed:', error.message);
          return { success: false, error: error.message };
        }
      } catch (err) {
        console.error('Supabase signup error:', err);
        return { success: false, error: err.message };
      }
    }
    
    const newUser = { name, email, password, role: 'customer' };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    setUser({ name: newUser.name, email: newUser.email, role: newUser.role });
    setAuthModalOpen(false);
    return { success: true };
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    setUser(null);
    setCart([]);
    setView('home');
  };

  // Cart Handlers
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.id !== productId);
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
    } else {
      setCart(prev =>
        prev.map(item => (item.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Admin Handlers
  const addProduct = async (newProduct) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Cannot add product.');
    }
    try {
      // Add to Supabase
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          category: newProduct.category,
          image: newProduct.image,
          images: newProduct.images || [],
          stock: newProduct.stock || 0,
          status: newProduct.status || 'Available',
          featured: newProduct.featured || false,
          sku: newProduct.sku,
          discount_price: newProduct.discountPrice || null,
          ingredients: newProduct.ingredients
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Real-time subscription will handle the update
      return data;
    } catch (error) {
      console.error('Error adding product:', error);
      setProductsError(error.message);
      throw error;
    }
  };

  const updateProduct = async (productId, updatedProduct) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Cannot update product.');
    }
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: updatedProduct.price,
          category: updatedProduct.category,
          image: updatedProduct.image,
          images: updatedProduct.images || [],
          stock: updatedProduct.stock,
          status: updatedProduct.status,
          featured: updatedProduct.featured,
          sku: updatedProduct.sku,
          discount_price: updatedProduct.discountPrice || null,
          ingredients: updatedProduct.ingredients
        })
        .eq('id', productId);
      
      if (error) throw error;
      
      // Real-time subscription will handle the update
    } catch (error) {
      console.error('Error updating product:', error);
      setProductsError(error.message);
      throw error;
    }
  };

  const deleteProduct = async (productId) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Cannot delete product.');
    }
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      // Always remove from cart
      setCart(prev => prev.filter(item => item.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      setProductsError(error.message);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        productsLoading,
        productsError,
        user,
        cart,
        view,
        setView,
        adminView,
        setAdminView,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        cartOpen,
        setCartOpen,
        darkMode,
        toggleDarkMode,
        login,
        signup,
        logout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addProduct,
        updateProduct,
        deleteProduct
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
