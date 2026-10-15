import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Netlify Functions Handler Types
export interface HandlerEvent {
  rawUrl?: string;
  rawQuery?: string;
  path: string;
  httpMethod: string;
  headers: Record<string, string | undefined>;
  multiValueHeaders?: Record<string, string[] | undefined>;
  queryStringParameters?: Record<string, string | undefined>;
  body: string | null;
  isBase64Encoded?: boolean;
}

export interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

interface DatabaseSchema {
  settings: Record<string, any>;
  categories: Array<Record<string, any>>;
  products: Array<Record<string, any>>;
  customerLogins?: Array<Record<string, any>>;
}

const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT
);

// In serverless runtimes (Netlify/Lambda), only /tmp is writable
const DATA_DIR = isServerless ? path.resolve('/tmp', 'siri-data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const SESSIONS_FILE = path.resolve(DATA_DIR, 'sessions.json');

// Ensure writable data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // Ignored if readonly
}

// Session secret for stateless HMAC token generation & verification across cold starts
const SESSION_SECRET = process.env.SESSION_SECRET || '';

// CORS response headers
const corsHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

function jsonResponse(statusCode: number, data: any): HandlerResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
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
  return false;
}

function getDefaultSchema(): DatabaseSchema {
  return {
    settings: {
      storeName: 'SIRI',
      tagline: 'Curated Elegance, Direct WhatsApp Ordering',
      description: 'Discover hand-picked collections curated for elegance, everyday style, and uncompromising quality. Connect with us directly on WhatsApp for personal assistance and immediate or[...]',
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
      aboutText: 'SIRI is an independent online brand dedicated to curated quality and personal customer care. By removing impersonal checkout funnels and intermediaries, we speak with you direct[...]',
    },
    categories: [
      {
        id: 'cat-fashion',
        name: 'Apparel & Fashion',
        slug: 'apparel-fashion',
        image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80',
        description: 'Premium curated everyday & ethnic apparel.',
      },
      {
        id: 'cat-accessories',
        name: 'Fine Accessories',
        slug: 'fine-accessories',
        image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
        description: 'Exquisite jewelry, timepieces, and statement pieces.',
      },
    ],
    products: [],
    customerLogins: [],
  };
}

function readDb(): DatabaseSchema {
  // 1. Try reading writable /tmp DB file first
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!parsed.customerLogins) parsed.customerLogins = [];
      return parsed;
    }
  } catch {
    // Continue
  }

  // 2. Try reading bundled seed db.json
  const candidateSeedPaths = [
    path.resolve(process.cwd(), 'data', 'db.json'),
    path.resolve(__dirname, '..', '..', 'data', 'db.json'),
    path.resolve(__dirname, 'data', 'db.json'),
  ];

  for (const seedPath of candidateSeedPaths) {
    try {
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.customerLogins) parsed.customerLogins = [];
        // Seed into /tmp so future writes succeed
        writeDb(parsed);
        return parsed;
      }
    } catch {
      // Continue
    }
  }

  const defaultDb = getDefaultSchema();
  writeDb(defaultDb);
  return defaultDb;
}

function writeDb(data: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Netlify Function DB Write Error]:', err);
  }
}

// Session management
function readSessions(): Set<string> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const tokens: string[] = JSON.parse(raw);
      return new Set(tokens);
    }
  } catch {
    // Continue
  }
  return new Set();
}

function saveSessions(sessions: Set<string>): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Array.from(sessions)), 'utf-8');
  } catch {
    // Continue
  }
}

function createAdminToken(): string {
  if (!SESSION_SECRET) throw new Error('SESSION_SECRET is not configured.');
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${randomPart}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = `siri_adm_${payload}.${sig}`;

  const sessions = readSessions();
  sessions.add(token);
  saveSessions(sessions);
  return token;
}

