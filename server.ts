import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const SESSIONS_FILE = path.resolve(DATA_DIR, 'sessions.json');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface CustomerLoginRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google';
  lastSignInAt: string;
  loginCount: number;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface DatabaseSchema {
  settings: Record<string, any>;
  categories: Array<Record<string, any>>;
  products: Array<Record<string, any>>;
  customerLogins?: Array<CustomerLoginRecord>;
}

// Password hashing utility using PBKDF2 with SHA-512
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function verifyPassword(inputPassword: string, storedHash?: string, storedSalt?: string): boolean {
  if (!inputPassword) return false;
  if (storedHash && storedSalt) {
    try {
      const computed = hashPassword(inputPassword, storedSalt);
      return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
      return false;
    }
  }
  // Initial fallback matching the requested admin password
  return inputPassword === 'Chandan@07';
}

function readDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.customerLogins) {
        parsed.customerLogins = [];
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }

  // Initial default settings
  const defaultSalt = 'eda6cad4aea4099af56f3754eb5c9fe2';
  const defaultHash = hashPassword('Chandan@07', defaultSalt);

  return {
    settings: {
      storeName: 'SIRI',
      tagline: 'Curated Elegance, Direct WhatsApp Ordering',
      description: 'Discover hand-picked collections curated for elegance, everyday style, and uncompromising quality.',
      currencySymbol: '₹',
      currencyCode: 'INR',
      whatsappNumber: '917349095032',
      whatsappPrefillGreeting: 'Hello SIRI! I am interested in ordering the following product.',
      phone: '+91 73490 95032',
      email: 'bmc419490@gmail.com',
      address: 'Bangalore, Karnataka, India',
      announcementText: 'Welcome to SIRI — Direct WhatsApp Orders & Inquiries Welcome',
      heroTitle: 'Curated Elegance, Defined by You',
      heroSubtitle: 'Explore timeless collections crafted with distinction and uncompromising quality. Direct personal shopping via WhatsApp.',
      heroButtonText: 'View Collections',
      heroImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80',
      socialLinks: {
        instagram: 'https://www.instagram.com/cc__.creations?dlrf=MW90dnNmbThpeTg2aQ==',
        facebook: 'https://facebook.com/siri.store',
        twitter: 'https://twitter.com/siri_store',
        youtube: 'https://youtube.com/@siri_store',
      },
      adminPasswordSalt: defaultSalt,
      adminPasswordHash: defaultHash,
    },
    categories: [],
    products: [],
    customerLogins: [],
  };
}

// Atomic write to avoid file corruption
function writeDb(data: DatabaseSchema): void {
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error in atomic writeDb, attempting direct fallback:', err);
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (fallbackErr) {
      console.error('Fatal writeDb failure:', fallbackErr);
    }
  }
}

// Persistent Admin Sessions Store
function readSessions(): Set<string> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const tokens: string[] = JSON.parse(raw);
      return new Set(tokens);
    }
  } catch (err) {
    console.error('Error reading sessions.json:', err);
  }
  return new Set();
}

function saveSessions(sessions: Set<string>): void {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Array.from(sessions)), 'utf-8');
  } catch (err) {
    console.error('Error saving sessions.json:', err);
  }
}

const activeAdminTokens = readSessions();

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_PASSWORD ||
  'siri_secure_admin_hmac_secret_2026_key';

function createAdminToken(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${randomPart}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `siri_adm_${payload}.${sig}`;
}

