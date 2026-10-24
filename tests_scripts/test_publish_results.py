import tempfile
import unittest
from pathlib import Path

from scripts.publish_results import build_result_payloads, publish
from scripts.run_uat_tests import run


JUNIT = """<?xml version=\"1.0\"?><testsuite name=\"uat\" failures=\"1\" skipped=\"0\" time=\"0\"><testcase classname=\"tests_shopeasy.test_pricing\" name=\"test_discount\" time=\"0.1\"><properties><property name=\"story\" value=\"US-CART-02\"/><property name=\"case\" value=\"TC-US-CART-02-04\"/></properties><failure message=\"expected 54, got 60\">trace</failure></testcase></testsuite>"""


class PublishResultsTests(unittest.TestCase):
    def test_payload_contains_required_traceability_fields(self):
        with tempfile.TemporaryDirectory() as directory:
            junit_path = Path(directory) / "results.xml"
            junit_path.write_text(JUNIT, encoding="utf-8")
            payloads = build_result_payloads(junit_path, {"US-CART-02": 13})
        payload = payloads[0]
        self.assertEqual(payload["outcome"], "Failed")
        self.assertEqual(payload["state"], "Completed")
        self.assertEqual(payload["automatedTestStorage"], "tests_shopeasy")
        self.assertEqual(payload["comment"], "story=US-CART-02;storyId=13;case=TC-US-CART-02-04")
        self.assertEqual(payload["testCaseTitle"], "TC-US-CART-02-04 Discount")
        self.assertIn("expected 54", payload["errorMessage"])

    def test_dry_run_makes_no_requests(self):
        with tempfile.TemporaryDirectory() as directory:
            junit_path = Path(directory) / "results.xml"
            junit_path.write_text(JUNIT, encoding="utf-8")
            client = _PublishClient()
            run_id = publish(client, junit_path, {"US-CART-02": 13}, dry_run=True)
        self.assertIsNone(run_id)
        self.assertEqual(client.posts, [])

    def test_uat_runner_writes_junit_with_story_property_and_expected_counts(self):
        with tempfile.TemporaryDirectory() as directory:
            summary, junit_path = run(Path(directory))
            root = __import__("xml.etree.ElementTree", fromlist=["ElementTree"]).parse(junit_path).getroot()
        self.assertEqual(summary, {"total": 16, "passed": 12, "failed": 3, "skipped": 1})
        self.assertEqual(root.get("tests"), "16")
        self.assertEqual(root.get("failures"), "3")
        self.assertEqual(root.find(".//property[@name='story']").get("value"), "US-CART-01")
        cases = [node.get("value") for node in root.findall(".//property[@name='case']")]
        self.assertEqual(len(cases), 10)
        self.assertIn("TC-US-CHK-04-02", cases)


class _PublishClient:
    def __init__(self):
        self.posts = []

    def post(self, *args, **kwargs):
        self.posts.append((args, kwargs))
        return {"id": 1}