function verifyAdminToken(token?: string): boolean {
  if (!SESSION_SECRET || !token || !token.startsWith('siri_adm_')) return false;

  // 1. Verify cryptographic HMAC signature
  const raw = token.replace(/^siri_adm_/, '');
  const parts = raw.split('.');
  if (parts.length === 3) {
    const [timestampStr, randomPart, sig] = parts;
    const payload = `${timestampStr}.${randomPart}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    try {
      if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
        const timestamp = parseInt(timestampStr, 36);
        const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days validity
        if (!isNaN(timestamp) && Date.now() - timestamp < maxAgeMs) {
          return true;
        }
      }
    } catch {
      // Continue to check active session store
    }
  }

  // 2. Check stored session tokens
  const sessions = readSessions();
  return sessions.has(token);
}

function isAdmin(headers: Record<string, string | undefined>): boolean {
  const authHeader = headers['authorization'] || headers['Authorization'];
  if (!authHeader) return false;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  return verifyAdminToken(token);
}

// Shopify Storefront API helpers. Keep the access token server-side in Netlify.
function getShopifyConfig(): { domain: string; token: string; apiVersion: string } | null {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN?.trim();
  if (!rawDomain || !token) return null;
  const domain = rawDomain.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  if (!domain.endsWith('.myshopify.com')) {
    throw new Error('SHOPIFY_STORE_DOMAIN must be the store’s .myshopify.com domain.');
  }
  return { domain, token, apiVersion: process.env.SHOPIFY_API_VERSION || '2026-07' };
}

async function shopifyGraphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const config = getShopifyConfig();
  if (!config) throw new Error('Shopify Storefront API environment variables are not configured.');
  const response = await fetch(`https://${config.domain}/api/${config.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Shopify-Storefront-Private-Token': config.token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json() as { data?: T; errors?: Array<{ message?: string }> };
  if (!response.ok || payload.errors?.length || !payload.data) {
    console.error('[Shopify Storefront API]', response.status, payload.errors?.map((e) => e.message));
    throw new Error('Shopify request failed. Check the store domain, Storefront API token, and API permissions.');
  }
  return payload.data;
}

function mapShopifyProduct(node: any): Record<string, any> {
  const variants = node.variants?.nodes || [];
  const variant = variants.find((v: any) => v.availableForSale) || variants[0];
  const price = Number(variant?.price?.amount ?? node.priceRange?.minVariantPrice?.amount ?? 0);
  const compareAt = Number(variant?.compareAtPrice?.amount ?? 0);
  const images = (node.images?.nodes || []).map((image: any) => image.url).filter(Boolean);
  const productOptions = node.options || [];
  const sizeOption = productOptions.find((option: any) => /size/i.test(option.name));
  const colorOption = productOptions.find((option: any) => /colou?r/i.test(option.name));
  const totalInventory = typeof variant?.quantityAvailable === 'number' ? variant.quantityAvailable : undefined;
  const available = Boolean(node.availableForSale && variant?.availableForSale);
  const categoryName = node.productType || node.vendor || 'Shopify Products';
  return {
    id: node.id,
    shopifyProductId: node.id,
    shopifyVariantId: variant?.id,
    name: node.title,
    slug: node.handle,
    sku: variant?.sku || undefined,
    description: node.description || '',
    shortDescription: node.description?.slice(0, 180) || '',
    price,
    originalPrice: compareAt > price ? compareAt : null,
    discountPercent: compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null,
    categoryId: node.productType || node.vendor || 'shopify-products',
    categoryName,
    subcategory: node.vendor || undefined,
    images,
    sizes: sizeOption?.values || [],
    colors: (colorOption?.values || []).map((name: string) => ({ name, hex: '#d6d3d1' })),
    variations: variants.map((v: any) => v.title).filter((title: string) => title && title !== 'Default Title'),
    shopifyVariants: variants.map((v: any) => ({
      id: v.id,
      title: v.title,
      availableForSale: Boolean(v.availableForSale),
      selectedOptions: Object.fromEntries((v.selectedOptions || []).map((option: any) => [option.name, option.value])),
    })),
    stockCount: totalInventory,
    stockStatus: available ? (totalInventory !== undefined && totalInventory <= 5 ? 'low_stock' : 'in_stock') : 'out_of_stock',
    isFeatured: false,
    isTrending: false,
    isNewArrival: false,
    reviewsCount: 0,
    rating: 0,
    status: 'published',
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

async function fetchShopifyProducts(): Promise<Record<string, any>[]> {
  const products: any[] = [];
  let after: string | null = null;

  while (true) {
    const data: { products: { nodes: any[]; pageInfo: { hasNextPage: boolean; endCursor?: string | null } } } = await shopifyGraphql<{
      products: {
        nodes: any[];
        pageInfo: { hasNextPage: boolean; endCursor?: string | null };
      };
    }>(`
      query SiriProducts($after: String) {
        products(first: 100, after: $after, sortKey: TITLE) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id title handle description productType vendor availableForSale createdAt updatedAt
            images(first: 10) { nodes { url altText } }
            priceRange { minVariantPrice { amount currencyCode } }
            options { name values }
            variants(first: 100) { nodes { id title sku availableForSale selectedOptions { name value } price { amount currencyCode } compareAtPrice { amount currencyCode } } }
          }
        }
      }
    `, { after });

    products.push(...data.products.nodes);

    if (!data.products.pageInfo.hasNextPage) break;

    const nextCursor: string | null | undefined = data.products.pageInfo.endCursor;
    if (!nextCursor || nextCursor === after) {
      throw new Error('Shopify product pagination stopped because the next cursor was missing or unchanged.');
    }
    after = nextCursor;
  }

  return products.map(mapShopifyProduct);
}

async function createShopifyCheckout(variantId: string, quantity: number): Promise<string> {
  const data = await shopifyGraphql<{ cartCreate: { cart?: { checkoutUrl: string }; userErrors: Array<{ message: string }> } }>(`
    mutation SiriCreateCart($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { message }
      }
    }
  `, { input: { lines: [{ merchandiseId: variantId, quantity }] } });
  const result = data.cartCreate;
  if (result.userErrors?.length || !result.cart?.checkoutUrl) {
    throw new Error(result.userErrors?.map((e) => e.message).join('; ') || 'Shopify could not create checkout.');
  }
  return result.cart.checkoutUrl;
}

// In-memory brute force protection
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export const handler = async (
  event: HandlerEvent,
  context: any
): Promise<HandlerResponse> => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: '',
    };
  }

  // Normalize path by stripping Netlify rewrite prefix and /api
  let subpath = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api\/?/, '/')
    .replace(/^\/api\/?/, '/');
  if (!subpath.startsWith('/')) {
    subpath = '/' + subpath;
  }
  // Remove trailing slashes (except root)
  if (subpath.length > 1 && subpath.endsWith('/')) {
    subpath = subpath.slice(0, -1);
  }

  const method = event.httpMethod.toUpperCase();
  const query = event.queryStringParameters || {};

  let body: any = {};
  if (event.body) {
    try {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }

  const clientIp =
    event.headers['x-forwarded-for']?.split(',')[0].trim() ||
    event.headers['client-ip'] ||
    'unknown';

  // 1. Health check
  if (subpath === '/health' && method === 'GET') {
    return jsonResponse(200, {
      status: 'ok',
      brand: 'SIRI',
      runtime: 'Netlify Serverless Function',
      time: new Date().toISOString(),
    });
  }

  // 2. Admin Login
  if (subpath === '/admin/login' && method === 'POST') {
    const now = Date.now();
    const attempts = loginAttempts.get(clientIp);

    if (attempts && attempts.lockedUntil > now) {
      const waitSeconds = Math.ceil((attempts.lockedUntil - now) / 1000);
      return jsonResponse(429, {
        success: false,
        message: `Too many unsuccessful login attempts. Please wait ${waitSeconds} seconds before trying again.`,
      });
    }

    const { password } = body;
    if (!password) {
      return jsonResponse(400, { success: false, message: 'Password is required' });
    }

    const db = readDb();
    const envPassword = process.env.ADMIN_PASSWORD;
    if (!SESSION_SECRET) {
      return jsonResponse(503, { success: false, message: 'Administrator security is not configured. Set SESSION_SECRET in Netlify.' });
    }

    // ADMIN_PASSWORD is only the initial bootstrap password. Once a password hash
    // exists, the stored password takes precedence so password changes take effect.
    const hasStoredPassword = Boolean(db.settings.adminPasswordHash && db.settings.adminPasswordSalt);
    const valid = hasStoredPassword
      ? verifyPassword(password, db.settings.adminPasswordHash, db.settings.adminPasswordSalt)
      : Boolean(envPassword && password === envPassword);

    if (valid) {
      loginAttempts.delete(clientIp);
      const token = createAdminToken();
      return jsonResponse(200, {
        success: true,
        token,
        message: 'SIRI Administrator session established',
      });
    } else {
      const currentCount = (attempts ? attempts.count : 0) + 1;
      const lockedUntil = currentCount >= 5 ? now + 5 * 60 * 1000 : 0;
      loginAttempts.set(clientIp, { count: currentCount, lockedUntil });

      return jsonResponse(401, {
        success: false,
        message:
          currentCount >= 5
            ? 'Too many failed login attempts. Access temporarily locked for 5 minutes.'
            : 'Invalid administrator password. Please verify your credentials.',
      });
    }
  }

  // 3. Admin Verify Session
  if (subpath === '/admin/verify' && method === 'GET') {
    if (isAdmin(event.headers)) {
      return jsonResponse(200, { authenticated: true, role: 'administrator' });
    }
    return jsonResponse(401, { authenticated: false });
  }

  // 4. Admin Logout
  if (subpath === '/admin/logout' && method === 'POST') {
    const authHeader = event.headers['authorization'] || event.headers['Authorization'];
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const sessions = readSessions();
      sessions.delete(token);
      saveSessions(sessions);
    }
    return jsonResponse(200, { success: true, message: 'Administrator session ended' });
  }

  // 5. Admin Change Password
  if (subpath === '/admin/change-password' && method === 'POST') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
    }
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 6) {
      return jsonResponse(400, { error: 'Password must be at least 6 characters long' });
    }
    const db = readDb();
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPassword, salt);
    db.settings.adminPasswordSalt = salt;
    db.settings.adminPasswordHash = hash;
    writeDb(db);
    return jsonResponse(200, { success: true, message: 'Administrator password updated successfully' });
  }

  // 6. Settings GET
  if (subpath === '/settings' && method === 'GET') {
    const db = readDb();
    const sanitized = { ...db.settings };
    delete sanitized.adminPasswordHash;
    delete sanitized.adminPasswordSalt;
    delete sanitized.supabaseUrl;
    delete sanitized.supabaseAnonKey;
    delete sanitized.supabaseServiceRoleKey;
    return jsonResponse(200, sanitized);
  }

  // 7. Settings PUT (Admin only)
  if (subpath === '/settings' && method === 'PUT') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
    }
    const db = readDb();
    const preservedHash = db.settings.adminPasswordHash;
    const preservedSalt = db.settings.adminPasswordSalt;

    db.settings = {
      ...db.settings,
      ...body,
      adminPasswordHash: preservedHash,
      adminPasswordSalt: preservedSalt,
    };
    writeDb(db);
    const sanitized = { ...db.settings };
    delete sanitized.adminPasswordHash;
    delete sanitized.adminPasswordSalt;
    return jsonResponse(200, { success: true, settings: sanitized });
  }

  // 8. Categories GET
  if (subpath === '/categories' && method === 'GET') {
    const db = readDb();
    return jsonResponse(200, db.categories || []);
  }

  // 9. Categories POST (Admin only)
  if (subpath === '/categories' && method === 'POST') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
    }
    const { name, image, description } = body;
    if (!name) {
      return jsonResponse(400, { error: 'Category name is required' });
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
    return jsonResponse(201, newCategory);
  }

  // 10. Categories PUT & DELETE (/categories/:id)
  const catMatch = subpath.match(/^\/categories\/([a-zA-Z0-9_-]+)$/);
  if (catMatch) {
    const catId = catMatch[1];
    if (method === 'PUT') {
      if (!isAdmin(event.headers)) {
        return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
      }
      const db = readDb();
      const index = db.categories.findIndex((c) => c.id === catId);
      if (index === -1) {
        return jsonResponse(404, { error: 'Category not found' });
      }
      const current = db.categories[index];
      const updated = { ...current, ...body, id: catId };
      if (body.name && body.name !== current.name && !body.slug) {
        updated.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      db.categories[index] = updated;
      if (body.name && body.name !== current.name) {
        db.products = db.products.map((p) => {
          if (p.categoryId === catId) {
            return { ...p, categoryName: body.name };
          }
          return p;
        });
      }
      writeDb(db);
      return jsonResponse(200, updated);
    }

    if (method === 'DELETE') {
      if (!isAdmin(event.headers)) {
        return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
      }
      const db = readDb();
      db.categories = db.categories.filter((c) => c.id !== catId);
      writeDb(db);
      return jsonResponse(200, { success: true, message: 'Category deleted' });
    }
  }

  // Shopify checkout: creates a Shopify cart and returns its hosted checkout URL.
  if (subpath === '/checkout' && method === 'POST') {
    const variantId = typeof body.variantId === 'string' ? body.variantId : '';
    const quantity = Number(body.quantity);
    if (!variantId.startsWith('gid://shopify/ProductVariant/') || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return jsonResponse(400, { error: 'A valid Shopify variant ID and quantity between 1 and 20 are required.' });
    }
    try {
      const checkoutUrl = await createShopifyCheckout(variantId, quantity);
      return jsonResponse(200, { checkoutUrl });
    } catch (error: any) {
      console.error('[SIRI checkout]', error?.message || error);
      return jsonResponse(502, { error: 'Unable to start Shopify checkout. Please try again or contact support.' });
    }
  }

  // 11. Products GET
  if (subpath === '/products' && method === 'GET') {
    let products: Record<string, any>[];
    try {
      // When configured, Shopify is the source of truth for customer-facing products.
      if (getShopifyConfig()) {
        products = await fetchShopifyProducts();
      } else {
        const db = readDb();
        products = [...db.products];
      }
    } catch (error: any) {
      console.error('[SIRI products]', error?.message || error);
      return jsonResponse(502, { error: 'Unable to load products from Shopify. Check the Storefront API configuration and permissions.' });
    }
    const includeHidden = query.includeHidden === 'true' && isAdmin(event.headers);

    if (!includeHidden) {
      products = products.filter((p) => p.status === 'published');
    }

    if (query.categoryId) {
      products = products.filter((p) => p.categoryId === query.categoryId);
    }

    if (query.search) {
      const q = String(query.search).toLowerCase().trim();
      products = products.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
      );
    }

    if (query.featured === 'true') {
      products = products.filter((p) => p.isFeatured);
    }
    if (query.discounted === 'true') {
      products = products.filter((p) => p.originalPrice && Number(p.originalPrice) > Number(p.price));
    }
    if (query.inStock === 'true') {
      products = products.filter((p) => p.stockStatus === 'in_stock' || (p.stockCount && p.stockCount > 0));
    }

    if (query.minPrice) {
      const min = Number(query.minPrice);
      if (!isNaN(min)) products = products.filter((p) => p.price >= min);
    }
    if (query.maxPrice) {
      const max = Number(query.maxPrice);
      if (!isNaN(max)) products = products.filter((p) => p.price <= max);
    }

    const sort = query.sort;
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else {
      products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return jsonResponse(200, products);
  }

  // 12. Products POST (Admin only)
  if (subpath === '/products' && method === 'POST') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
    }
    const data = body;
    if (!data.name || data.price === undefined) {
      return jsonResponse(400, { error: 'Product name and selling price are required' });
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
    return jsonResponse(201, newProduct);
  }

  // 13. Products Single GET, PUT, DELETE (/products/:identifier)
  const prodMatch = subpath.match(/^\/products\/([a-zA-Z0-9_.-]+)$/);
  if (prodMatch) {
    const identifier = prodMatch[1];
    const db = readDb();

    if (method === 'GET') {
      const product = db.products.find((p) => p.id === identifier || p.slug === identifier);
      if (!product) {
        return jsonResponse(404, { error: 'Product not found' });
      }
      if (product.status === 'hidden' && !isAdmin(event.headers)) {
        return jsonResponse(404, { error: 'Product not found' });
      }
      return jsonResponse(200, product);
    }

    if (method === 'PUT') {
      if (!isAdmin(event.headers)) {
        return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
      }
      const index = db.products.findIndex((p) => p.id === identifier);
      if (index === -1) {
        return jsonResponse(404, { error: 'Product not found' });
      }

      const current = db.products[index];
      const data = body;
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
        id: identifier,
        price,
        originalPrice,
        discountPercent,
        categoryName: category?.name || current.categoryName,
        updatedAt: new Date().toISOString(),
      };

      db.products[index] = updated;
      writeDb(db);
      return jsonResponse(200, updated);
    }

    if (method === 'DELETE') {
      if (!isAdmin(event.headers)) {
        return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
      }
      db.products = db.products.filter((p) => p.id !== identifier);
      writeDb(db);
      return jsonResponse(200, { success: true, message: 'Product deleted permanently' });
    }
  }

  // 14. Image Upload (Admin only)
  if (subpath === '/upload' && method === 'POST') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator authentication required.' });
    }
    const { data, filename } = body;
    if (!data) {
      return jsonResponse(400, { error: 'No image data provided' });
    }
    // Return base64 data URI directly for serverless hosting compatibility
    return jsonResponse(200, {
      success: true,
      url: data,
      filename: filename || 'uploaded_image',
    });
  }

  // 15. Customer Google Login
  if (subpath === '/customer/login-google' && method === 'POST') {
    const { email, name, avatarUrl, id, metadata } = body;
    if (!email) {
      return jsonResponse(400, { error: 'Email is required' });
    }
    const db = readDb();
    if (!db.customerLogins) db.customerLogins = [];

    const cleanEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    let customerRecord = db.customerLogins.find((c) => c.email === cleanEmail);

    if (customerRecord) {
      customerRecord.lastSignInAt = now;
      customerRecord.loginCount = (customerRecord.loginCount || 1) + 1;
      if (name) customerRecord.name = name;
      if (avatarUrl) customerRecord.avatarUrl = avatarUrl;
    } else {
      customerRecord = {
        id: id || `google_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        avatarUrl: avatarUrl || undefined,
        provider: 'google',
        lastSignInAt: now,
        loginCount: 1,
        createdAt: now,
        metadata: { ...metadata, registeredIp: clientIp },
      };
      db.customerLogins.push(customerRecord);
    }
    writeDb(db);
    return jsonResponse(200, {
      success: true,
      user: customerRecord,
      message: 'Google login recorded successfully',
    });
  }

  // 16. Customer Logins List (Admin only)
  if (subpath === '/customer/logins' && method === 'GET') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator access required.' });
    }
    const db = readDb();
    return jsonResponse(200, db.customerLogins || []);
  }

  // 17. Supabase Connection Status (Admin only)
  if (subpath === '/supabase/status' && method === 'GET') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator access required.' });
    }
    const db = readDb();
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY);

    return jsonResponse(200, {
      configured: Boolean(supabaseUrl && hasKey),
      supabaseUrl: supabaseUrl ? supabaseUrl.replace(/\.co.*/, '.co') : null,
      customerLoginsRecorded: db.customerLogins?.length || 0,
      databaseType: 'Supabase PostgreSQL + High-speed Serverless Storage',
    });
  }

  // 18. Supabase Schema SQL (Admin only)
  if (subpath === '/supabase/schema-sql' && method === 'GET') {
    if (!isAdmin(event.headers)) {
      return jsonResponse(403, { error: 'Unauthorized: Administrator access required.' });
    }
    const sql = `-- Supabase Schema for SIRI Official E-Commerce Store
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    stock_count INTEGER DEFAULT 10,
    stock_status TEXT DEFAULT 'in_stock',
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customer_logins (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'google',
    last_sign_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    login_count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
      body: sql,
    };
  }

  // Fallback 404
  return jsonResponse(404, {
    error: `Endpoint not found: ${method} ${subpath}`,
  });
};

export default handler;
