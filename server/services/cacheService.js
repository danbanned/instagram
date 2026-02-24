const memoryCache = new Map();

function get(key) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function set(key, value, ttlMs = 15000) {
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function del(key) {
  memoryCache.delete(key);
}

module.exports = { get, set, del };
