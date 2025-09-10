export async function apiGet(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

export async function apiJson(method, path, body) {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${path} ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const listCategories = () => apiGet('/api/categories');
export const listSubcategories = (catKey) => apiGet(`/api/categories/${encodeURIComponent(catKey)}/subcategories`);
export const listApps = (catKey, subKey) => apiGet(`/api/categories/${encodeURIComponent(catKey)}/subcategories/${encodeURIComponent(subKey)}/apps`);

export const createApp = (payload) => apiJson('POST', '/api/apps', payload);
export const updateApp = (catKey, subKey, slug, patch) => apiJson('PUT', `/api/apps/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}/${encodeURIComponent(slug)}`, patch);
export const deleteApp = (catKey, subKey, slug) => apiJson('DELETE', `/api/apps/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}/${encodeURIComponent(slug)}`);

// Category CRUD
export const createCategory = (payload) => apiJson('POST', '/api/categories', payload);
export const updateCategory = (catKey, patch) => apiJson('PUT', `/api/categories/${encodeURIComponent(catKey)}`, patch);
export const deleteCategory = (catKey, { force = false } = {}) => apiJson('DELETE', `/api/categories/${encodeURIComponent(catKey)}${force ? '?force=1' : ''}`);

// Subcategory CRUD
export const createSubcategory = (payload) => apiJson('POST', '/api/subcategories', payload);
export const updateSubcategory = (catKey, subKey, patch) => apiJson('PUT', `/api/subcategories/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}`, patch);
export const deleteSubcategory = (catKey, subKey, { force = false } = {}) => apiJson('DELETE', `/api/subcategories/${encodeURIComponent(catKey)}/${encodeURIComponent(subKey)}${force ? '?force=1' : ''}`);

// Uploads
export async function getIconUploadUrl(filename, contentType) {
  return apiJson('POST', '/api/uploads/icon', { filename, contentType })
}

export async function uploadIconToGithub(filename, contentType, contentBase64) {
  return apiJson('POST', '/api/uploads/github', { filename, contentType, contentBase64 })
}
