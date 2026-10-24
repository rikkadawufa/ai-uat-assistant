import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts.envfile import load_env, require


class EnvfileTests(unittest.TestCase):
    def test_environment_variable_overrides_env_file(self):
        with tempfile.TemporaryDirectory() as directory:
            env_path = Path(directory) / ".env"
            env_path.write_text("ADO_ORG=file-org\nADO_PAT=file-value\n", encoding="utf-8")
            with patch.dict(os.environ, {"ADO_ORG": "environment-org"}, clear=False):
                values = load_env(env_path)
        self.assertEqual(values["ADO_ORG"], "environment-org")
        self.assertEqual(values["ADO_PAT"], "file-value")

    def test_require_reports_missing_name_without_values(self):
        with self.assertRaisesRegex(SystemExit, "Missing ADO_PAT in .env"):
            require({"ADO_ORG": "example-org"}, "ADO_PAT")
