import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CustomerUser } from '../types';

// Default / fallback Supabase configuration
// Users can provide these via .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
// or configure them in Store Settings
const ENV_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const ENV_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let cachedClient: SupabaseClient | null = null;
let lastUsedConfig = '';

/**
 * Get active Supabase configuration (from env or localStorage)
 */
export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const localUrl = localStorage.getItem('siri_supabase_url') || '';
  const localKey = localStorage.getItem('siri_supabase_anon_key') || '';

  const url = (ENV_SUPABASE_URL || localUrl).trim();
  const anonKey = (ENV_SUPABASE_ANON_KEY || localKey).trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey && url.startsWith('https://')),
  };
}

/**
 * Save custom Supabase credentials locally for testing/production
 */
export function setLocalSupabaseConfig(url: string, anonKey: string): void {
  if (url) localStorage.setItem('siri_supabase_url', url.trim());
  else localStorage.removeItem('siri_supabase_url');

  if (anonKey) localStorage.setItem('siri_supabase_anon_key', anonKey.trim());
  else localStorage.removeItem('siri_supabase_anon_key');

  cachedClient = null;
  lastUsedConfig = '';
}

/**
 * Returns a Supabase Client instance if credentials are valid
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  const configSignature = `${url}:${anonKey}`;
  if (cachedClient && lastUsedConfig === configSignature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    lastUsedConfig = configSignature;
    return cachedClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Store customer login details in Supabase database (free tier)
 * Table: public.customer_logins
 */
export async function recordCustomerLoginInSupabase(
  user: CustomerUser
): Promise<{ success: boolean; error?: string; message: string }> {
  const client = getSupabaseClient();

  if (!client) {
    return {
      success: false,
      message: 'Supabase client not yet configured with URL/Key. Saved to store database fallback.',
    };
  }

  try {
    const payload = {
      id: user.id,
      email: user.email.toLowerCase().trim(),
      full_name: user.name,
      avatar_url: user.avatarUrl || null,
      provider: 'google',
      last_sign_in: user.lastSignInAt || new Date().toISOString(),
      login_count: (user.loginCount || 1),
      metadata: {
        source: 'siri-customer-portal',
        platform: 'web',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      },
    };

    const { error } = await client
      .from('customer_logins')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // If table doesn't exist yet, return informative note
      console.warn('[Supabase] Upsert notice:', error.message);
      return {
        success: false,
        error: error.message,
        message: `Supabase table sync notice: ${error.message}. Login was preserved safely.`,
      };
    }

    return {
      success: true,
      message: 'Successfully stored Google customer login in Supabase database table (customer_logins)!',
    };
  } catch (err: any) {
    console.error('[Supabase] Error saving customer login:', err);
    return {
      success: false,
      error: err?.message,
      message: 'Failed to record in Supabase: ' + (err?.message || 'Network error'),
    };
  }
}

/**
 * Free Supabase SQL Schema for creating the customer_logins table
 */
export const SUPABASE_CUSTOMER_SCHEMA_SQL = `-- ========================================================
-- Supabase Schema for Customer Logins (Free Tier)
-- Run this in your Supabase Project SQL Editor (1-Click Free Setup)
-- ========================================================

-- Create customer_logins table
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.customer_logins ENABLE ROW LEVEL SECURITY;

-- Allow public upserts for Google sign-in customers
CREATE POLICY "Public upsert customer_logins" ON public.customer_logins
    FOR ALL USING (true) WITH CHECK (true);

-- Allow public read access to verify login details
CREATE POLICY "Public select customer_logins" ON public.customer_logins
    FOR SELECT USING (true);
`;
