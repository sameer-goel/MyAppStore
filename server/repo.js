import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const TABLE = process.env.DDB_TABLE || "Portfolio";

const client = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(client);

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const appKey = (catKey, subKey, slugOrName) => ({
  PK: `CAT#${catKey}#SUB#${subKey}`,
  SK: `APP#${slugify(slugOrName)}`,
});

export async function listCategories() {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "GSI1",
    KeyConditionExpression: "entityType = :t",
    ExpressionAttributeValues: { ":t": "Category" },
  }));
  return Items || [];
}

export async function listSubcategories(catKey) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :pref)",
    ExpressionAttributeValues: { ":pk": `CAT#${catKey}`, ":pref": "SUB#" },
  }));
  return Items || [];
}

export async function listApps(catKey, subKey) {
  const { Items } = await ddb.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :pref)",
    ExpressionAttributeValues: { ":pk": `CAT#${catKey}#SUB#${subKey}`, ":pref": "APP#" },
  }));
  return Items || [];
}

export async function createApp({ catKey, subKey, name, desc = "", details = "", mediaUrl = "", thumbUrl = "", iconIndex = 0, publicUrl = "", iconId = "", iconSource = "", iconUploadUrl = "" }) {
  const slug = slugify(name);
  const now = new Date().toISOString();
  const Item = {
    ...appKey(catKey, subKey, slug),
    entityType: "App",
    status: "active",
    catKey, subKey, slug, name, desc, details, mediaUrl, thumbUrl, iconIndex, publicUrl, iconId, iconSource, iconUploadUrl,
    createdAt: now, updatedAt: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLE, Item, ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)" }));
  return Item;
}

export async function updateApp({ catKey, subKey, slug, patch }) {
  const Key = appKey(catKey, subKey, slug);
  const sets = [];
  const names = {};
  const values = { ":updatedAt": new Date().toISOString() };
  for (const [k, v] of Object.entries(patch)) {
    sets.push(`#${k} = :${k}`); names[`#${k}`] = k; values[":" + k] = v;
  }
  sets.push("updatedAt = :updatedAt");
  const UpdateExpression = `SET ${sets.join(", ")}`;
  await ddb.send(new UpdateCommand({ TableName: TABLE, Key, UpdateExpression, ExpressionAttributeNames: names, ExpressionAttributeValues: values }));
}

export async function deleteApp({ catKey, subKey, slug }) {
  const Key = appKey(catKey, subKey, slug);
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key }));
}

export async function getApp({ catKey, subKey, slug }) {
  const Key = appKey(catKey, subKey, slug);
  const { Item } = await ddb.send(new GetCommand({ TableName: TABLE, Key }));
  return Item;
}

// ---- Category & Subcategory CRUD ----
export async function upsertCategory({ catKey, name, tagline = "", gradient = "", iconKey = "", order = 0, status = "active" }) {
  const now = new Date().toISOString();
  // Use Update to set createdAt if missing
  const names = { '#order': 'order', '#status': 'status', '#name': 'name' };
  const values = {
    ':et': 'Category', ':ck': catKey, ':name': name, ':tag': tagline, ':grad': gradient, ':icon': iconKey,
    ':ord': order, ':st': status, ':now': now
  };
  const UpdateExpression = 'SET entityType = :et, catKey = :ck, #status = :st, #order = :ord, #name = :name, tagline = :tag, gradient = :grad, iconKey = :icon, updatedAt = :now, createdAt = if_not_exists(createdAt, :now)';
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `CAT#${catKey}`, SK: 'META' },
    UpdateExpression,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export async function upsertSubcategory({ catKey, subKey, name, blurb = "", iconKey = "", order = 0, status = "active" }) {
  const now = new Date().toISOString();
  const names = { '#order': 'order', '#status': 'status', '#name': 'name' };
  const values = {
    ':et': 'Subcategory', ':ck': catKey, ':sk': subKey, ':name': name, ':blurb': blurb, ':icon': iconKey,
    ':ord': order, ':st': status, ':now': now
  };
  const UpdateExpression = 'SET entityType = :et, catKey = :ck, subKey = :sk, #status = :st, #order = :ord, #name = :name, blurb = :blurb, iconKey = :icon, updatedAt = :now, createdAt = if_not_exists(createdAt, :now)';
  await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `CAT#${catKey}`, SK: `SUB#${subKey}` },
    UpdateExpression,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

export async function deleteCategory({ catKey, force = false }) {
  // Check subcategories
  const subs = await listSubcategories(catKey);
  if (subs.length && !force) {
    const names = subs.map(s => s.subKey || (s.SK || '').replace('SUB#',''));
    throw new Error(`Category has subcategories: ${names.join(', ')}`);
  }
  if (subs.length && force) {
    for (const s of subs) {
      const subKey = s.subKey || (s.SK || '').replace('SUB#','');
      await deleteSubcategory({ catKey, subKey, force: true });
    }
  }
  // Delete META item
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `CAT#${catKey}`, SK: 'META' } }));
}

export async function deleteSubcategory({ catKey, subKey, force = false }) {
  // Check apps
  const apps = await listApps(catKey, subKey);
  if (apps.length && !force) {
    const slugs = apps.map(a => a.slug || (a.SK || '').replace('APP#',''));
    throw new Error(`Subcategory has apps: ${slugs.slice(0,5).join(', ')}${slugs.length>5?'…':''}`);
  }
  if (apps.length && force) {
    for (const a of apps) {
      const slug = a.slug || (a.SK || '').replace('APP#','');
      await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `CAT#${catKey}#SUB#${subKey}`, SK: `APP#${slug}` } }));
    }
  }
  // Delete SUB item
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { PK: `CAT#${catKey}`, SK: `SUB#${subKey}` } }));
}
