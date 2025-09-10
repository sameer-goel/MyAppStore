import express from 'express';
import cors from 'cors';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import {
  listCategories,
  listSubcategories,
  listApps,
  createApp,
  updateApp,
  deleteApp,
  getApp,
  upsertCategory,
  upsertSubcategory,
  deleteCategory,
  deleteSubcategory,
} from './repo.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Categories
app.get('/api/categories', async (req, res) => {
  try { res.json(await listCategories()); } catch (e) { console.error(e); res.status(500).json({ error: 'listCategories failed' }); }
});

app.post('/api/categories', async (req, res) => {
  try { await upsertCategory(req.body || {}); res.status(201).json({ ok: true }); } catch (e) { console.error(e); res.status(400).json({ error: 'upsertCategory failed', detail: e?.message }); }
});

app.put('/api/categories/:catKey', async (req, res) => {
  const { catKey } = req.params;
  try { await upsertCategory({ ...req.body, catKey }); res.json({ ok: true }); } catch (e) { console.error(e); res.status(400).json({ error: 'upsertCategory failed', detail: e?.message }); }
});

app.delete('/api/categories/:catKey', async (req, res) => {
  const { catKey } = req.params; const force = ['1','true','yes'].includes(String(req.query.force||'').toLowerCase());
  try { await deleteCategory({ catKey, force }); res.status(204).end(); } catch (e) { console.error(e); res.status(400).json({ error: 'deleteCategory failed', detail: e?.message }); }
});

// Subcategories within a category
app.get('/api/categories/:catKey/subcategories', async (req, res) => {
  try { res.json(await listSubcategories(req.params.catKey)); } catch (e) { console.error(e); res.status(500).json({ error: 'listSubcategories failed' }); }
});

app.post('/api/subcategories', async (req, res) => {
  try { await upsertSubcategory(req.body || {}); res.status(201).json({ ok: true }); } catch (e) { console.error(e); res.status(400).json({ error: 'upsertSubcategory failed', detail: e?.message }); }
});

app.put('/api/subcategories/:catKey/:subKey', async (req, res) => {
  const { catKey, subKey } = req.params;
  try { await upsertSubcategory({ ...req.body, catKey, subKey }); res.json({ ok: true }); } catch (e) { console.error(e); res.status(400).json({ error: 'upsertSubcategory failed', detail: e?.message }); }
});

app.delete('/api/subcategories/:catKey/:subKey', async (req, res) => {
  const { catKey, subKey } = req.params; const force = ['1','true','yes'].includes(String(req.query.force||'').toLowerCase());
  try { await deleteSubcategory({ catKey, subKey, force }); res.status(204).end(); } catch (e) { console.error(e); res.status(400).json({ error: 'deleteSubcategory failed', detail: e?.message }); }
});

// Apps within a subcategory
app.get('/api/categories/:catKey/subcategories/:subKey/apps', async (req, res) => {
  const { catKey, subKey } = req.params;
  try { res.json(await listApps(catKey, subKey)); } catch (e) { console.error(e); res.status(500).json({ error: 'listApps failed' }); }
});

// App CRUD
app.post('/api/apps', async (req, res) => {
  try {
    const item = await createApp(req.body || {});
    res.status(201).json(item);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'createApp failed', detail: e?.message });
  }
});

app.put('/api/apps/:catKey/:subKey/:slug', async (req, res) => {
  const { catKey, subKey, slug } = req.params;
  try {
    await updateApp({ catKey, subKey, slug, patch: req.body || {} });
    const item = await getApp({ catKey, subKey, slug });
    res.json(item || {});
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'updateApp failed', detail: e?.message });
  }
});

app.delete('/api/apps/:catKey/:subKey/:slug', async (req, res) => {
  const { catKey, subKey, slug } = req.params;
  try {
    await deleteApp({ catKey, subKey, slug });
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: 'deleteApp failed', detail: e?.message });
  }
});

// Optional: S3 signed upload for custom icons
app.post('/api/uploads/icon', async (req, res) => {
  try {
    const { filename, contentType } = req.body || {};
    const BUCKET = process.env.S3_BUCKET;
    const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';
    if (!BUCKET) return res.status(400).json({ error: 'missing_bucket', message: 'Set S3_BUCKET env to enable uploads' });
    const key = `icons/${new Date().toISOString().slice(0,10)}/${randomUUID()}-${(filename||'icon').replace(/[^a-zA-Z0-9._-]/g,'_')}`;
    const s3 = new S3Client({ region: REGION });
    const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType || 'application/octet-stream', ACL: 'public-read' });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
    const publicUrlBase = process.env.S3_PUBLIC_BASE || `https://${BUCKET}.s3.${REGION}.amazonaws.com`;
    const publicUrl = `${publicUrlBase}/${key}`;
    res.json({ uploadUrl, publicUrl, key });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'upload_presign_failed', detail: e?.message });
  }
});

// GitHub contents upload (base64) → returns raw URL
app.post('/api/uploads/github', async (req, res) => {
  try {
    const { filename, contentType, contentBase64 } = req.body || {};
    if (!filename || !contentBase64) return res.status(400).json({ error: 'bad_request', message: 'filename and contentBase64 required' });
    const TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.GITHUB_OWNER;
    const REPO = process.env.GITHUB_REPO;
    const BRANCH = process.env.GITHUB_BRANCH || 'main';
    const PREFIX = process.env.GITHUB_PATH_PREFIX || 'assets/icons/';
    if (!TOKEN || !OWNER || !REPO) return res.status(400).json({ error: 'missing_github_env', message: 'Set GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO' });
    const cleanName = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${PREFIX}${new Date().toISOString().slice(0,10)}/${randomUUID()}-${cleanName}`;
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(path)}`;
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: `Add ${path}`, content: contentBase64, branch: BRANCH }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      return res.status(400).json({ error: 'github_upload_failed', detail: text });
    }
    const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${path}`;
    res.json({ publicUrl: RAW, path, contentType });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'github_upload_error', detail: e?.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
