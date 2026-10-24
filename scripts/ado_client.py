import base64
import json
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class AdoError(RuntimeError):
    def __init__(self, status, method, url, body_excerpt, pat=""):
        self.status = status
        self.method = method
        self.url = url
        self.body_excerpt = _mask(body_excerpt[:500], pat)
        hint = " Check PAT scopes: Work Items RW, Test Management RW, Project and Team R." if status in (401, 403) else ""
        super().__init__(f"ADO {status} {method} {url}: {self.body_excerpt}{hint}")


def _mask(value, secret):
    result = str(value)
    if secret:
        result = result.replace(secret, "***")
    return result


class AdoClient:
    def __init__(self, org, project, pat, timeout=30):
        self.org = org
        self.project = project
        self.pat = pat
        self.timeout = timeout
        self.base_url = f"https://dev.azure.com/{org}/{project}"

    def get(self, path, params=None):
        return self._request("GET", path, params=params)

    def post(self, path, body, content_type="application/json"):
        return self._request("POST", path, body=body, content_type=content_type)

    def patch(self, path, body, content_type="application/json"):
        return self._request("PATCH", path, body=body, content_type=content_type)

    def wiql(self, query):
        return self.post("/_apis/wit/wiql", {"query": query})

    def get_work_items(self, ids, fields):
        return self.get("/_apis/wit/workitems", {"ids": ",".join(map(str, ids)), "fields": ",".join(fields)})

    def create_work_item(self, item_type, patch_ops):
        return self.post(f"/_apis/wit/workitems/${item_type.replace(' ', '%20')}", patch_ops, "application/json-patch+json")

    def add_comment(self, work_item_id, text):
        return self.post(f"/_apis/wit/workItems/{work_item_id}/comments", {"text": text})

    def _request(self, method, path, params=None, body=None, content_type="application/json"):
        query = {"api-version": "7.1"}
        if params:
            query.update(params)
        separator = "&" if "?" in path else "?"
        url = self.base_url + path + separator + urlencode(query, doseq=True)
        data = json.dumps(body).encode("utf-8") if body is not None else None
        token = base64.b64encode(f":{self.pat}".encode("utf-8")).decode("ascii")
        request = Request(url, data=data, method=method, headers={"Authorization": f"Basic {token}", "Content-Type": content_type, "Accept": "application/json"})
        for attempt in range(3):
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    raw = response.read().decode("utf-8")
                    return json.loads(raw) if raw else {}
            except HTTPError as error:
                body_excerpt = error.read().decode("utf-8", errors="replace")
                if error.code == 429 or 500 <= error.code < 600:
                    if attempt < 2:
                        retry_after = error.headers.get("Retry-After") if error.headers else None
                        time.sleep(float(retry_after) if retry_after is not None else 2 ** attempt)
                        continue
                raise AdoError(error.code, method, url, body_excerpt, self.pat) from None
            except URLError as error:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
                raise AdoError(0, method, url, str(error.reason), self.pat) from None
