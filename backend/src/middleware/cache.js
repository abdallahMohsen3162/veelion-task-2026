const cache = new Map();

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
  if (cache.has(key)) {
    const entry = cache.get(key);
    return res.status(entry.status).json(entry.body);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      cache.set(key, { status: res.statusCode, body });
    }
    return originalJson(body);
  };

  return next();
}

module.exports = {
  cacheMiddleware,
  clearCache,
};
