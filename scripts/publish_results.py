import argparse
import json
from datetime import datetime
from pathlib import Path
from xml.etree import ElementTree

try:
    from .ado_client import AdoClient
    from .envfile import load_env, require
except ImportError:  # Supports `python scripts/publish_results.py` from the demo root.
    from ado_client import AdoClient
    from envfile import load_env, require


def build_result_payloads(junit_path, story_map):
    root = ElementTree.parse(junit_path).getroot()
    payloads = []
    for testcase in root.findall("testcase"):
        failure = testcase.find("failure")
        skipped = testcase.find("skipped")
        story_property = testcase.find("./properties/property[@name='story']")
        story_key = story_property.get("value", "") if story_property is not None else ""
        case_property = testcase.find("./properties/property[@name='case']")
        case_id = case_property.get("value", "") if case_property is not None else ""
        title = testcase.get("name", "").replace("test_", "").replace("_", " ").title()
        outcome = "Failed" if failure is not None else "Blocked" if skipped is not None else "Passed"
        detail = failure if failure is not None else skipped
        payloads.append({
            "testCaseTitle": f"{case_id} {title}" if case_id else title,
            "automatedTestName": f"{testcase.get('classname', '')}.{testcase.get('name', '')}",
            "automatedTestStorage": "tests_shopeasy",
            "outcome": outcome,
            "state": "Completed",
            "durationInMs": int(float(testcase.get("time", "0")) * 1000),
            "errorMessage": detail.get("message", "") if detail is not None else "",
            "stackTrace": detail.text or "" if detail is not None else "",
            "comment": f"story={story_key};storyId={story_map.get(story_key, '')}" + (f";case={case_id}" if case_id else ""),
        })
    return payloads


def publish(client, junit_path, story_map, dry_run=False):
    results = build_result_payloads(junit_path, story_map)
    run_body = {"name": f"ShopEasy UAT {datetime.now():%Y-%m-%d %H:%M}", "automated": True, "state": "InProgress"}
    if dry_run:
        print(json.dumps({"run": run_body, "results": results}, ensure_ascii=False, indent=2))
        return None
    run = client.post("/_apis/test/runs", run_body)
    run_id = run["id"]
    client.post(f"/_apis/test/Runs/{run_id}/results", results)
    client.patch(f"/_apis/test/runs/{run_id}", {"state": "Completed"})
    return run_id


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--junit", default="output/results/latest.xml")
    parser.add_argument("--story-map", default="story-map.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    story_map = json.loads(Path(args.story_map).read_text(encoding="utf-8"))
    if args.dry_run:
        publish(None, args.junit, story_map, dry_run=True)
        return
    values = load_env()
    client = AdoClient(require(values, "ADO_ORG"), require(values, "ADO_PROJECT"), require(values, "ADO_PAT"))
    run_id = publish(client, args.junit, story_map)
    print(f"Published run {run_id}: https://dev.azure.com/{client.org}/{client.project}/_testManagement/runs?_a=runCharts&runId={run_id}")


if __name__ == "__main__":
    main()
