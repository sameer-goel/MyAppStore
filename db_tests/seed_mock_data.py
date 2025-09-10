"""
Seed mock data into the Portfolio DynamoDB table without deleting anything.

Usage:
  source .venv/bin/activate  # or create venv
  pip install -r db_tests/requirements.txt
  export AWS_REGION=us-west-2
  export DDB_TABLE=Portfolio
  python db_tests/seed_mock_data.py --ensure-table
"""
import argparse
import os
from pprint import pprint

from ddb_repo import (
    ensure_table,
    upsert_category,
    upsert_subcategory,
    create_app,
    slugify,
)


def create_app_safe(cat_key, sub_key, name, **kwargs):
    try:
        return create_app(cat_key, sub_key, name, **kwargs), True
    except Exception as e:
        # If already exists, continue silently; otherwise re-raise
        msg = str(e)
        if "App already exists" in msg or "ConditionalCheckFailedException" in msg:
            return None, False
        raise


def main():
    parser = argparse.ArgumentParser(description="Seed mock data into DynamoDB Portfolio table")
    parser.add_argument("--ensure-table", action="store_true", help="Create table and GSI if missing")
    parser.add_argument("--region", default=os.getenv("AWS_REGION") or os.getenv("AWS_DEFAULT_REGION") or "us-west-2")
    parser.add_argument("--table", default=os.getenv("DDB_TABLE", "Portfolio"))
    args = parser.parse_args()

    if args.ensure_table:
        ensure_table(args.table, args.region)

    # Categories
    cats = [
        {
            "catKey": "ai",
            "name": "ARTIFICIAL INTELLIGENCE",
            "tagline": "Systems that learn, assist, and amplify human potential.",
            "gradient": "from-cyan-500 to-blue-600",
            "iconKey": "Brain",
            "order": 1,
            "subs": [
                {
                    "subKey": "education",
                    "name": "Education",
                    "blurb": "Personalized learning and mastery tracking.",
                    "iconKey": "GraduationCap",
                    "order": 1,
                    "apps": [
                        ("AI Tutor", "Conversational tutor that adapts to your level and pace.", "Curriculum-aware sessions, spaced repetition, and concept maps."),
                        ("Learning Analytics", "Insights from learning behavior and outcomes.", "Mastery dashboards, weak-area surfacing, and forecasts."),
                        ("Skill Assessment", "Practical, scenario-based evaluations.", "Auto-generated rubrics and feedback loops."),
                    ],
                },
                {
                    "subKey": "healthcare",
                    "name": "Healthcare",
                    "blurb": "Augmenting clinicians and empowering patients.",
                    "iconKey": "Stethoscope",
                    "order": 2,
                    "apps": [
                        ("Symptom Analyzer", "Triage and guidance based on symptoms.", "Evidence-backed suggestions and urgency flags."),
                        ("Mental Health AI", "Journaling, mood tracking, and nudges.", "CBT-inspired prompts and resources."),
                        ("Medical Imaging", "Assists reading scans for faster insights.", "Anomaly highlighting and structured reports."),
                    ],
                },
                {
                    "subKey": "energy",
                    "name": "Energy",
                    "blurb": "Optimize generation, storage, and consumption.",
                    "iconKey": "Battery",
                    "order": 3,
                    "apps": [
                        ("Smart Grid", "Grid-level prediction and orchestration.", "Demand response and fault detection."),
                        ("Carbon Tracker", "Measure, reduce, and report emissions.", "Goal tracking and compliance views."),
                        ("Renewable Optimizer", "Forecast and tune renewable assets.", "Weather-aware scheduling and maintenance."),
                    ],
                },
            ],
        },
        {
            "catKey": "inner",
            "name": "INNER INTELLIGENCE",
            "tagline": "Mind, body, and soul—your inner operating system.",
            "gradient": "from-fuchsia-500 to-rose-600",
            "iconKey": "Sparkles",
            "order": 2,
            "subs": [
                {
                    "subKey": "mind",
                    "name": "Mind",
                    "blurb": "Clarity, calm, and cognitive flow.",
                    "iconKey": "Brain",
                    "order": 1,
                    "apps": [
                        ("Meditation Timer", "Rituals, intervals, and soundscapes.", "Breath pacing and bell patterns."),
                        ("Focus Enhancer", "Deep-work cycles with gentle nudges.", "Pomodoro and distraction logs."),
                        ("Mindfulness Tracker", "Micro check-ins that add up.", "Mood tagging and streaks."),
                    ],
                },
                {
                    "subKey": "body",
                    "name": "Body",
                    "blurb": "Movement, recovery, and holistic health.",
                    "iconKey": "Dumbbell",
                    "order": 2,
                    "apps": [
                        ("Wellness Monitor", "Vitals and habits in one view.", "Sleep, hydration, HRV, and alerts."),
                        ("Movement Analytics", "Technique cues and mobility insights.", "Posture detection and recovery load."),
                        ("Health Insights", "Trends you can act on.", "Lab markers and personalized recommendations."),
                    ],
                },
                {
                    "subKey": "soul",
                    "name": "Soul",
                    "blurb": "Meaning, gratitude, and growth.",
                    "iconKey": "Sparkles",
                    "order": 3,
                    "apps": [
                        ("Gratitude Journal", "Capture tiny joys that shape big days.", "Prompts and kindness streaks."),
                        ("Purpose Discovery", "Align your compass with your calling.", "Values mapping and story work."),
                        ("Spiritual Growth", "Practice, reflect, and integrate.", "Daily sadhana and milestones."),
                    ],
                },
            ],
        },
    ]

    created_counts = {"categories": 0, "subcategories": 0, "apps": 0}
    existed_counts = {"apps": 0}

    for cat in cats:
        upsert_category(
            cat["catKey"],
            name=cat["name"],
            tagline=cat["tagline"],
            gradient=cat["gradient"],
            icon_key=cat["iconKey"],
            order=cat["order"],
            table_name=args.table,
        )
        created_counts["categories"] += 1

        for sub in cat["subs"]:
            upsert_subcategory(
                cat["catKey"],
                sub["subKey"],
                name=sub["name"],
                blurb=sub["blurb"],
                icon_key=sub["iconKey"],
                order=sub["order"],
                table_name=args.table,
            )
            created_counts["subcategories"] += 1

            for name, desc, details in sub["apps"]:
                slug = slugify(name)
                thumb = f"https://picsum.photos/seed/{slug}/200"
                _, created = create_app_safe(
                    cat["catKey"],
                    sub["subKey"],
                    name,
                    desc=desc,
                    details=details,
                    media_url="",
                    icon_index=0,
                    thumb_url=thumb,
                    table_name=args.table,
                )
                if created:
                    created_counts["apps"] += 1
                else:
                    existed_counts["apps"] += 1

    print("\nSeed summary:")
    pprint(created_counts)
    if existed_counts["apps"]:
        print("Existing apps (not re-created):", existed_counts["apps"])


if __name__ == "__main__":
    main()

