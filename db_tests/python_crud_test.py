"""
Python CRUD smoke test for DynamoDB Portfolio table.

Usage:
  pip install -r db_tests/requirements.txt
  export AWS_REGION=us-west-2
  export DDB_TABLE=Portfolio
  python db_tests/python_crud_test.py [--ensure-table]
"""
import os
import sys
import argparse
from pprint import pprint

from ddb_repo import (
    ensure_table,
    upsert_category,
    upsert_subcategory,
    create_app,
    update_app,
    delete_app,
    get_app,
    list_categories,
    list_subcategories,
    list_apps,
)


def main(argv=None):
    parser = argparse.ArgumentParser(description="DynamoDB CRUD test for Portfolio table")
    parser.add_argument("--ensure-table", action="store_true", help="Create table + GSI if missing")
    parser.add_argument("--region", default=os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-west-2")
    parser.add_argument("--table", default=os.getenv("DDB_TABLE", "Portfolio"))
    args = parser.parse_args(argv)

    print(f"Region: {args.region}  Table: {args.table}")
    if args.ensure_table:
        print("Ensuring table exists (may take up to a minute on first create)...")
        ensure_table(args.table, args.region)
        print("Table ready.")

    # Test data
    cat_key = "ai"
    cat_name = "ARTIFICIAL INTELLIGENCE"
    sub_key = "education"
    sub_name = "Education"
    app_name = "AI Tutor"
    app_slug = "ai-tutor"

    print("\nUpsert category...")
    upsert_category(
        cat_key,
        name=cat_name,
        tagline="Systems that learn, assist, and amplify human potential.",
        gradient="from-cyan-500 to-blue-600",
        icon_key="Brain",
        order=1,
        table_name=args.table,
    )

    print("Upsert subcategory...")
    upsert_subcategory(
        cat_key,
        sub_key,
        name=sub_name,
        blurb="Personalized learning and mastery tracking.",
        icon_key="GraduationCap",
        order=1,
        table_name=args.table,
    )

    print("Create app...")
    create_app(
        cat_key,
        sub_key,
        app_name,
        desc="Conversational tutor that adapts to your level and pace.",
        details="Curriculum-aware sessions, spaced repetition, and concept maps.",
        media_url="",
        icon_index=0,
        table_name=args.table,
    )

    print("\nList categories (GSI1):")
    pprint(list_categories(table_name=args.table))

    print("\nList subcategories for cat=ai:")
    pprint(list_subcategories(cat_key, table_name=args.table))

    print("\nList apps for ai/education:")
    pprint(list_apps(cat_key, sub_key, table_name=args.table))

    print("\nUpdate app (desc)...")
    update_app(cat_key, sub_key, app_slug, {"desc": "Conversational tutor (updated)"}, table_name=args.table)
    print("Get app:")
    pprint(get_app(cat_key, sub_key, app_slug, table_name=args.table))

    print("\nDelete app...")
    delete_app(cat_key, sub_key, app_slug, table_name=args.table)
    print("Verify deletion (should be None):")
    pprint(get_app(cat_key, sub_key, app_slug, table_name=args.table))

    print("\nCRUD test completed.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

