# DynamoDB Admin Guide — Interactive Portfolio

This document gives DB admins everything needed to provision the DynamoDB table(s), and provides tested CRUD code snippets and CLI commands so the app can read/write portfolio data easily.

Scope
- Table design for Categories, Subcategories, and Apps (single-table).
- CLI commands to create/delete the table and verify indexes.
- Seed commands to insert sample items.
- CRUD with AWS SDK for JavaScript v3 (Node.js) including tests for each operation.
- Safe operational tips (PITR, backups, throughput, cost).

Prereqs
- AWS account with permissions for DynamoDB.
- Default AWS profile configured (region set to `us-west-2`).
- AWS CLI v2 and Node.js 18+ on your machine.

Table Design (Single-Table)
- Table name: `Portfolio`
- Primary keys: `PK` (partition, String), `SK` (sort, String)
- GSI1 (already created): global listing by entity type
  - Partition key: `entityType` (String)
  - Sort key: `SK` (String)
  - Used to list all Categories; Subcategory/App listing uses primary keys.

Final Entity Shapes (we use these attrs going forward)
- Category
  - Keys: `PK = CAT#{catKey}`, `SK = META`
  - Required attrs:
    - `entityType: 'Category'`
    - `catKey: string` (unique)
    - `name: string`
  - Optional attrs (recommended):
    - `tagline: string`
    - `gradient: string` (UI theme)
    - `iconKey: string` (UI icon key)
    - `order: number` (client-side sort)
    - `status: 'active'|'archived'` (default 'active')
    - `subCount: number` (maintained by app, optional)
    - `appCount: number` (maintained by app, optional)
    - `createdAt: ISO8601` (set on first create) / `updatedAt: ISO8601` (on every upsert)

- Subcategory
  - Keys: `PK = CAT#{catKey}`, `SK = SUB#{subKey}`
  - Required attrs:
    - `entityType: 'Subcategory'`
    - `catKey: string`
    - `subKey: string` (unique within category)
    - `name: string`
  - Optional attrs (recommended):
    - `blurb: string`
    - `iconKey: string`
    - `order: number` (client-side sort)
    - `status: 'active'|'archived'` (default 'active')
    - `appCount: number` (maintained by app, optional)
    - `createdAt: ISO8601` / `updatedAt: ISO8601`

- App
  - Keys: `PK = CAT#{catKey}#SUB#{subKey}`, `SK = APP#{slug}`
  - Required attrs:
    - `entityType: 'App'`
    - `catKey: string`
    - `subKey: string`
    - `slug: string` (slugify(name))
    - `name: string`
  - Optional attrs (recommended):
    - `desc: string`
    - `details: string`
    - `mediaUrl: string` (preview modal)
    - `thumbUrl: string` (square logo for grids; optional)
    - `iconId: string` (Iconify icon id, e.g., `token-branded:btc`; optional)
    - `iconUploadUrl: string` (uploaded custom icon URL; optional)
    - `iconSource: 'iconify'|'upload'|''` (how to render the icon; optional)
    - `publicUrl: string` (live link to the app)
    - `iconIndex: number` (curated icon choices)
    - `order: number` (client-side sort)
    - `status: 'active'|'archived'` (default 'active')
    - `createdAt: ISO8601` / `updatedAt: ISO8601`

Entity Shapes
- Category
  - PK: `CAT#{catKey}`
  - SK: `META`
  - entityType: `Category`
  - attrs: `catKey`, `name`, `tagline`, `gradient`, `iconKey`, `order`
- Subcategory
  - PK: `CAT#{catKey}`
  - SK: `SUB#{subKey}`
  - entityType: `Subcategory`
  - attrs: `catKey`, `subKey`, `name`, `blurb`, `iconKey`, `order`
- App
  - PK: `CAT#{catKey}#SUB#{subKey}`
  - SK: `APP#{slug}`
  - entityType: `App`
  - attrs: `catKey`, `subKey`, `slug`, `name`, `desc`, `details`, `mediaUrl`, `iconIndex`, `createdAt`, `updatedAt`

Icon precedence (rendering)
- If `iconUploadUrl` is set → show uploaded image (square).
- Else if `iconId` is set → render Iconify icon.
- Else if `thumbUrl` is set → show thumb image.
- Else fall back to curated lucide icon (by `iconIndex`).