function verifyAdminToken(token?: string): boolean {
  if (!token || !token.startsWith('siri_adm_')) return false;
  if (activeAdminTokens.has(token)) return true;

  const raw = token.replace(/^siri_adm_/, '');
  const parts = raw.split('.');
  if (parts.length === 3) {
    const [timestampStr, randomPart, sig] = parts;
    const payload = `${timestampStr}.${randomPart}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        const timestamp = parseInt(timestampStr, 36);
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
        if (!isNaN(timestamp) && Date.now() - timestamp < maxAgeMs) {
          return true;
        }
      }
    } catch {
      // Continue
    }
  }
  return false;
}

function isAdmin(req: express.Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return verifyAdminToken(token);
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Initialize DB and ensure admin credentials exist
  const initialDb = readDb();
  if (!initialDb.settings.adminPasswordSalt || !initialDb.settings.adminPasswordHash) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword('Chandan@07', salt);
    initialDb.settings.adminPasswordSalt = salt;
    initialDb.settings.adminPasswordHash = hash;
    writeDb(initialDb);
  }

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS Middleware for external deployments
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // In-memory rate limiting map for admin login protection
  const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

  // Static files for user-uploaded product images
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'SIRI', time: new Date().toISOString() });
  });

  // Admin Authentication: Login (with rate limiting and brute force protection)
  app.post('/api/admin/login', (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const now = Date.now();
    const attempts = loginAttempts.get(clientIp);

    if (attempts && attempts.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempts.lockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        message: `Too many unsuccessful login attempts. Please wait ${waitSeconds} seconds before trying again.`,
      });
      return;
    }

    const { password } = req.body;
    if (!password) {
      res.status(400).json({ success: false, message: 'Password is required' });
      return;
    }

    const db = readDb();
    const envPassword = process.env.ADMIN_PASSWORD;

    let valid = false;
    if (envPassword && password === envPassword) {
      valid = true;
    } else if (verifyPassword(password, db.settings.adminPasswordHash, db.settings.adminPasswordSalt)) {
      valid = true;
    }

    if (valid) {
      loginAttempts.delete(clientIp);
      const token = createAdminToken();
      activeAdminTokens.add(token);
      saveSessions(activeAdminTokens);
      res.json({
        success: true,
        token,
        message: 'SIRI Administrator session established',
      });
    } else {
      const currentCount = (attempts ? attempts.count : 0) + 1;
      const lockedUntil = currentCount >= 5 ? now + 5 * 60 * 1000 : 0;
      loginAttempts.set(clientIp, { count: currentCount, lockedUntil });

      res.status(401).json({
        success: false,
        message: currentCount >= 5
          ? 'Too many failed login attempts. Access temporarily locked for 5 minutes.'
          : 'Invalid administrator password. Please verify your credentials.',
      });
    }
  });

  // Admin Authentication: Verify session
  app.get('/api/admin/verify', (req, res) => {
    if (isAdmin(req)) {
      res.json({ authenticated: true, role: 'administrator' });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Admin Authentication: Logout
  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      activeAdminTokens.delete(token);
      saveSessions(activeAdminTokens);
    }
    res.json({ success: true, message: 'Administrator session ended' });
  });

  // Admin Authentication: Change Password
  app.post('/api/admin/change-password', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const db = readDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);
    db.settings.adminPasswordSalt = salt;
    db.settings.adminPasswordHash = hash;
    writeDb(db);

    res.json({ success: true, message: 'Administrator password updated securely' });
  });

  // Store Settings: Get (Sanitized for public visitors)
  app.get('/api/settings', (req, res) => {
    const db = readDb();
    const settings = { ...db.settings };
    // Never expose security credentials or secret keys to client
    delete settings.adminPasswordHash;
    delete settings.adminPasswordSalt;
    delete settings.supabaseUrl;
    delete settings.supabaseAnonKey;
    delete settings.supabaseServiceRoleKey;
    res.json(settings);
  });

  // Store Settings: Update (Admin only)
  app.put('/api/settings', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const db = readDb();
    const preservedHash = db.settings.adminPasswordHash;
    const preservedSalt = db.settings.adminPasswordSalt;

    db.settings = {
      ...db.settings,
      ...req.body,
      adminPasswordHash: preservedHash,
      adminPasswordSalt: preservedSalt,
    };
    writeDb(db);
    const sanitized = { ...db.settings };
    delete sanitized.adminPasswordHash;
    delete sanitized.adminPasswordSalt;
    res.json({ success: true, settings: sanitized });
  });

  // Categories: Get all
  app.get('/api/categories', (req, res) => {
    const db = readDb();
    res.json(db.categories || []);
  });

  // Categories: Create (Admin only)
  app.post('/api/categories', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { name, image, description } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const db = readDb();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCategory = {
      id: 'cat-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      name,
      slug,
      image: image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      description: description || '',
    };
    db.categories.push(newCategory);
    writeDb(db);
    res.status(201).json(newCategory);
  });

  // Categories: Update (Admin only)
  app.put('/api/categories/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { id } = req.params;
    const db = readDb();
    const index = db.categories.findIndex((c) => c.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    const current = db.categories[index];
    const updated = { ...current, ...req.body, id };
    if (req.body.name && req.body.name !== current.name && !req.body.slug) {
      updated.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    db.categories[index] = updated;

    // Synchronize categoryName in products
    if (req.body.name && req.body.name !== current.name) {
      db.products = db.products.map((p) => {
        if (p.categoryId === id) {
          return { ...p, categoryName: req.body.name };
        }
        return p;
      });
    }

    writeDb(db);
    res.json(updated);
  });

  // Categories: Delete (Admin only)
  app.delete('/api/categories/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { id } = req.params;
    const db = readDb();
    db.categories = db.categories.filter((c) => c.id !== id);
    writeDb(db);
    res.json({ success: true, message: 'Category deleted' });
  });

  // Products: Get all (supports search, category, pricing, sorting)
  app.get('/api/products', (req, res) => {
    const db = readDb();
    let products = [...db.products];
    const includeHidden = req.query.includeHidden === 'true' && isAdmin(req);

    // Filter out unpublished/draft products for public customer view
    if (!includeHidden) {
      products = products.filter((p) => p.status === 'published');
    }

    // Category filter
    if (req.query.categoryId) {
      products = products.filter((p) => p.categoryId === req.query.categoryId);
    }

    // Search query
    if (req.query.search) {
      const q = String(req.query.search).toLowerCase().trim();
      products = products.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }

    // Filter toggles
    if (req.query.featured === 'true') {
      products = products.filter((p) => p.isFeatured);
    }
    if (req.query.discounted === 'true') {
      products = products.filter((p) => p.originalPrice && Number(p.originalPrice) > Number(p.price));
    }
    if (req.query.inStock === 'true') {
      products = products.filter((p) => p.stockStatus === 'in_stock' || (p.stockCount && p.stockCount > 0));
    }

    // Price limits
    if (req.query.minPrice) {
      const min = Number(req.query.minPrice);
      if (!isNaN(min)) products = products.filter((p) => p.price >= min);
    }
    if (req.query.maxPrice) {
      const max = Number(req.query.maxPrice);
      if (!isNaN(max)) products = products.filter((p) => p.price <= max);
    }

    // Sorting
    const sort = req.query.sort as string;
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else {
      // Default: Newest first
      products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    res.json(products);
  });

  // Products: Get single product by ID or Slug
  app.get('/api/products/:identifier', (req, res) => {
    const { identifier } = req.params;
    const db = readDb();
    const product = db.products.find((p) => p.id === identifier || p.slug === identifier);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    // Block ordinary visitors from accessing unpublished draft items
    if (product.status === 'hidden' && !isAdmin(req)) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  });

  // Products: Create (Admin only)
  app.post('/api/products', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const data = req.body;
    if (!data.name || data.price === undefined) {
      res.status(400).json({ error: 'Product name and selling price are required' });
      return;
    }

    const db = readDb();
    const category = db.categories.find((c) => c.id === data.categoryId);
    const slugBase = (data.name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Date.now().toString(36)}`;

    const price = Number(data.price);
    const originalPrice = data.originalPrice ? Number(data.originalPrice) : null;
    const discountPercent =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : (data.discountPercent ? Number(data.discountPercent) : null);

    const newProduct = {
      id: 'prod-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: data.name.trim(),
      slug,
      sku: data.sku ? String(data.sku).trim() : '',
      description: data.description ? String(data.description).trim() : '',
      shortDescription: data.shortDescription
        ? String(data.shortDescription).trim()
        : (data.description ? String(data.description).slice(0, 140) + '...' : ''),
      price,
      originalPrice,
      discountPercent,
      categoryId: data.categoryId || (db.categories[0]?.id || 'cat-general'),
      categoryName: category?.name || data.categoryName || 'General',
      subcategory: data.subcategory ? String(data.subcategory).trim() : '',
      images: Array.isArray(data.images) ? data.images : [],
      specifications: data.specifications || {},
      features: Array.isArray(data.features) ? data.features : [],
      sizes: Array.isArray(data.sizes) ? data.sizes : [],
      colors: Array.isArray(data.colors) ? data.colors : [],
      variations: Array.isArray(data.variations) ? data.variations : [],
      stockCount: data.stockCount !== undefined ? Number(data.stockCount) : 10,
      stockStatus: data.stockStatus || 'in_stock',
      isFeatured: Boolean(data.isFeatured),
      status: data.status === 'hidden' ? 'hidden' : 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    writeDb(db);
    res.status(201).json(newProduct);
  });

  // Products: Update (Admin only)
  app.put('/api/products/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { id } = req.params;
    const db = readDb();
    const index = db.products.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const current = db.products[index];
    const data = req.body;
    const category = db.categories.find((c) => c.id === data.categoryId) || { name: current.categoryName };

    const price = data.price !== undefined ? Number(data.price) : current.price;
    const originalPrice = data.originalPrice !== undefined ? (data.originalPrice ? Number(data.originalPrice) : null) : current.originalPrice;
    const discountPercent =
      originalPrice && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : (data.discountPercent !== undefined ? data.discountPercent : current.discountPercent);

    const updated = {
      ...current,
      ...data,
      id,
      price,
      originalPrice,
      discountPercent,
      categoryName: category?.name || current.categoryName,
      updatedAt: new Date().toISOString(),
    };

    db.products[index] = updated;
    writeDb(db);
    res.json(updated);
  });

  // Products: Delete (Admin only)
  app.delete('/api/products/:id', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { id } = req.params;
    const db = readDb();
    db.products = db.products.filter((p) => p.id !== id);
    writeDb(db);
    res.json({ success: true, message: 'Product deleted permanently' });
  });

  // Image Upload (Admin only)
  app.post('/api/upload', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator authentication required.' });
      return;
    }
    const { data, filename } = req.body;
    if (!data) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    try {
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = 'png';
        else if (mime.includes('webp')) ext = 'webp';
        else if (mime.includes('gif')) ext = 'gif';
        else ext = 'jpg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(data, 'base64');
      }

      const safeName = (filename ? filename.replace(/[^a-zA-Z0-9.-]/g, '_') : 'image')
        .replace(/\.[^/.]+$/, '');
      const uniqueFileName = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}_${safeName}.${ext}`;
      const filePath = path.resolve(UPLOADS_DIR, uniqueFileName);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${uniqueFileName}`;

      res.json({
        success: true,
        url: publicUrl,
        filename: uniqueFileName,
      });
    } catch (err: any) {
      console.error('Upload processing error:', err);
      res.status(500).json({ error: 'Failed to process image upload: ' + err.message });
    }
  });

  // Supabase migration script generator for production hosting (Admin only)
  app.get('/api/supabase/schema-sql', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
      return;
    }
    const sql = `-- ========================================================
-- Supabase Schema for SIRI Official E-Commerce Store
-- Execute this script inside your Supabase Project SQL Editor
-- ========================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    sku TEXT,
    description TEXT,
    short_description TEXT,
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    discount_percent INTEGER,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT,
    subcategory TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    sizes JSONB DEFAULT '[]'::jsonb,
    colors JSONB DEFAULT '[]'::jsonb,
    variations JSONB DEFAULT '[]'::jsonb,
    stock_count INTEGER DEFAULT 0,
    stock_status TEXT DEFAULT 'in_stock',
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    store_name TEXT NOT NULL DEFAULT 'SIRI',
    tagline TEXT,
    description TEXT,
    logo_url TEXT,
    currency_symbol TEXT DEFAULT '₹',
    currency_code TEXT DEFAULT 'INR',
    whatsapp_number TEXT NOT NULL,
    whatsapp_prefill_greeting TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    announcement_text TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_button_text TEXT,
    hero_image_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    about_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create customer_logins table for Google Authentication (Free Supabase Storage)
CREATE TABLE IF NOT EXISTS public.customer_logins (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'google',
    last_sign_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    login_count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_logins ENABLE ROW LEVEL SECURITY;

-- 6. Public read policies (Customers can only view published items)
CREATE POLICY "Public can view published products" ON public.products
    FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Public can view store settings" ON public.store_settings
    FOR SELECT USING (true);

-- 7. Customer Logins Policies (Allow Google sign-in users to upsert their profile)
CREATE POLICY "Public upsert customer_logins" ON public.customer_logins
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public view customer_logins" ON public.customer_logins
    FOR SELECT USING (true);

-- 8. Storage bucket for high-res product photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');
`;
    res.setHeader('Content-Type', 'text/plain');
    res.send(sql);
  });

  // --- CUSTOMER GOOGLE LOGIN & SUPABASE SYNC ENDPOINTS ---

  // Record Customer Login (Google Sign-In)
  app.post('/api/customer/login-google', async (req, res) => {
    const { id, email, name, avatarUrl, metadata } = req.body;
    if (!email || !id) {
      res.status(400).json({ error: 'Customer Google ID and Email are required' });
      return;
    }

    const db = readDb();
    if (!db.customerLogins) {
      db.customerLogins = [];
    }

    const now = new Date().toISOString();
    const existingIndex = db.customerLogins.findIndex(
      (c) => c.id === id || c.email.toLowerCase() === email.toLowerCase()
    );

    let customerRecord: CustomerLoginRecord;
    if (existingIndex >= 0) {
      const existing = db.customerLogins[existingIndex];
      customerRecord = {
        ...existing,
        id,
        email,
        name: name || existing.name || email.split('@')[0],
        avatarUrl: avatarUrl || existing.avatarUrl,
        provider: 'google',
        lastSignInAt: now,
        loginCount: (existing.loginCount || 1) + 1,
        metadata: { ...existing.metadata, ...metadata, lastIp: req.ip },
      };
      db.customerLogins[existingIndex] = customerRecord;
    } else {
      customerRecord = {
        id,
        email,
        name: name || email.split('@')[0],
        avatarUrl: avatarUrl || undefined,
        provider: 'google',
        lastSignInAt: now,
        loginCount: 1,
        createdAt: now,
        metadata: { ...metadata, registeredIp: req.ip },
      };
      db.customerLogins.push(customerRecord);
    }

    writeDb(db);

    // Also attempt server-side Supabase sync if credentials exist
    let supabaseSynced = false;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error } = await supabase.from('customer_logins').upsert({
          id: customerRecord.id,
          email: customerRecord.email,
          full_name: customerRecord.name,
          avatar_url: customerRecord.avatarUrl || null,
          provider: 'google',
          last_sign_in: customerRecord.lastSignInAt,
          login_count: customerRecord.loginCount,
          metadata: customerRecord.metadata || {},
        });
        if (!error) {
          supabaseSynced = true;
        } else {
          console.warn('[Server Supabase Sync] Table notice:', error.message);
        }
      } catch (sbErr: any) {
        console.warn('[Server Supabase Sync] Failed:', sbErr?.message);
      }
    }

    res.json({
      success: true,
      user: customerRecord,
      supabaseSynced,
      message: 'Google login recorded successfully in database',
    });
  });

  // Get Customer Logins List (Authorized Admin only - protects customer privacy)
  app.get('/api/customer/logins', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
      return;
    }
    const db = readDb();
    res.json(db.customerLogins || []);
  });

  // Supabase Connection Status (Authorized Admin only)
  app.get('/api/supabase/status', (req, res) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
      return;
    }
    const db = readDb();
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
    const customerCount = db.customerLogins?.length || 0;

    res.json({
      configured: Boolean(supabaseUrl && hasKey),
      supabaseUrl: supabaseUrl ? supabaseUrl.replace(/\.co.*/, '.co') : null,
      customerLoginsRecorded: customerCount,
      databaseType: 'Supabase PostgreSQL + High-speed Local Persistence',
    });
  });

  // Setup Vite middleware for local development or static build for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SIRI] E-Commerce Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SIRI server:', err);
  process.exit(1);
});
