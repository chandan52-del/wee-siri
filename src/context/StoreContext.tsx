import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Product, Category, StoreSettings, FilterState, PageType, PolicyTab, CustomerUser } from '../types';
import { recordCustomerLoginInSupabase, getSupabaseClient } from '../utils/supabase';
import { apiPath, safeFetchJson } from '../utils/api';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  loading: boolean;
  error: string | null;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: (partial: Partial<FilterState>) => void;
  resetFilters: () => void;
  // Navigation
  currentPage: PageType;
  currentProductId: string | null;
  currentCategorySlug: string | null;
  policyTab: PolicyTab;
  navigateTo: (
    page: PageType,
    params?: { productId?: string; categorySlug?: string; policyTab?: PolicyTab }
  ) => void;
  // Notifications
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Admin Authentication
  isAdmin: boolean;
  adminToken: string | null;
  authError: string | null;
  loginAdmin: (password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  changeAdminPassword: (newPassword: string) => Promise<boolean>;
  getCustomerLogins: () => Promise<any[]>;
  getSupabaseSchemaSql: () => Promise<string>;
  // CRUD Operations
  addProduct: (product: Partial<Product>) => Promise<Product | null>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  addCategory: (category: Partial<Category>) => Promise<Category | null>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;
  uploadImage: (base64Data: string, filename: string) => Promise<string | null>;
  refreshData: () => Promise<void>;
  // Wishlist
  wishlistIds: string[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
  // Customer Authentication (Google + Supabase)
  customerUser: CustomerUser | null;
  isCustomerLoggedIn: boolean;
  intendedPage: PageType;
  setIntendedPage: (page: PageType) => void;
  loginCustomerWithGoogle: (profile: {
    email: string;
    name?: string;
    avatarUrl?: string;
    id?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logoutCustomer: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
  storeName: 'SIRI',
  tagline: 'Premium Quality Shopping, Direct WhatsApp Ordering',
  description: 'Explore exclusive collections by SIRI. Browse, choose your favorites, and place hassle-free orders directly via WhatsApp.',
  currencySymbol: '₹',
  currencyCode: 'INR',
  whatsappNumber: '917349095032',
  whatsappPrefillGreeting: 'Hello SIRI! I am interested in ordering the following product.',
  phone: '+91 73490 95032',
  email: 'bmc419490@gmail.com',
  address: 'Bangalore, Karnataka, India',
  announcementText: 'Welcome to SIRI — Direct WhatsApp Ordering Available | Fast & Personal Support',
  heroTitle: 'Welcome to SIRI — Elevate Your Shopping',
  heroSubtitle: 'Discover hand-picked collections curated for elegance, everyday style, and uncompromising quality. Direct WhatsApp assistance and instant order processing.',
  heroButtonText: 'Browse Collections',
  heroImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
  socialLinks: {
    instagram: 'https://www.instagram.com/cc__.creations?dlrf=MW90dnNmbThpeTg2aQ==',
    facebook: 'https://facebook.com/siri.store',
    twitter: 'https://twitter.com/siri_store',
    youtube: 'https://youtube.com/@siri_store',
  },
  aboutText: 'Welcome to SIRI. We bring curated high-quality products directly to you without complicated checkout procedures or payment gateway hurdles. Connect with us directly on WhatsApp to order, ask questions, and receive personalized assistance.',
};

const initialFilters: FilterState = {
  search: '',
  categoryId: '',
  minPrice: undefined,
  maxPrice: undefined,
  featuredOnly: false,
  trendingOnly: false,
  newArrivalsOnly: false,
  discountOnly: false,
  inStockOnly: false,
  sort: 'newest',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation state initialized directly from URL
  const [currentPage, setCurrentPage] = useState<PageType>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('page') as PageType) || 'home';
    } catch {
      return 'home';
    }
  });

  const [currentProductId, setCurrentProductId] = useState<string | null>(() => {
    try {
      return new URLSearchParams(window.location.search).get('product') || null;
    } catch {
      return null;
    }
  });

  const [currentCategorySlug, setCurrentCategorySlug] = useState<string | null>(() => {
    try {
      return new URLSearchParams(window.location.search).get('category') || null;
    } catch {
      return null;
    }
  });

  const [policyTab, setPolicyTab] = useState<PolicyTab>(() => {
    try {
      return (new URLSearchParams(window.location.search).get('tab') as PolicyTab) || 'privacy';
    } catch {
      return 'privacy';
    }
  });

  // Filters state initialized from URL category if present
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const cat = new URLSearchParams(window.location.search).get('category');
      return cat ? { ...initialFilters, categoryId: cat } : initialFilters;
    } catch {
      return initialFilters;
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Admin auth
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('siri_admin_token');
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Wishlist state (stored locally in localStorage)
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('siri_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse wishlist from localStorage', e);
    }
    return [];
  });

  // Sync wishlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('siri_wishlist', JSON.stringify(wishlistIds));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage', e);
    }
  }, [wishlistIds]);

  // Customer Authentication state (Google + Supabase)
  const [customerUser, setCustomerUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('siri_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [intendedPage, setIntendedPage] = useState<PageType>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('page') as PageType;
      if (p && p !== 'login' && p !== 'account' && p !== 'admin-login' && p !== 'admin-dashboard') {
        return p;
      }
    } catch {}
    return 'home';
  });

  const [intendedParams, setIntendedParams] = useState<
    { productId?: string; categorySlug?: string; policyTab?: PolicyTab } | undefined
  >(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const prodId = params.get('product') || undefined;
      const cat = params.get('category') || undefined;
      const tab = (params.get('tab') as PolicyTab) || undefined;
      if (prodId || cat || tab) {
        return { productId: prodId, categorySlug: cat, policyTab: tab };
      }
    } catch {}
    return undefined;
  });

  // Keep references so callbacks and listeners don't require them as dependencies
  const customerUserRef = useRef<CustomerUser | null>(customerUser);
  customerUserRef.current = customerUser;

  const intendedPageRef = useRef<PageType>(intendedPage);
  intendedPageRef.current = intendedPage;

  const intendedParamsRef = useRef(intendedParams);
  intendedParamsRef.current = intendedParams;

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        if (exists) {
          showToast('Removed from your Wishlist', 'info');
          return prev.filter((id) => id !== productId);
        } else {
          showToast('Saved to your Wishlist ❤️', 'success');
          return [...prev, productId];
        }
      });
    },
    [showToast]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        if (!prev.includes(productId)) return prev;
        showToast('Removed from your Wishlist', 'info');
        return prev.filter((id) => id !== productId);
      });
    },
    [showToast]
  );

  const clearWishlist = useCallback(() => {
    setWishlistIds([]);
    showToast('Wishlist cleared', 'info');
  }, [showToast]);

  const navigateTo = useCallback(
    (
      page: PageType,
      params?: { productId?: string; categorySlug?: string; policyTab?: PolicyTab }
    ) => {
      // If customer is not authenticated and attempts to visit a protected shopping page,
      // remember their intended page so they return to it immediately upon Google sign-in
      if (
        !customerUserRef.current &&
        page !== 'login' &&
        page !== 'account' &&
        page !== 'admin-login' &&
        page !== 'admin-dashboard'
      ) {
        setIntendedPage(page);
        setIntendedParams(params);
      }

      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      const url = new URL(window.location.href);
      url.searchParams.set('page', page);

      if (params?.productId) {
        setCurrentProductId(params.productId);
        url.searchParams.set('product', params.productId);
      } else {
        url.searchParams.delete('product');
      }

      if (params?.categorySlug) {
        setCurrentCategorySlug(params.categorySlug);
        url.searchParams.set('category', params.categorySlug);
        setFilters((prev) => ({ ...prev, categoryId: params.categorySlug || '' }));
      } else if (page !== 'products') {
        url.searchParams.delete('category');
      }

      if (params?.policyTab) {
        setPolicyTab(params.policyTab);
        url.searchParams.set('tab', params.policyTab);
      } else {
        url.searchParams.delete('tab');
      }

      window.history.pushState({}, '', url.toString());
    },
    []
  );

  // Customer Login with Google and Supabase Storage
  const loginCustomerWithGoogle = useCallback(
    async (profile: { email: string; name?: string; avatarUrl?: string; id?: string }) => {
      const cleanEmail = profile.email.toLowerCase().trim();
      const fallbackName = cleanEmail.split('@')[0];
      const name = profile.name || (fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1));
      const id = profile.id || `google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
      const avatarUrl =
        profile.avatarUrl ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=059669,047857`;

      const prevCount = customerUserRef.current?.email === cleanEmail ? (customerUserRef.current.loginCount || 1) + 1 : 1;
      const userRecord: CustomerUser = {
        id,
        email: cleanEmail,
        name,
        avatarUrl,
        provider: 'google',
        lastSignInAt: new Date().toISOString(),
        loginCount: prevCount,
      };

      try {
        // 1. Persist to server database (Node.js/Express/Netlify)
        await safeFetchJson(apiPath('/api/customer/login-google'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userRecord),
        }).catch((err) => console.warn('Server sync note:', err));

        // 2. Persist to Supabase database (free tier)
        const sbRes = await recordCustomerLoginInSupabase(userRecord);

        // 3. Save locally in localStorage for persistent session
        localStorage.setItem('siri_customer_user', JSON.stringify(userRecord));
        customerUserRef.current = userRecord;
        setCustomerUser(userRecord);

        showToast(`Welcome back, ${name}! Signed in with Google`, 'success');

        // Redirect to intended page or home
        const destPage =
          intendedPageRef.current && intendedPageRef.current !== 'login'
            ? intendedPageRef.current
            : 'home';
        const destParams = intendedParamsRef.current;
        setIntendedPage('home');
        setIntendedParams(undefined);
        navigateTo(destPage, destParams);

        return { success: true, message: 'Signed in with Google successfully' };
      } catch (err: any) {
        console.error('Customer login error:', err);
        showToast('Login notice: ' + (err?.message || 'Authentication in progress'), 'error');
        return { success: false, message: err?.message || 'Login failed' };
      }
    },
    [navigateTo, showToast]
  );

  const loginCustomerWithGoogleRef = useRef(loginCustomerWithGoogle);
  loginCustomerWithGoogleRef.current = loginCustomerWithGoogle;

  const logoutCustomer = useCallback(async () => {
    localStorage.removeItem('siri_customer_user');
    customerUserRef.current = null;
    setCustomerUser(null);
    setIntendedPage('home');
    setIntendedParams(undefined);
    const sbClient = getSupabaseClient();
    if (sbClient) {
      try {
        await sbClient.auth.signOut();
      } catch (e) {
        console.warn('Supabase signOut note:', e);
      }
    }
    showToast('Signed out of Google account', 'info');
    navigateTo('login');
  }, [navigateTo, showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch store data
  const fetchData = useCallback(async (overrideToken?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const activeToken = overrideToken !== undefined ? overrideToken : adminToken;
      const headers: Record<string, string> = {};
      if (activeToken) {
        headers['Authorization'] = `Bearer ${activeToken}`;
      }

      // Fetch settings safely
      const settingsRes = await safeFetchJson<Partial<StoreSettings>>(apiPath('/api/settings'), { headers });
      if (settingsRes.ok && settingsRes.data && typeof settingsRes.data === 'object') {
        setSettings({ ...defaultSettings, ...settingsRes.data });
      }

      // Fetch categories safely
      const catRes = await safeFetchJson<Category[]>(apiPath('/api/categories'), { headers });
      if (catRes.ok && Array.isArray(catRes.data)) {
        setCategories(catRes.data);
      }

      // Fetch products safely
      const prodUrl = activeToken ? apiPath('/api/products?includeHidden=true') : apiPath('/api/products');
      const prodRes = await safeFetchJson<Product[]>(prodUrl, { headers });
      if (prodRes.ok && Array.isArray(prodRes.data)) {
        setProducts(prodRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load store data:', err);
      setError('Failed to connect to backend server. Operating in offline mode.');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  // Check admin session if token exists
  useEffect(() => {
    if (!adminToken) return;
    safeFetchJson<{ authenticated: boolean; role?: string }>(
      apiPath('/api/admin/verify'),
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    )
      .then((res) => {
        if (res.ok && res.data?.authenticated === true && res.data?.role === 'administrator') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setAdminToken(null);
          localStorage.removeItem('siri_admin_token');
        }
      })
      .catch(() => {
        setIsAdmin(false);
        setAdminToken(null);
        localStorage.removeItem('siri_admin_token');
      });
  }, [adminToken]);

  // Load store data once on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Browser back/forward history listener (runs once on mount)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const page = (params.get('page') as PageType) || 'home';
        const prodId = params.get('product');
        const cat = params.get('category');
        const tab = (params.get('tab') as PolicyTab) || 'privacy';

        setCurrentPage(page);
        setCurrentProductId(prodId);
        setCurrentCategorySlug(cat);
        setPolicyTab(tab);
        if (cat) {
          setFilters((prev) => ({ ...prev, categoryId: cat }));
        }
      } catch (e) {
        console.warn('popstate note', e);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Supabase auth & OAuth redirect handler (runs once on mount)
  useEffect(() => {
    // Check for OAuth error in URL query or hash
    try {
      const params = new URLSearchParams(window.location.search);
      const hashStr = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      const oauthError =
        params.get('error_description') ||
        params.get('error') ||
        hashParams.get('error_description') ||
        hashParams.get('error');

      if (oauthError) {
        showToast(`Google Sign-In: ${decodeURIComponent(oauthError)}`, 'error');
        const cleanUrl =
          window.location.pathname + (params.get('page') ? `?page=${params.get('page')}` : '');
        window.history.replaceState(null, '', cleanUrl);
      }
    } catch (e) {
      console.warn('OAuth URL note:', e);
    }

    // Supabase auth session listener
    const sbClient = getSupabaseClient();
    if (!sbClient) return;

    let authSubscription: { unsubscribe: () => void } | null = null;

    sbClient.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !customerUserRef.current) {
        const u = session.user;
        const email = (u.email || '').toLowerCase().trim();
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Customer');
        const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture;
        customerUserRef.current = {
          id: u.id,
          email,
          name,
          avatarUrl,
          provider: 'google',
          lastSignInAt: new Date().toISOString(),
          loginCount: 1,
        };
        loginCustomerWithGoogleRef.current({
          id: u.id,
          email,
          name,
          avatarUrl,
        });
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    const { data } = sbClient.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        const u = session.user;
        const email = (u.email || '').toLowerCase().trim();
        // Prevent duplicate authentication loops
        if (customerUserRef.current && customerUserRef.current.email === email) {
          return;
        }
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (email ? email.split('@')[0] : 'Customer');
        const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture;
        customerUserRef.current = {
          id: u.id,
          email,
          name,
          avatarUrl,
          provider: 'google',
          lastSignInAt: new Date().toISOString(),
          loginCount: 1,
        };
        await loginCustomerWithGoogleRef.current({
          id: u.id,
          email,
          name,
          avatarUrl,
        });
        if (window.location.hash || window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });
    authSubscription = data.subscription;

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const updateFilter = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  // Admin Auth Login
  const loginAdmin = async (password: string): Promise<boolean> => {
    const trimmed = (password || '').trim();
    if (!trimmed) {
      const msg = 'Please enter your administrator password';
      setAuthError(msg);
      showToast(msg, 'error');
      return false;
    }

    setAuthError(null);
    try {
      const response = await safeFetchJson<{ success: boolean; token?: string; message?: string }>(
        apiPath('/api/admin/login'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: trimmed }),
        }
      );

      if (response.ok && response.data?.success && response.data?.token) {
        const token = response.data.token;
        setAdminToken(token);
        localStorage.setItem('siri_admin_token', token);
        setIsAdmin(true);
        setAuthError(null);
        fetchData(token);
        showToast('Admin session unlocked successfully!', 'success');
        return true;
      } else {
        const errorMsg =
          response.data?.message ||
          response.error ||
          'Invalid administrator password. Please check your credentials.';
        setAuthError(errorMsg);
        showToast(errorMsg, 'error');
        return false;
      }
    } catch (err: any) {
      const errorMsg = 'Error connecting to authentication service: ' + (err?.message || 'Network error');
      setAuthError(errorMsg);
      showToast(errorMsg, 'error');
      return false;
    }
  };

  const logoutAdmin = () => {
    if (adminToken) {
      safeFetchJson(apiPath('/api/admin/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    }
    setAdminToken(null);
    setIsAdmin(false);
    setAuthError(null);
    localStorage.removeItem('siri_admin_token');
    fetchData(null);
    showToast('Admin logged out successfully', 'info');
    navigateTo('home');
  };

  const changeAdminPassword = async (newPassword: string): Promise<boolean> => {
    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>(
        apiPath('/api/admin/change-password'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ newPassword }),
        }
      );
      if (res.ok && res.data?.success) {
        showToast('Admin password changed successfully!', 'success');
        return true;
      } else {
        showToast(res.data?.error || res.error || 'Failed to change password', 'error');
        return false;
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to change password', 'error');
      return false;
    }
  };

  const getCustomerLogins = useCallback(async (): Promise<any[]> => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
      const res = await safeFetchJson<any[]>(apiPath('/api/customer/logins'), { headers });
      if (res.ok && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch {
      return [];
    }
  }, [adminToken]);

  const getSupabaseSchemaSql = useCallback(async (): Promise<string> => {
    try {
      const headers: Record<string, string> = {};
      if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
      const res = await fetch(apiPath('/api/supabase/schema-sql'), { headers });
      if (res.ok) {
        return await res.text();
      }
      return '';
    } catch {
      return '';
    }
  }, [adminToken]);

  // CRUD Operations
  const addProduct = async (productData: Partial<Product>): Promise<Product | null> => {
    try {
      const res = await safeFetchJson<Product>(apiPath('/api/products'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(productData),
      });
      if (res.ok && res.data) {
        const newProduct = res.data;
        setProducts((prev) => [newProduct, ...prev]);
        showToast(`Product "${newProduct.name}" created successfully!`, 'success');
        return newProduct;
      } else {
        showToast(res.error || 'Failed to add product', 'error');
        return null;
      }
    } catch (err: any) {
      showToast('Error adding product: ' + err.message, 'error');
      return null;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product | null> => {
    try {
      const res = await safeFetchJson<Product>(apiPath(`/api/products/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(productData),
      });
      if (res.ok && res.data) {
        const updated = res.data;
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
        showToast(`Product "${updated.name}" updated!`, 'success');
        return updated;
      } else {
        showToast(res.error || 'Failed to update product', 'error');
        return null;
      }
    } catch (err: any) {
      showToast('Error updating product: ' + err.message, 'error');
      return null;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await safeFetchJson<{ success: boolean }>(apiPath(`/api/products/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('Product deleted successfully', 'success');
        return true;
      } else {
        showToast(res.error || 'Failed to delete product', 'error');
        return false;
      }
    } catch (err: any) {
      showToast('Error deleting product: ' + err.message, 'error');
      return false;
    }
  };

  const addCategory = async (categoryData: Partial<Category>): Promise<Category | null> => {
    try {
      const res = await safeFetchJson<Category>(apiPath('/api/categories'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(categoryData),
      });
      if (res.ok && res.data) {
        const newCat = res.data;
        setCategories((prev) => [...prev, newCat]);
        showToast(`Category "${newCat.name}" added!`, 'success');
        return newCat;
      } else {
        showToast(res.error || 'Failed to add category', 'error');
        return null;
      }
    } catch (err: any) {
      showToast('Error adding category: ' + err.message, 'error');
      return null;
    }
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category | null> => {
    try {
      const res = await safeFetchJson<Category>(apiPath(`/api/categories/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(categoryData),
      });
      if (res.ok && res.data) {
        const updated = res.data;
        setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
        fetchData();
        showToast(`Category "${updated.name}" updated!`, 'success');
        return updated;
      } else {
        showToast(res.error || 'Failed to update category', 'error');
        return null;
      }
    } catch (err: any) {
      showToast('Error updating category: ' + err.message, 'error');
      return null;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      const res = await safeFetchJson<{ success: boolean }>(apiPath(`/api/categories/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('Category deleted successfully', 'success');
        return true;
      } else {
        showToast(res.error || 'Failed to delete category', 'error');
        return false;
      }
    } catch (err: any) {
      showToast('Error deleting category: ' + err.message, 'error');
      return false;
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const res = await safeFetchJson<{ success: boolean; settings: StoreSettings }>(
        apiPath('/api/settings'),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(newSettings),
        }
      );
      if (res.ok && res.data?.settings) {
        setSettings((prev) => ({ ...prev, ...res.data!.settings }));
        showToast('Store settings saved successfully!', 'success');
        return true;
      } else {
        showToast(res.error || 'Failed to save settings', 'error');
        return false;
      }
    } catch (err: any) {
      showToast('Error saving settings: ' + err.message, 'error');
      return false;
    }
  };

  const uploadImage = async (base64Data: string, filename: string): Promise<string | null> => {
    try {
      const res = await safeFetchJson<{ success: boolean; url: string }>(apiPath('/api/upload'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ data: base64Data, filename }),
      });
      if (res.ok && res.data?.url) {
        showToast('Image uploaded successfully!', 'success');
        return res.data.url;
      } else {
        showToast(res.error || 'Image upload failed', 'error');
        return null;
      }
    } catch (err: any) {
      showToast('Upload error: ' + err.message, 'error');
      return null;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        settings,
        loading,
        error,
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        currentPage,
        currentProductId,
        currentCategorySlug,
        policyTab,
        navigateTo,
        toasts,
        showToast,
        removeToast,
        isAdmin,
        adminToken,
        authError,
        loginAdmin,
        logoutAdmin,
        changeAdminPassword,
        getCustomerLogins,
        getSupabaseSchemaSql,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        updateSettings,
        uploadImage,
        refreshData: fetchData,
        // Wishlist
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        // Customer Google Auth & Supabase
        customerUser,
        isCustomerLoggedIn: Boolean(customerUser),
        intendedPage,
        setIntendedPage,
        loginCustomerWithGoogle,
        logoutCustomer,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