Why this layout
- Efficient list patterns using Query:
  - List categories: GSI1 query `entityType = 'Category'` (or cache client-side).
  - List subcategories: Query `PK = CAT#{catKey}` with `begins_with(SK,'SUB#')`.
  - List apps: Query `PK = CAT#{catKey}#SUB#{subKey}` with `begins_with(SK,'APP#')`.
- Simple ordering: sort by numeric `order` client-side after each Query.
- Natural uniqueness with composite keys (catKey/subKey/slug).
- Soft delete ready via `status` and optional TTL for purge.

Notes on Ordering and Indexing
- We keep SKs stable (`META`, `SUB#{subKey}`, `APP#{slug}`) and do client-side sort by `order`.
- Current GSI1 is `entityType + SK` and works for listing Categories globally.
- If future server-side ordered listings are needed, we can add a new GSI on a `sort1` attribute (e.g., `0001#education`). No change now.

Create Table (CLI)
```bash
aws dynamodb create-table \
  --table-name Portfolio \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=entityType,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes 'IndexName=GSI1,KeySchema=[{AttributeName=entityType,KeyType=HASH},{AttributeName=SK,KeyType=RANGE}],Projection={ProjectionType=ALL}' \
  --region us-west-2

# Optional hardening
aws dynamodb update-continuous-backups \
  --table-name Portfolio \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
```

Verify Table / Indexes
```bash
aws dynamodb describe-table --table-name Portfolio | rg -n "TableStatus|KeySchema|GlobalSecondaryIndexes|BillingModeSummary" -n
```

Delete Table (Cleanup)
```bash
aws dynamodb delete-table --table-name Portfolio
```

Seed Minimal Data (CLI)
```bash
aws dynamodb put-item --table-name Portfolio --item '{
  "PK": {"S": "CAT#ai"},
  "SK": {"S": "META"},
  "entityType": {"S": "Category"},
  "catKey": {"S": "ai"},
  "name": {"S": "ARTIFICIAL INTELLIGENCE"},
  "tagline": {"S": "Systems that learn, assist, and amplify human potential."},
  "gradient": {"S": "from-cyan-500 to-blue-600"},
  "iconKey": {"S": "Brain"},
  "order": {"N": "1"},
  "status": {"S": "active"}
}'

aws dynamodb put-item --table-name Portfolio --item '{
  "PK": {"S": "CAT#ai"},
  "SK": {"S": "SUB#education"},
  "entityType": {"S": "Subcategory"},
  "catKey": {"S": "ai"},
  "subKey": {"S": "education"},
  "name": {"S": "Education"},
  "blurb": {"S": "Personalized learning and mastery tracking."},
  "iconKey": {"S": "GraduationCap"},
  "order": {"N": "1"},
  "status": {"S": "active"}
}'

aws dynamodb put-item --table-name Portfolio --item '{
  "PK": {"S": "CAT#ai#SUB#education"},
  "SK": {"S": "APP#ai-tutor"},
  "entityType": {"S": "App"},
  "catKey": {"S": "ai"},
  "subKey": {"S": "education"},
  "slug": {"S": "ai-tutor"},
  "name": {"S": "AI Tutor"},
  "desc": {"S": "Conversational tutor that adapts to your level and pace."},
  "details": {"S": "Curriculum-aware sessions, spaced repetition, and concept maps."},
  "mediaUrl": {"S": ""},
  "iconIndex": {"N": "0"},
  "status": {"S": "active"},
  "createdAt": {"S": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"},
  "updatedAt": {"S": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
}'
```

List Data (CLI tests)
```bash
# List all categories (GSI1)
aws dynamodb query \
  --table-name Portfolio \
  --index-name GSI1 \
  --key-condition-expression "entityType = :t" \
  --expression-attribute-values '{":t":{"S":"Category"}}'

# List subcategories for catKey=ai
aws dynamodb query \
  --table-name Portfolio \
  --key-condition-expression "PK = :pk AND begins_with(SK, :pref)" \
  --expression-attribute-values '{":pk":{"S":"CAT#ai"},":pref":{"S":"SUB#"}}'

# List apps for ai/education
aws dynamodb query \
  --table-name Portfolio \
  --key-condition-expression "PK = :pk AND begins_with(SK, :pref)" \
  --expression-attribute-values '{":pk":{"S":"CAT#ai#SUB#education"},":pref":{"S":"APP#"}}'
```

