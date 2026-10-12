/**
 * SIRI E-Commerce API Utility
 * Provides safe JSON fetching, base URL resolution, and secure error handling.
 */

// Resolves optional external backend URL (e.g. when frontend is on Netlify and backend on Cloud Run/Render)
export const getApiBaseUrl = (): string => {
  try {
    const envUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
      '';
    return String(envUrl).replace(/\/+$/, '');
  } catch {
    return '';
  }
};

export const apiPath = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
};

export interface SafeJsonResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  isHtml?: boolean;
}

/**
 * Safely fetches and parses JSON responses from the API.
 * Detects and intercepts non-JSON/HTML responses (such as SPA fallbacks to index.html or 404 pages)
 * to prevent JSON parsing exceptions (e.g. "Unexpected token '<'").
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeJsonResponse<T>> {
  try {
    const res = await fetch(url, options);
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isJson = contentType.includes('application/json');

    // Handle non-JSON responses (HTML, plain text, etc.)
    if (!isJson) {
      let previewText = '';
      try {
        const text = await res.text();
        previewText = text.slice(0, 150).trim();
      } catch {
        // Ignored
      }

      const isHtml =
        contentType.includes('text/html') ||
        previewText.startsWith('<') ||
        previewText.toLowerCase().includes('<!doctype');

      let userFriendlyMessage = 'Authentication service returned an unexpected response.';

      if (res.status === 404) {
        userFriendlyMessage =
          'API endpoint not found (404). If deployed on Netlify, please verify that Netlify Functions or API rewrite rules are active.';
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        userFriendlyMessage =
          'The backend service is temporarily unavailable or unreachable. Please try again shortly.';
      } else if (isHtml) {
        userFriendlyMessage =
          'Received an HTML page instead of API data. The server or host may be redirecting API calls to index.html.';
      } else if (!res.ok) {
        userFriendlyMessage = `Server request failed with status code ${res.status}.`;
      }

      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`[safeFetchJson] Non-JSON response from ${url}:`, {
          status: res.status,
          contentType,
          preview: previewText.slice(0, 60),
        });
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: userFriendlyMessage,
        isHtml,
      };
    }

    // Response has application/json content-type: safe to parse
    try {
      const data = await res.json();
      const errorMessage =
        !res.ok
          ? data?.message || data?.error || `Request failed with status ${res.status}`
          : undefined;

      return {
        ok: res.ok,
        status: res.status,
        data,
        error: errorMessage,
        isHtml: false,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: 'Unable to parse server response as valid JSON.',
        isHtml: false,
      };
    }
  } catch (networkErr: any) {
    // Network failure (offline, DNS failure, CORS blocked, or connection refused)
    const message =
      networkErr?.name === 'TypeError'
        ? 'Could not connect to the backend server. Please verify network connectivity.'
        : networkErr?.message || 'Network request failed.';

    return {
      ok: false,
      status: 0,
      data: null,
      error: message,
      isHtml: false,
    };
  }
}
