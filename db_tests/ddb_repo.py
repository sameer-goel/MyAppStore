import os
import time
from typing import Dict, List, Optional

import boto3
from botocore.exceptions import ClientError


DEFAULT_REGION = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-west-2"))
DEFAULT_TABLE = os.getenv("DDB_TABLE", "Portfolio")


def _client(region: Optional[str] = None):
    return boto3.client("dynamodb", region_name=region or DEFAULT_REGION)


def _resource(region: Optional[str] = None):
    return boto3.resource("dynamodb", region_name=region or DEFAULT_REGION)


def slugify(s: str) -> str:
    import re
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"(^-|-$)", "", s)
    return s


def category_pk(cat_key: str) -> str:
    return f"CAT#{cat_key}"


def subcategory_sk(sub_key: str) -> str:
    return f"SUB#{sub_key}"


def app_pk(cat_key: str, sub_key: str) -> str:
    return f"CAT#{cat_key}#SUB#{sub_key}"


def app_sk(slug: str) -> str:
    return f"APP#{slug}"


def ensure_table(table_name: str = DEFAULT_TABLE, region: Optional[str] = None, wait: bool = True) -> None:
    """Create the Portfolio table with GSI1 if it doesn't exist."""
    c = _client(region)
    try:
        c.describe_table(TableName=table_name)
        return
    except c.exceptions.ResourceNotFoundException:
        pass

    c.create_table(
        TableName=table_name,
        AttributeDefinitions=[
            {"AttributeName": "PK", "AttributeType": "S"},
            {"AttributeName": "SK", "AttributeType": "S"},
            {"AttributeName": "entityType", "AttributeType": "S"},
        ],
        KeySchema=[
            {"AttributeName": "PK", "KeyType": "HASH"},
            {"AttributeName": "SK", "KeyType": "RANGE"},
        ],
        BillingMode="PAY_PER_REQUEST",
        GlobalSecondaryIndexes=[
            {
                "IndexName": "GSI1",
                "KeySchema": [
                    {"AttributeName": "entityType", "KeyType": "HASH"},
                    {"AttributeName": "SK", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        ],
    )

    if wait:
        waiter = c.get_waiter("table_exists")
        waiter.wait(TableName=table_name, WaiterConfig={"Delay": 5, "MaxAttempts": 60})


def upsert_category(cat_key: str, name: str, *, tagline: str = "", gradient: str = "", icon_key: str = "", order: int = 0, table_name: str = DEFAULT_TABLE):
    table = _resource().Table(table_name)
    item = {
        "PK": category_pk(cat_key),
        "SK": "META",
        "entityType": "Category",
        "catKey": cat_key,
        "name": name,
        "tagline": tagline,
        "gradient": gradient,
        "iconKey": icon_key,
        "order": order,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    table.put_item(Item=item)
    return item


def upsert_subcategory(cat_key: str, sub_key: str, name: str, *, blurb: str = "", icon_key: str = "", order: int = 0, table_name: str = DEFAULT_TABLE):
    table = _resource().Table(table_name)
    item = {
        "PK": category_pk(cat_key),
        "SK": subcategory_sk(sub_key),
        "entityType": "Subcategory",
        "catKey": cat_key,
        "subKey": sub_key,
        "name": name,
        "blurb": blurb,
        "iconKey": icon_key,
        "order": order,
        "updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    table.put_item(Item=item)
    return item


def create_app(cat_key: str, sub_key: str, name: str, *, desc: str = "", details: str = "", media_url: str = "", icon_index: int = 0, thumb_url: Optional[str] = None, table_name: str = DEFAULT_TABLE):
    table = _resource().Table(table_name)
    slug = slugify(name)
    now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    item = {
        "PK": app_pk(cat_key, sub_key),
        "SK": app_sk(slug),
        "entityType": "App",
        "catKey": cat_key,
        "subKey": sub_key,
        "slug": slug,
        "name": name,
        "desc": desc,
        "details": details,
        "mediaUrl": media_url,
        "iconIndex": icon_index,
        "createdAt": now,
        "updatedAt": now,
    }
    if thumb_url is not None:
        item["thumbUrl"] = thumb_url
    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)",
        )
    except ClientError as e:
        if e.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            raise ValueError(f"App already exists: {cat_key}/{sub_key}/{slug}") from e
        raise
    return item


def update_app(cat_key: str, sub_key: str, slug: str, patch: Dict, *, table_name: str = DEFAULT_TABLE):
    table = _resource().Table(table_name)
    key = {"PK": app_pk(cat_key, sub_key), "SK": app_sk(slug)}
    expr_names = {}
    expr_values = {":updatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    sets = ["updatedAt = :updatedAt"]
    for k, v in patch.items():
        expr_names[f"#{k}"] = k
        expr_values[f":{k}"] = v
        sets.append(f"#{k} = :{k}")
    update_expression = "SET " + ", ".join(sets)
    table.update_item(
        Key=key,
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )


def delete_app(cat_key: str, sub_key: str, slug: str, *, table_name: str = DEFAULT_TABLE):
    table = _resource().Table(table_name)
    table.delete_item(Key={"PK": app_pk(cat_key, sub_key), "SK": app_sk(slug)})


def get_app(cat_key: str, sub_key: str, slug: str, *, table_name: str = DEFAULT_TABLE) -> Optional[Dict]:
    table = _resource().Table(table_name)
    resp = table.get_item(Key={"PK": app_pk(cat_key, sub_key), "SK": app_sk(slug)})
    return resp.get("Item")


def list_categories(*, table_name: str = DEFAULT_TABLE) -> List[Dict]:
    c = _client()
    resp = c.query(
        TableName=table_name,
        IndexName="GSI1",
        KeyConditionExpression="entityType = :t",
        ExpressionAttributeValues={":t": {"S": "Category"}},
    )
    return [
        {k: list(v.values())[0] for k, v in item.items()}
        for item in resp.get("Items", [])
    ]


def list_subcategories(cat_key: str, *, table_name: str = DEFAULT_TABLE) -> List[Dict]:
    c = _client()
    resp = c.query(
        TableName=table_name,
        KeyConditionExpression="PK = :pk AND begins_with(SK, :pref)",
        ExpressionAttributeValues={
            ":pk": {"S": category_pk(cat_key)},
            ":pref": {"S": "SUB#"},
        },
    )
    return [
        {k: list(v.values())[0] for k, v in item.items()}
        for item in resp.get("Items", [])
    ]


def list_apps(cat_key: str, sub_key: str, *, table_name: str = DEFAULT_TABLE) -> List[Dict]:
    c = _client()
    resp = c.query(
        TableName=table_name,
        KeyConditionExpression="PK = :pk AND begins_with(SK, :pref)",
        ExpressionAttributeValues={
            ":pk": {"S": app_pk(cat_key, sub_key)},
            ":pref": {"S": "APP#"},
        },
    )
    return [
        {k: list(v.values())[0] for k, v in item.items()}
        for item in resp.get("Items", [])
    ]

