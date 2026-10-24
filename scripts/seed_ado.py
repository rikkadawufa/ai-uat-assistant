import argparse
import html
import json
from pathlib import Path

try:
    from .ado_client import AdoClient
    from .envfile import load_env, require
except ImportError:  # Supports `python scripts/seed_ado.py` from the demo root.
    from ado_client import AdoClient
    from envfile import load_env, require


def build_story_patch(story, omit_ac=False):
    patch_ops = [
        {"op": "add", "path": "/fields/System.Title", "value": f"[{story['key']}] {story['title']}"},
        {"op": "add", "path": "/fields/System.Description", "value": f"<p>{html.escape(story['story'])}</p>"},
        {"op": "add", "path": "/fields/System.Tags", "value": f"shopeasy-demo; {story['key']}"},
    ]
    if not omit_ac:
        acceptance = "".join(f"<li>{html.escape(item)}</li>" for item in story["acceptance_criteria"])
        patch_ops.insert(2, {"op": "add", "path": "/fields/Microsoft.VSTS.Common.AcceptanceCriteria", "value": f"<ol>{acceptance}</ol>"})
    return patch_ops


def find_or_create_story(client, story, omit_ac=False):
    query = ("SELECT [System.Id] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' "
             "AND [System.Tags] CONTAINS 'shopeasy-demo' "
             f"AND [System.Title] CONTAINS '[{story['key']}]'")
    existing = client.wiql(query).get("workItems", [])
    if existing:
        return existing[0]["id"]
    created = client.create_work_item("User Story", build_story_patch(story, omit_ac))
    return created["id"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--omit-ac", default="US-CHK-06")
    args = parser.parse_args()
    stories = json.loads(Path("sample-data/user-stories.json").read_text(encoding="utf-8"))
    if args.dry_run:
        for story in stories:
            print(json.dumps(build_story_patch(story, story["key"] == args.omit_ac), ensure_ascii=False))
        return
    values = load_env()
    client = AdoClient(require(values, "ADO_ORG"), require(values, "ADO_PROJECT"), require(values, "ADO_PAT"))
    mapping = {story["key"]: find_or_create_story(client, story, story["key"] == args.omit_ac) for story in stories}
    Path("story-map.json").write_text(json.dumps(mapping, indent=2) + "\n", encoding="utf-8")
    print(f"Seeded or reused {len(mapping)} ShopEasy stories.")


if __name__ == "__main__":
    main()
