import unittest

from scripts.seed_ado import build_story_patch, find_or_create_story


class SeedAdoTests(unittest.TestCase):
    def test_existing_tagged_story_is_reused_without_write(self):
        client = _SeedClient(existing_id=42)
        story_id = find_or_create_story(client, {"key": "US-CART-01", "title": "Add", "story": "Story", "acceptance_criteria": ["AC"]}, omit_ac=False)
        self.assertEqual(story_id, 42)
        self.assertEqual(client.created, [])

    def test_omit_ac_removes_acceptance_criteria_patch(self):
        patch_ops = build_story_patch({"key": "US-CHK-06", "title": "Pay", "story": "Story", "acceptance_criteria": ["AC"]}, omit_ac=True)
        paths = [operation["path"] for operation in patch_ops]
        self.assertNotIn("/fields/Microsoft.VSTS.Common.AcceptanceCriteria", paths)


class _SeedClient:
    def __init__(self, existing_id):
        self.existing_id = existing_id
        self.created = []

    def wiql(self, query):
        return {"workItems": [{"id": self.existing_id}]}

    def create_work_item(self, item_type, patch_ops):
        self.created.append((item_type, patch_ops))
        return {"id": 999}
