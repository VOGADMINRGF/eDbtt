export async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 500) {
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      try { return await fn(); } 
      catch (e) { lastErr = e; if (i < retries) await new Promise(r => setTimeout(r, delayMs * (i+1))); }
    }
    throw lastErr;
  }
  