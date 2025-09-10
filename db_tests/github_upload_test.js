/**
 * GitHub contents upload test (creates a small file and prints its raw URL).
 *
 * Env:
 *  - GITHUB_TOKEN (repo contents: write)
 *  - GITHUB_OWNER
 *  - GITHUB_REPO
 *  - GITHUB_BRANCH (optional, default: main)
 *  - GITHUB_PATH_PREFIX (optional, default: assets/icons/)
 *
 * Run: node db_tests/github_upload_test.js
 */

const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const branch = process.env.GITHUB_BRANCH || 'main';
const prefix = process.env.GITHUB_PATH_PREFIX || 'assets/icons/';

async function main() {
  if (!token || !owner || !repo) {
    console.error('Missing env: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
    process.exit(2);
  }
  const ts = Date.now();
  const path = `${prefix}test-${ts}.txt`;
  const contentBytes = Buffer.from('hello from github upload test\n');
  const contentB64 = contentBytes.toString('base64');

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: `Add ${path}`, content: contentB64, branch }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('GitHub API error', res.status, text);
    process.exit(1);
  }
  const data = await res.json();
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  console.log('Uploaded path:', path);
  console.log('Raw URL:', rawUrl);
}

main().catch((e) => { console.error(e); process.exit(1); });

