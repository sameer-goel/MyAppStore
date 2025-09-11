const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || (typeof window !== 'undefined' && window.__API_BASE__) || ''
const IS_PAGES = typeof window !== 'undefined' && /github\.io$/.test(window.location.hostname)
const USE_MOCK = IS_PAGES && !API_BASE

async function apiGet(path) {
  const url = API_BASE ? API_BASE + path : path
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

async function apiJson(method, path, body) {
  const url = API_BASE ? API_BASE + path : path
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export async function listCategories() {
  if (USE_MOCK) { const mock = await import('./mock.js'); return mock.listCategories() }
  return apiGet('/api/categories')
}

export async function listSubcategories(catKey) {
  if (USE_MOCK) { const mock = await import('./mock.js'); return mock.listSubcategories(catKey) }
  return apiGet(`/api/categories/${encodeURIComponent(catKey)}/subcategories`)
}

export async function listApps(catKey, subKey) {
  if (USE_MOCK) { const mock = await import('./mock.js'); return mock.listApps(catKey, subKey) }
  return apiGet(`/api/categories/${encodeURIComponent(catKey)}/subcategories/${encodeURIComponent(subKey)}/apps`)
}

export const createApp = (payload) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('POST', '/api/apps', payload);
export const updateApp = (catKey, subKey, slug, patch) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('PUT', `/api/apps/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}/${encodeURIComponent(slug)}`, patch);
export const deleteApp = (catKey, subKey, slug) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('DELETE', `/api/apps/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}/${encodeURIComponent(slug)}`);

// Category CRUD
export const createCategory = (payload) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('POST', '/api/categories', payload);
export const updateCategory = (catKey, patch) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('PUT', `/api/categories/${encodeURIComponent(catKey)}`, patch);
export const deleteCategory = (catKey, { force = false } = {}) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('DELETE', `/api/categories/${encodeURIComponent(catKey)}${force ? '?force=1' : ''}`);

// Subcategory CRUD
export const createSubcategory = (payload) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('POST', '/api/subcategories', payload);
export const updateSubcategory = (catKey, subKey, patch) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('PUT', `/api/subcategories/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}`, patch);
export const deleteSubcategory = (catKey, subKey, { force = false } = {}) => USE_MOCK ? Promise.reject(new Error('Admin writes disabled on Pages')) : apiJson('DELETE', `/api/subcategories/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}${force ? '?force=1' : ''}`);

// Uploads
export async function getIconUploadUrl(filename, contentType) {
  if (USE_MOCK) throw new Error('Uploads disabled on Pages');
  return apiJson('POST', '/api/uploads/icon', { filename, contentType })
}

export async function uploadIconToGithub(filename, contentType, contentBase64) {
  if (USE_MOCK) throw new Error('Uploads disabled on Pages');
  return apiJson('POST', '/api/uploads/github', { filename, contentType, contentBase64 })
}
