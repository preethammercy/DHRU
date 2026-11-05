const NSE = 'https://www.nseindia.com';
let cookieValue = '';
let cookieAt = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function renewCookie() {
  const response = await fetch(`${NSE}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', Accept: 'text/html,application/xhtml+xml' }
  });
  const cookies = response.headers.getSetCookie?.() || [];
  cookieValue = cookies.map(c => c.split(';', 1)[0]).filter(Boolean).join('; ');
  cookieAt = Date.now();
  if (!cookieValue) throw new Error('NSE did not provide a session cookie');
}

export async function fetchNsePublic(path, params = {}) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (!cookieValue || Date.now() - cookieAt > 3 * 60_000) await renewCookie();
      const url = new URL(path, NSE);
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
          Accept: 'application/json, text/plain, */*', 'Accept-Language': 'en-US,en;q=0.9',
          Referer: `${NSE}/`, Origin: NSE, Cookie: cookieValue
        }
      });
      if (response.status === 401 || response.status === 403) { cookieAt = 0; throw new Error(`NSE session rejected (${response.status})`); }
      if (response.status === 429 || response.status >= 500) throw new Error(`NSE returned ${response.status}`);
      if (!response.ok) throw new Error(`NSE returned ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await sleep(250 * (attempt + 1));
    }
  }
  throw lastError || new Error('NSE data unavailable');
}
