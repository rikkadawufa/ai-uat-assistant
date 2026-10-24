import os
from pathlib import Path


def load_env(path=".env"):
    values = {}
    env_path = Path(path)
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or "=" not in stripped:
                continue
            key, value = stripped.split("=", 1)
            values[key.strip()] = value.strip()
    for key, value in os.environ.items():
        if key in values or key.startswith(("ADO_", "OPENAI_", "SLACK_", "LLM_", "N8N_", "GENERIC_")):
            values[key] = value
    return values


def require(values, name):
    if not values.get(name):
        raise SystemExit(f"Missing {name} in .env")
    return values[name]