Node.js SDK v3 Setup
```bash
npm i @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

env
```bash
export AWS_REGION=us-west-2
export DDB_TABLE=Portfolio
```

Repository Snippets (CRUD)
```js
// repo.js
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-west-2" });
const ddb = DynamoDBDocumentClient.from(client);
const TableName = process.env.DDB_TABLE || "Portfolio";

// Helpers
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const appKey = (catKey, subKey, nameOrSlug) => ({
  PK: `CAT#${catKey}#SUB#${subKey}`,
  SK: `APP#${slugify(nameOrSlug)}`,
});

// Create or Update Category
export async function upsertCategory({ catKey, name, tagline, gradient, iconKey, order = 0 }) {
  const Item = {
    PK: `CAT#${catKey}`,
    SK: "META",
    entityType: "Category",
    catKey, name, tagline, gradient, iconKey, order,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName, Item }));
  return Item;
}

// Create or Update Subcategory
export async function upsertSubcategory({ catKey, subKey, name, blurb, iconKey, order = 0 }) {
  const Item = {
    PK: `CAT#${catKey}`,
    SK: `SUB#${subKey}`,
    entityType: "Subcategory",
    catKey, subKey, name, blurb, iconKey, order,
    updatedAt: new Date().toISOString(),
  };
  await ddb.send(new PutCommand({ TableName, Item }));
  return Item;
}

// Create App
export async function createApp({ catKey, subKey, name, desc = "", details = "", mediaUrl = "", iconIndex = 0 }) {
  const slug = slugify(name);
  const now = new Date().toISOString();
  const Item = {
    ...appKey(catKey, subKey, slug),
    entityType: "App",
    catKey, subKey, slug, name, desc, details, mediaUrl, iconIndex,
    createdAt: now, updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName, Item, ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)" }));
  return Item;
}

// Update App (partial)
export async function updateApp({ catKey, subKey, slug, patch }) {
  const Key = appKey(catKey, subKey, slug);
  const sets = [];
  const names = {};
  const values = { ":updatedAt": new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) { sets.push(`#${k} = :${k}`); names[`#${k}`] = k; values[":" + k] = v; }
  sets.push("updatedAt = :updatedAt");
  const UpdateExpression = `SET ${sets.join(", ")}`;
  await ddb.send(new UpdateCommand({ TableName, Key, UpdateExpression, ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
}

// Delete App
export async function deleteApp({ catKey, subKey, slug }) {
  const Key = appKey(catKey, subKey, slug);
  await ddb.send(new DeleteCommand({ TableName, Key }));
}

// Get App
export async function getApp({ catKey, subKey, slug }) {
  const Key = appKey(catKey, subKey, slug);
  const { Item } = await ddb.send(new GetCommand({ TableName, Key }));
  return Item;
}

// List Categories
export async function listCategories() {
  const { Items } = await ddb.send(new QueryCommand({
    TableName,
    IndexName: "GSI1",
    KeyConditionExpression: "entityType = :t",
    ExpressionAttributeValues: { ":t": "Category" },
  }));
  return Items || [];
}

// List Subcategories for a category
export async function listSubcategories(catKey) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :pref)",
    ExpressionAttributeValues: { ":pk": `CAT#${catKey}`, ":pref": "SUB#" },
  }));
  return Items || [];
}

// List Apps for a subcategory
export async function listApps(catKey, subKey) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :pref)",
    ExpressionAttributeValues: { ":pk": `CAT#${catKey}#SUB#${subKey}`, ":pref": "APP#" },
  }));
  return Items || [];
}
```

CRUD Test Script (Node.js)
```js
// test-crud.js
import {
  upsertCategory, upsertSubcategory, createApp, updateApp, deleteApp,
  getApp, listCategories, listSubcategories, listApps
} from "./repo.js";

const catKey = "ai";
const subKey = "education";

