const cache = new Map();
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS) || 30_000;
const MAX_CACHE_ENTRIES = Number(process.env.MAX_CACHE_ENTRIES) || 100;

function buildCacheKey(req) {
  return `${req.method} ${req.originalUrl}`;
}

function isCacheable(req) {
  return req.method === 'GET';
}

function isMutating(req) {
  return req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE' || req.method === 'PUT';
}

function clearCache() {
  cache.clear();
}

function removeExpiredEntries(now = Date.now()) {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function storeEntry(key, entry) {
  removeExpiredEntries();
  while (cache.size >= MAX_CACHE_ENTRIES) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, entry);
}

function cacheMiddleware(req, res, next) {
  if (isMutating(req)) {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        clearCache();
      }
    });
    return next();
  }

  if (!isCacheable(req)) {
    return next();
  }

  const key = buildCacheKey(req);
  removeExpiredEntries();
  if (cache.has(key)) {
    const entry = cache.get(key);
    if (entry.expiresAt > Date.now()) {
      return res.status(entry.status).json(entry.body);
    }
    cache.delete(key);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      storeEntry(key, {
        status: res.statusCode,
        body,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }
    return originalJson(body);
  };

  return next();
}

module.exports = {
  cacheMiddleware,
  clearCache,
};
