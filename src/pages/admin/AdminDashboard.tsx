import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Category, StoreSettings } from '../../types';
import { Modal } from '../../components/ui/Modal';
import {
  Package,
  Layers,
  Settings,
  Database,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  KeyRound,
  Sparkles,
  TrendingUp,
  Tag,
  X,
  Phone,
  Image as ImageIcon,
  Instagram,
  Share2,
} from 'lucide-react';
import { cleanWhatsAppNumber, getWhatsAppUrl } from '../../utils/whatsapp';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    categories,
    settings,
    isAdmin,
    adminToken,
    logoutAdmin,
    navigateTo,
    showToast,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    uploadImage,
    changeAdminPassword,
    getCustomerLogins,
    getSupabaseSchemaSql,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'settings' | 'database'>('products');

  // Product Filter & Search in Admin
  const [productSearch, setProductSearch] = useState('');
  const [productCatFilter, setProductCatFilter] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'published' | 'hidden'>('all');

  // Product Editor Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    originalPrice: null,
    categoryId: '',
    categoryName: '',
    subcategory: '',
    images: [],
    specifications: {},
    features: [],
    sizes: [],
    colors: [],
    stockCount: 50,
    stockStatus: 'in_stock',
    isFeatured: false,
    isTrending: false,
    isNewArrival: true,
    status: 'published',
  });

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<Category>>({
    name: '',
    image: '',
    description: '',
  });

  // Delete Confirmation Modals
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'product' | 'category';
    id: string;
    name: string;
  } | null>(null);

  // Store Settings Form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({ ...settings });
  const [newAdminPassword, setNewAdminPassword] = useState('');

  // Helpers for Specifications & Features builder
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newSizeText, setNewSizeText] = useState('');
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase SQL copied state
  const [sqlCopied, setSqlCopied] = useState(false);
  const [sqlSchema, setSqlSchema] = useState('');
  const [customerLogins, setCustomerLogins] = useState<any[]>([]);

  // Fetch Supabase schema script and customer logins
  const fetchSqlSchema = async () => {
    try {
      const sql = await getSupabaseSchemaSql();
      setSqlSchema(sql);
    } catch {
      // Fallback
    }
  };

  const fetchCustomerLogins = async () => {
    try {
      const logins = await getCustomerLogins();
      setCustomerLogins(logins || []);
    } catch {
      // Fallback
    }
  };

  // If unauthorized, show login gate
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Restricted Admin Access</h2>
          <p className="text-sm text-slate-500">
            You must be authenticated as an authorized store administrator to view or modify store data.
          </p>
          <button
            onClick={() => navigateTo('admin-login')}
            className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Statistics
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const hiddenProducts = products.filter((p) => p.status === 'hidden').length;
  const outOfStockProducts = products.filter(
    (p) => p.stockStatus === 'out_of_stock' || (p.stockCount !== undefined && p.stockCount <= 0)
  ).length;

  // Filtered products in admin table
  const adminFilteredProducts = products.filter((p) => {
    if (productSearch) {
      const q = productSearch.toLowerCase();
      const match =
        p.name?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (productCatFilter && p.categoryId !== productCatFilter) return false;
    if (productStatusFilter === 'published' && p.status !== 'published') return false;
    if (productStatusFilter === 'hidden' && p.status !== 'hidden') return false;
    return true;
  });

  // Open Product Modal for Add
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProductFormData({
      name: '',
      description: '',
      shortDescription: '',
      price: 0,
      originalPrice: null,
      categoryId: categories[0]?.id || '',
      categoryName: categories[0]?.name || '',
      subcategory: '',
      images: [],
      specifications: {},
      features: [],
      sizes: [],
      colors: [],
      stockCount: 10,
      stockStatus: 'in_stock',
      isFeatured: false,
      isTrending: false,
      isNewArrival: true,
      status: 'published',
    });
    setIsProductModalOpen(true);
  };

  // Open Product Modal for Edit
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProductFormData({
      ...prod,
      images: prod.images ? [...prod.images] : [],
      specifications: prod.specifications ? { ...prod.specifications } : {},
      features: prod.features ? [...prod.features] : [],
      sizes: prod.sizes ? [...prod.sizes] : [],
      colors: prod.colors ? [...prod.colors] : [],
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productFormData.name || productFormData.price === undefined) {
      showToast('Product name and price are required', 'error');
      return;
    }

    const selectedCat = categories.find((c) => c.id === productFormData.categoryId);
    const payload = {
      ...productFormData,
      categoryName: selectedCat?.name || productFormData.categoryName || 'General',
      price: Number(productFormData.price),
      originalPrice: productFormData.originalPrice ? Number(productFormData.originalPrice) : null,
      stockCount: Number(productFormData.stockCount || 0),
    };

    if (editingProductId) {
      await updateProduct(editingProductId, payload);
    } else {
      await addProduct(payload);
    }
    setIsProductModalOpen(false);
  };

  // Toggle publish / hide directly from table
  const handleToggleProductStatus = async (prod: Product) => {
    const newStatus = prod.status === 'published' ? 'hidden' : 'published';
    await updateProduct(prod.id, { status: newStatus });
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.type === 'product') {
      await deleteProduct(deleteConfirmItem.id);
    } else if (deleteConfirmItem.type === 'category') {
      await deleteCategory(deleteConfirmItem.id);
    }
    setDeleteConfirmItem(null);
  };

  // Category Add / Edit
  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setCategoryFormData({
      name: '',
      image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
      description: '',
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCategoryFormData({ ...cat });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.name) {
      showToast('Category name is required', 'error');
      return;
    }
    if (editingCategoryId) {
      await updateCategory(editingCategoryId, categoryFormData);
    } else {
      await addCategory(categoryFormData);
    }
    setIsCategoryModalOpen(false);
  };

  // Handle Image File Upload (Base64 -> Server API)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image size exceeds 15MB limit', 'error');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const uploadedUrl = await uploadImage(base64Data, file.name);
      if (uploadedUrl) {
        setProductFormData((prev) => ({
          ...prev,
          images: [...(prev.images || []), uploadedUrl],
        }));
      }
      setUploadingImage(false);
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Add Image URL
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setProductFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  // Remove Image
  const handleRemoveImage = (index: number) => {
    setProductFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  // Specifications
  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setProductFormData((prev) => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [newSpecKey.trim()]: newSpecVal.trim(),
      },
    }));
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpec = (key: string) => {
    setProductFormData((prev) => {
      const copy = { ...(prev.specifications || {}) };
      delete copy[key];
      return { ...prev, specifications: copy };
    });
  };

  // Features
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setProductFormData((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeatureText.trim()],
    }));
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setProductFormData((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  // Sizes
  const handleAddSize = () => {
    if (!newSizeText.trim()) return;
    setProductFormData((prev) => ({
      ...prev,
      sizes: [...(prev.sizes || []), newSizeText.trim()],
    }));
    setNewSizeText('');
  };

  const handleRemoveSize = (index: number) => {
    setProductFormData((prev) => ({
      ...prev,
      sizes: (prev.sizes || []).filter((_, i) => i !== index),
    }));
  };

  // Colors
  const handleAddColor = () => {
    if (!newColorName.trim()) return;
    setProductFormData((prev) => ({
      ...prev,
      colors: [...(prev.colors || []), { name: newColorName.trim(), hex: newColorHex }],
    }));
    setNewColorName('');
  };

  const handleRemoveColor = (index: number) => {
    setProductFormData((prev) => ({
      ...prev,
      colors: (prev.colors || []).filter((_, i) => i !== index),
    }));
  };

  // Save Store Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(settingsForm);
  };

  // Change Admin Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 4) {
      showToast('Password must be at least 4 characters', 'error');
      return;
    }
    const ok = await changeAdminPassword(newAdminPassword);
    if (ok) setNewAdminPassword('');
  };

  // Copy Supabase SQL
  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setSqlCopied(true);
    showToast('Supabase SQL schema copied to clipboard!', 'success');
    setTimeout(() => setSqlCopied(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                SIRI Store Owner Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Live & Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your products, categories, store info, and WhatsApp direct ordering settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>View Live Store</span>
          </button>

          <button
            onClick={logoutAdmin}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Products</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalProducts}</div>
          <span className="text-[11px] text-slate-500">In database</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Published</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">{publishedProducts}</div>
          <span className="text-[11px] text-emerald-600">Visible to customers</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hidden / Draft</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-600">{hiddenProducts}</div>
          <span className="text-[11px] text-slate-500">Unpublished</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">Stock Alerts</span>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">{outOfStockProducts}</div>
          <span className="text-[11px] text-rose-500">Out of stock items</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">Categories</span>
          <div className="text-2xl sm:text-3xl font-black text-indigo-700">{categories.length}</div>
          <span className="text-[11px] text-indigo-500">Active departments</span>
        </div>
      </div>

      {/* Dashboard Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products Management</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Store & WhatsApp Settings</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('database');
            fetchSqlSchema();
            fetchCustomerLogins();
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'database'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database & Supabase Integration</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Action Row: Search, Category Filter, Status Filter, Add Button */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3 w-full flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search products by title or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category Filter */}
              <select
                value={productCatFilter}
                onChange={(e) => setProductCatFilter(e.target.value)}
                className="text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as any)}
                className="text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="hidden">Hidden Only</option>
              </select>
            </div>

            {/* Add Product Button */}
            <button
              onClick={handleOpenAddProduct}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Badges</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {adminFilteredProducts.map((prod) => {
                    const isPublished = prod.status === 'published';
                    const isOut =
                      prod.stockStatus === 'out_of_stock' || (prod.stockCount !== undefined && prod.stockCount <= 0);

                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Image + Title */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt={prod.name}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div className="max-w-xs">
                              <span className="font-bold text-slate-900 block truncate leading-snug">
                                {prod.name}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {prod.images?.length || 1} {prod.images?.length === 1 ? 'image' : 'images'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4 text-slate-600 font-semibold">
                          {prod.categoryName || 'General'}
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {settings.currencySymbol || '₹'}
                          {prod.price.toLocaleString('en-IN')}
                          {prod.originalPrice && prod.originalPrice > prod.price && (
                            <span className="block text-[11px] text-slate-400 line-through font-normal">
                              {settings.currencySymbol}
                              {prod.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${prod.stockCount ?? 20} in stock`}
                          </span>
                        </td>

                        {/* Badges */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {prod.isFeatured && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                                Featured
                              </span>
                            )}
                            {prod.isTrending && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-[10px] font-bold">
                                Trending
                              </span>
                            )}
                            {prod.isNewArrival && (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-[10px] font-bold">
                                New
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleProductStatus(prod)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                              isPublished
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                            }`}
                            title="Click to toggle publish/hidden status"
                          >
                            {isPublished ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Published</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                                <span>Hidden</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                setDeleteConfirmItem({
                                  type: 'product',
                                  id: prod.id,
                                  name: prod.name,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {adminFilteredProducts.length === 0 && (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    {products.length === 0 ? 'Your SIRI product catalog is currently empty' : 'No products matched your search or filters'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {products.length === 0
                      ? 'Add your first product to display it live on the customer website.'
                      : 'Try resetting your search query or category filter.'}
                  </p>
                  {products.length === 0 && (
                    <button
                      onClick={handleOpenAddProduct}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Product</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Manage Store Categories</h2>
              <p className="text-xs text-slate-500">
                Create and organize categories. Products assigned will appear automatically in them.
              </p>
            </div>

            <button
              onClick={handleOpenAddCategory}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-16/9 bg-slate-100 overflow-hidden">
                      <img
                        src={cat.image || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400'}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs">
                        {count} Products
                      </div>
                    </div>

                    <div className="p-5 space-y-1.5">
                      <h3 className="font-extrabold text-slate-900 text-base">{cat.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {cat.description || 'No description added.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-end gap-2 mt-4">
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirmItem({
                          type: 'category',
                          id: cat.id,
                          name: cat.name,
                        })
                      }
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STORE & WHATSAPP SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Store & WhatsApp Configurations</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update store name, contact numbers, WhatsApp business phone number, currency symbol, and home banners.
              </p>
            </div>

            {/* WhatsApp Business Configuration Section */}
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <MessageCircle className="w-5 h-5 fill-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Primary WhatsApp Business Ordering Number
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    WhatsApp Phone Number (with Country Code)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 917349095032 (no +, spaces, or hyphens)"
                    value={settingsForm.whatsappNumber}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, whatsappNumber: cleanWhatsAppNumber(e.target.value) })
                    }
                    className="w-full text-sm px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter country code followed by number without + sign (e.g. 91 for India, 1 for USA).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Test Click-to-Chat Link
                  </label>
                  <div className="flex items-center gap-2">
                    <a
                      href={getWhatsAppUrl(settingsForm.whatsappNumber, 'Test message from admin dashboard')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Test WhatsApp Connection</span>
                    </a>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    wa.me/{cleanWhatsAppNumber(settingsForm.whatsappNumber)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Order Message Initial Greeting
                </label>
                <input
                  type="text"
                  value={settingsForm.whatsappPrefillGreeting}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, whatsappPrefillGreeting: e.target.value })
                  }
                  className="w-full text-sm px-4 py-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* General Store Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Store Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.storeName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.currencySymbol}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })
                  }
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Customer Support Phone
                </label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Store Tagline
                </label>
                <input
                  type="text"
                  value={settingsForm.tagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Physical Hub / Warehouse Address
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Announcement Top Bar Message
                </label>
                <input
                  type="text"
                  value={settingsForm.announcementText}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, announcementText: e.target.value })
                  }
                  className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Hero Section Banner Settings */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Homepage Hero Banner Content
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Hero Headline
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroTitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroTitle: e.target.value })
                    }
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Hero Subtitle
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.heroSubtitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                    }
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Hero Background Image URL
                  </label>
                  <input
                    type="text"
                    value={settingsForm.heroImageUrl}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, heroImageUrl: e.target.value })
                    }
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Social Media Links & Profiles
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Connected accounts will display in the website footer and contact channels.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Instagram Profile URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/your-handle"
                      value={settingsForm.socialLinks?.instagram || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          socialLinks: {
                            ...settingsForm.socialLinks,
                            instagram: e.target.value,
                          },
                        })
                      }
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                    />
                    {settingsForm.socialLinks?.instagram && (
                      <a
                        href={settingsForm.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/your-page"
                    value={settingsForm.socialLinks?.facebook || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        socialLinks: {
                          ...settingsForm.socialLinks,
                          facebook: e.target.value,
                        },
                      })
                    }
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    YouTube Channel URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@your-channel"
                    value={settingsForm.socialLinks?.youtube || ''}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        socialLinks: {
                          ...settingsForm.socialLinks,
                          youtube: e.target.value,
                        },
                      })
                    }
                    className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-emerald-600/30"
              >
                Save All Store Settings
              </button>
            </div>
          </form>

          {/* Security & Password Change */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold">Change Admin Password</h3>
            </div>
            <p className="text-xs text-slate-500">
              Update the master admin password to secure dashboard access.
            </p>

            <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row items-center gap-3 max-w-md">
              <input
                type="password"
                required
                placeholder="Enter new admin password"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 shrink-0"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: DATABASE & SUPABASE INTEGRATION */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Database & Storage Architecture</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  How persistent storage, Supabase, and live file uploads operate.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Primary Storage: Active & Persistent</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-900">Current Built-in Database</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your website runs on a built-in server database located at <code>data/db.json</code> with direct REST endpoints. Every product, category, and store configuration you create or edit is automatically saved permanently and remains intact when reopening or reloading the site.
                </p>
                <div className="text-xs font-semibold text-emerald-700">
                  ✓ Products saved: {products.length} <br />
                  ✓ Categories saved: {categories.length} <br />
                  ✓ Image uploads directory: <code>/uploads</code>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                <h3 className="font-bold text-sm text-emerald-900">Supabase Cloud Ready</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  If you prefer to connect to an external Supabase PostgreSQL cloud instance, we have prepared the full SQL migration script with Row Level Security (RLS) policies and public image buckets below.
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{sqlCopied ? 'Copied to Clipboard!' : 'Copy Supabase SQL Script'}</span>
                </button>
              </div>
            </div>

            {/* Google Customer Logins Section (Stored in Supabase) */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Google Customer Logins (Supabase Table: customer_logins)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {customerLogins.length} Registered
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchCustomerLogins}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  Refresh Customer Logins
                </button>
              </div>

              {customerLogins.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  No customers have logged in yet. When customers click "Sign in with Google", their details are securely stored in the Supabase database.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Google Email</th>
                        <th className="px-4 py-3">Provider</th>
                        <th className="px-4 py-3">Logins</th>
                        <th className="px-4 py-3">Last Sign-In</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerLogins.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 flex items-center gap-2.5 font-bold text-slate-900">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt={c.name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                                {(c.name || 'C').charAt(0)}
                              </div>
                            )}
                            <span>{c.name || 'Customer'}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{c.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Google OAuth
                            </span>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">{c.loginCount || 1}</td>
                          <td className="px-4 py-3 text-slate-500">
                            {new Date(c.lastSignInAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* SQL Script Viewer */}
            <div className="space-y-2 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Supabase PostgreSQL & RLS Schema Script
                </label>
                <button
                  onClick={handleCopySql}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 border border-slate-900">
                {sqlSchema || '-- Fetching SQL Schema...'}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProductId ? 'Edit Product Information' : 'Add New Product to Store'}
        maxWidth="4xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AcousticPulse Pro Wireless ANC Headphones"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category *
              </label>
              <select
                required
                value={productFormData.categoryId}
                onChange={(e) => {
                  const cat = categories.find((c) => c.id === e.target.value);
                  setProductFormData({
                    ...productFormData,
                    categoryId: e.target.value,
                    categoryName: cat?.name || '',
                  });
                }}
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subcategory / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Audio, Smart Wearables, Footwear"
                value={productFormData.subcategory}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, subcategory: e.target.value })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Selling Price ({settings.currencySymbol || '₹'}) *
              </label>
              <input
                type="number"
                required
                min={0}
                placeholder="1499"
                value={productFormData.price ?? ''}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, price: Number(e.target.value) })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Original Price (Strikethrough MRP)
              </label>
              <input
                type="number"
                min={0}
                placeholder="2999"
                value={productFormData.originalPrice ?? ''}
                onChange={(e) =>
                  setProductFormData({
                    ...productFormData,
                    originalPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Stock Count
              </label>
              <input
                type="number"
                min={0}
                value={productFormData.stockCount ?? 20}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, stockCount: Number(e.target.value) })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Stock Status
              </label>
              <select
                value={productFormData.stockStatus}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, stockStatus: e.target.value as any })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Multiple Image Management */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Product Images (Upload or Image URLs)
              </label>
              <span className="text-[11px] text-slate-400">First image will be the primary cover</span>
            </div>

            {/* Existing images list */}
            <div className="flex flex-wrap gap-3">
              {productFormData.images?.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100"
                >
                  <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload or Add URL Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40 text-slate-700 hover:text-emerald-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{uploadingImage ? 'Uploading Image...' : 'Upload Image from Computer'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Or paste external image URL..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shrink-0"
                >
                  Add URL
                </button>
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Short Teaser Description
              </label>
              <input
                type="text"
                placeholder="1-2 sentences shown on product cards"
                value={productFormData.shortDescription}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, shortDescription: e.target.value })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Complete Product Description
              </label>
              <textarea
                rows={4}
                placeholder="Full details, materials, care instructions, warranty information..."
                value={productFormData.description}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, description: e.target.value })
                }
                className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Specifications Key-Value Builder */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Product Specifications Table
            </label>
            <div className="space-y-2">
              {productFormData.specifications &&
                Object.entries(productFormData.specifications).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded-xl text-xs"
                  >
                    <span className="font-bold text-slate-800">{k}:</span>
                    <span className="text-slate-600 flex-1">{v}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(k)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Spec name (e.g. Battery Life)"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                className="w-1/2 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
              <input
                type="text"
                placeholder="Value (e.g. 45 Hours)"
                value={newSpecVal}
                onChange={(e) => setNewSpecVal(e.target.value)}
                className="w-1/2 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
              >
                Add Spec
              </button>
            </div>
          </div>

          {/* Features Bullet Points Builder */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Key Features List
            </label>
            <div className="space-y-1.5">
              {productFormData.features?.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2 bg-slate-50 rounded-xl text-xs"
                >
                  <span className="text-slate-700">✓ {feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-rose-500 hover:text-rose-700 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="e.g. Active Noise Cancellation up to -35dB"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
              >
                Add Feature
              </button>
            </div>
          </div>

          {/* Variations: Sizes & Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            {/* Sizes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {productFormData.sizes?.map((sz, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800"
                  >
                    {sz}
                    <button type="button" onClick={() => handleRemoveSize(idx)}>
                      <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. S, M, L, XL"
                  value={newSizeText}
                  onChange={(e) => setNewSizeText(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Available Colors
              </label>
              <div className="flex flex-wrap gap-1.5">
                {productFormData.colors?.map((col, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300"
                      style={{ backgroundColor: col.hex }}
                    />
                    {col.name}
                    <button type="button" onClick={() => handleRemoveColor(idx)}>
                      <X className="w-3 h-3 text-slate-400 hover:text-rose-600" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Color name"
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 shrink-0"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Badges & Publication Status */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(productFormData.isFeatured)}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, isFeatured: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Featured Product</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(productFormData.isTrending)}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, isTrending: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Trending Badge</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(productFormData.isNewArrival)}
                  onChange={(e) =>
                    setProductFormData({ ...productFormData, isNewArrival: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>New Arrival</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Publish Status:
              </label>
              <select
                value={productFormData.status}
                onChange={(e) =>
                  setProductFormData({ ...productFormData, status: e.target.value as any })
                }
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:border-emerald-500"
              >
                <option value="published">Published (Live in Store)</option>
                <option value="hidden">Hidden (Draft Mode)</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
            >
              {editingProductId ? 'Save Changes' : 'Create & Publish Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD / EDIT CATEGORY */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategoryId ? 'Edit Category' : 'Create New Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Fitness & Outdoor"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Category Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={categoryFormData.image}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, image: e.target.value })}
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of this department..."
              value={categoryFormData.description}
              onChange={(e) =>
                setCategoryFormData({ ...categoryFormData, description: e.target.value })
              }
              className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 shadow-xs"
            >
              {editingCategoryId ? 'Save Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Confirm Deletion"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base">
              Delete {deleteConfirmItem?.type === 'product' ? 'Product' : 'Category'}?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-800">"{deleteConfirmItem?.name}"</strong>? This action cannot be undone.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setDeleteConfirmItem(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