async function run() {
  console.log("Upsert category...");
  await upsertCategory({ catKey, name: "ARTIFICIAL INTELLIGENCE", tagline: "Systems that learn, assist, and amplify human potential.", gradient: "from-cyan-500 to-blue-600", iconKey: "Brain", order: 1 });

  console.log("Upsert subcategory...");
  await upsertSubcategory({ catKey, subKey, name: "Education", blurb: "Personalized learning and mastery tracking.", iconKey: "GraduationCap", order: 1 });

  console.log("Create app...");
  await createApp({ catKey, subKey, name: "AI Tutor", desc: "Conversational tutor", details: "Socratic", mediaUrl: "", iconIndex: 0 });

  console.log("List categories/subs/apps...");
  console.log(await listCategories());
  console.log(await listSubcategories(catKey));
  console.log(await listApps(catKey, subKey));

  console.log("Update app...");
  await updateApp({ catKey, subKey, slug: "ai-tutor", patch: { desc: "Conversational tutor (updated)" } });
  console.log(await getApp({ catKey, subKey, slug: "ai-tutor" }));

  console.log("Delete app...");
  await deleteApp({ catKey, subKey, slug: "ai-tutor" });
  console.log("Verify deletion ->", await getApp({ catKey, subKey, slug: "ai-tutor" }));
}

run().catch((e) => { console.error(e); process.exit(1); });
```

Run Tests
```bash
export AWS_REGION=us-west-2
export DDB_TABLE=Portfolio

# 1) Create table (once)
# aws dynamodb create-table ... (see above)

# 2) Install deps and run tests
npm i @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
node test-crud.js
```

Python CRUD Test Harness
- Files: `db_tests/ddb_repo.py`, `db_tests/python_crud_test.py`, `db_tests/requirements.txt`
- Setup and run:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r db_tests/requirements.txt
export AWS_REGION=us-west-2
export DDB_TABLE=Portfolio
python db_tests/python_crud_test.py --ensure-table
```
This will: ensure the table exists (with GSI1), upsert a category and subcategory, create an app, list categories/subs/apps, update the app, fetch it, then delete it and verify deletion.

Operational Tips
- Cost: PAY_PER_REQUEST is simplest and cost-effective for low/variable traffic.
- Backups: Enable PITR and consider periodic exports to S3 for long-term backups.
- Throughput issues: If moving to PROVISIONED, start with small RCUs/WCUs and autoscale.
- Data migration: Keep seed scripts versioned; plan idempotent upserts for content updates.
- Observability: CloudWatch metrics (ConsumedRead/WriteCapacityUnits), throttles, latency.

Next Steps for Integration
- Backend API: Implemented in `server/` (Express) with routes: list categories/subcategories/apps and App CRUD.
- Frontend: `src/Me.jsx` now loads from API and supports Admin add/edit/delete for apps.

---

## Image Storage (S3) — Snippets and Tests

We store image URLs in DynamoDB, and optionally upload binaries to S3 via presigned PUT URLs.

Summary
- DB stores only URLs: `thumbUrl`, `mediaUrl`, `iconUploadUrl` (custom icon), plus optional `iconId` (Iconify).
- Upload flow (recommended): client asks API for presigned URL → PUT file to S3 → save returned public URL in DB.

Env Vars
- `AWS_REGION` (or `AWS_DEFAULT_REGION`) — e.g., `us-west-2`
- `S3_BUCKET` — your bucket name (required to enable uploads)
- `S3_PUBLIC_BASE` (optional) — CDN/base URL for returned public links, else defaults to `https://<bucket>.s3.<region>.amazonaws.com`

Server Route (already implemented)
- `POST /api/uploads/icon` → `{ uploadUrl, publicUrl, key }`
  - Body: `{ filename, contentType }`
  - Upload by PUT to `uploadUrl` with header `Content-Type: <same>`
  - Save `publicUrl` into `iconUploadUrl` in the App record

Bucket CORS (example)
```json
[
  {
    "AllowedOrigins": ["http://localhost:5173", "https://your-domain"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```
Apply with AWS CLI:
```bash
aws s3api put-bucket-cors --bucket $S3_BUCKET --cors-configuration file://bucket-cors.json
```

Public access note
- For simple public URLs, ensure your bucket policy or object ACLs allow reads. The server presign endpoint uses `ACL: public-read` on PUT objects.

Client Upload (cURL via API presign)
```bash
# 1) Get a presigned upload URL
curl -s -X POST http://localhost:4000/api/uploads/icon \
  -H 'Content-Type: application/json' \
  -d '{"filename":"icon.png","contentType":"image/png"}' | tee /tmp/presign.json

# 2) Upload to S3
UPLOAD_URL=$(jq -r .uploadUrl /tmp/presign.json)
PUBLIC_URL=$(jq -r .publicUrl /tmp/presign.json)
curl -s -X PUT -H 'Content-Type: image/png' --data-binary @icon.png "$UPLOAD_URL"
echo "Public URL: $PUBLIC_URL"
```

