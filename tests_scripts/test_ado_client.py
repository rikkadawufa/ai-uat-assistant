import io
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from scripts.ado_client import AdoClient, AdoError


class AdoClientTests(unittest.TestCase):
    def test_retries_transient_429_then_returns_json(self):
        calls = []

        def fake_urlopen(request, timeout):
            calls.append(request)
            if len(calls) == 1:
                raise HTTPError(request.full_url, 429, "rate limited", {"Retry-After": "0"}, io.BytesIO(b"slow down"))
            return _Response(b'{"value": [1]}')

        with patch("scripts.ado_client.urlopen", fake_urlopen), patch("scripts.ado_client.time.sleep") as sleep:
            result = AdoClient("org", "project", "not-a-real-pat").get("/_apis/projects")
        self.assertEqual(result, {"value": [1]})
        self.assertEqual(len(calls), 2)
        sleep.assert_called_once_with(0)

    def test_401_error_includes_scope_hint_and_masks_pat(self):
        def fake_urlopen(request, timeout):
            raise HTTPError(request.full_url, 401, "unauthorized", {}, io.BytesIO(b"token=super-secret-pat"))

        with patch("scripts.ado_client.urlopen", fake_urlopen):
            with self.assertRaises(AdoError) as captured:
                AdoClient("org", "project", "super-secret-pat").get("/_apis/projects")
        message = str(captured.exception)
        self.assertIn("Check PAT scopes", message)
        self.assertNotIn("super-secret-pat", message)
        self.assertIn("***", message)


class _Response:
    def __init__(self, body):
        self.body = body

    def read(self):
        return self.body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False
