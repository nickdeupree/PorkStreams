/**
 * CORS Proxy Utility
 * Handles fetching from APIs that might have CORS restrictions
 */

const CORS_PROXY_SERVICES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

/**
 * Fetch with CORS proxy fallback
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {boolean} useDirect - Try direct fetch first
 * @returns {Promise<Response>}
 */
export async function fetchWithProxy(url, options = {}, useDirect = true) {
  // First try direct fetch (works in dev with Vite proxy)
  // When running inside a packaged Electron app, use the main process fetch
  // helper exposed via `window.electronBridge.fetch` to avoid CORS issues.
  if (typeof window !== 'undefined' && window?.electronBridge?.fetch) {
    try {
      const electronOptions = {
        ...options,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...(options && options.headers ? options.headers : {})
        }
      };

      const electronRes = await window.electronBridge.fetch(url, electronOptions);
      if (electronRes && electronRes.ok) {
        // Create a lightweight Response-like object for callers that expect .ok/.text()
        return {
          ok: true,
          status: electronRes.status || 200,
          text: async () => electronRes.text,
          json: async () => {
            try {
              return JSON.parse(electronRes.text);
            } catch {
              throw new Error('Failed to parse JSON from electron fetch');
            }
          }
        };
      }
    } catch (err) {
      console.warn('Electron bridge fetch failed, falling back to browser fetch:', err?.message || err);
    }
  }

  if (useDirect) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...options.headers
        }
      });
      
      if (response.ok) {
        return response;
      }
      
      console.warn(`Direct fetch failed with status ${response.status}, trying proxy...`);
    } catch (error) {
      console.warn('Direct fetch failed:', error?.message || error, 'trying proxy...');
    }
  }

  // Try CORS proxy services
  for (const proxyService of CORS_PROXY_SERVICES) {
    try {
      const proxyUrl = `${proxyService}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        ...options,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          ...options.headers
        }
      });
      
      if (response.ok) {
        console.log(`Successfully fetched via proxy: ${proxyService}`);
        return response;
      }
    } catch (error) {
      console.warn(`Proxy ${proxyService} failed:`, error?.message || error);
      continue;
    }
  }

  // If all proxies fail, throw error
  throw new Error('All fetch attempts failed (direct and proxies)');
}

/**
 * Fetch JSON with CORS proxy fallback
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<any>}
 */
export async function fetchJsonWithProxy(url, options = {}) {
  const response = await fetchWithProxy(url, options);
  return response.json();
}