Node.js Presign Example (no server)
```js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'us-west-2';
const BUCKET = process.env.S3_BUCKET;
const Key = `icons/${new Date().toISOString().slice(0,10)}/test.png`;
const s3 = new S3Client({ region: REGION });
const cmd = new PutObjectCommand({ Bucket: BUCKET, Key, ContentType: 'image/png', ACL: 'public-read' });
const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
console.log({ uploadUrl });
```

Python Presign + Upload Example (no server)
```python
import os, requests
import boto3
from botocore.client import Config

REGION = os.getenv('AWS_REGION', 'us-west-2')
BUCKET = os.environ['S3_BUCKET']
KEY = f"icons/test-{os.getpid()}.png"

s3 = boto3.client('s3', region_name=REGION, config=Config(signature_version='s3v4'))
presigned = s3.generate_presigned_url(
    'put_object',
    Params={'Bucket': BUCKET, 'Key': KEY, 'ContentType': 'image/png', 'ACL': 'public-read'},
    ExpiresIn=300,
)

# Upload bytes (replace with your PNG file bytes)
r = requests.put(presigned, data=b'PNGDATA', headers={'Content-Type':'image/png'})
r.raise_for_status()
public_url = f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{KEY}"
print('Public URL:', public_url)
```

Python Test Harness (added)
- `db_tests/s3_upload_test.py` — presigns via boto3 and uploads; prints public URL.

Run:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r db_tests/requirements.txt
export AWS_REGION=us-west-2
export S3_BUCKET=your-bucket
python db_tests/s3_upload_test.py
```

Once verified, use the App Editor modal upload to attach custom icons (or extend with uploads for `thumbUrl` / `mediaUrl`).

---

## Image Storage (GitHub) — Snippets and Tests

If hosting on GitHub (Pages or a CI‑driven deploy), you can store image binaries in the repo and serve them via raw.githubusercontent.com or your Pages site.

Approach
- Use the GitHub Contents API to add files under a known folder (e.g., `assets/icons/` or `interactive-portfolio/public/uploads/icons/`).
- Store only the resulting public raw URL in DynamoDB (e.g., `iconUploadUrl` or `thumbUrl`).
- For large files, consider Git LFS or GitHub Releases assets (not needed for small icons).

Env Vars (for tests and future backend integration)
- `GITHUB_TOKEN` — a PAT with `repo` scope (or a fine‑grained token allowing contents:write)
- `GITHUB_OWNER` — your GitHub username or org
- `GITHUB_REPO` — repository name
- `GITHUB_BRANCH` — branch (default `main`)

cURL (create file)
```bash
export GITHUB_TOKEN=ghp_xxx
export GITHUB_OWNER=yourname
export GITHUB_REPO=yourrepo
export GITHUB_BRANCH=main
PATH_IN_REPO="assets/icons/test-$(date +%s).txt"
CONTENT_B64=$(printf "hello from github upload test" | base64)

curl -s -X PUT \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d "{\"message\":\"Add test asset\",\"content\":\"$CONTENT_B64\",\"branch\":\"$GITHUB_BRANCH\"}" \
  "https://api.github.com/repos/$GITHUB_OWNER/$GITHUB_REPO/contents/$PATH_IN_REPO" | tee /tmp/gh-upload.json

RAW_URL="https://raw.githubusercontent.com/$GITHUB_OWNER/$GITHUB_REPO/$GITHUB_BRANCH/$PATH_IN_REPO"
echo "Raw URL: $RAW_URL"
```

Node.js test (db_tests/github_upload_test.js)
```bash
node db_tests/github_upload_test.js
```
Outputs the raw URL for the uploaded test file.

Python (requests) is similar — recommend Node for simplicity since `fetch` is built‑in.

Notes
- Public access: raw URLs are public by default on public repos. For private repos, you’ll need a different hosting strategy (Pages or a proxy).
- Paths: for Vite/Pages, placing files under `interactive-portfolio/public/uploads/...` lets them ship with the site; Contents API can still write there.
- Governance: committing uploads grows git history; prefer small assets (icons/thumbnails). For larger media, S3 or Releases assets is preferable.

Integration Plan (after tests)
- Add a backend route that accepts a file (or base64) and creates a commit to the repo using the Contents API, returning the raw URL.
- Guard with server‑side `GITHUB_TOKEN` and whitelisted path (e.g., `public/uploads/icons/`), then update the editor modal to call it when `STORAGE=github`.
