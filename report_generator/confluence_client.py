import os
import requests
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv

load_dotenv()


class ConfluenceClient:
    def __init__(self):
        self.base_url = os.environ["CONFLUENCE_BASE_URL"]
        self.auth = HTTPBasicAuth(os.environ["CONFLUENCE_EMAIL"], os.environ["CONFLUENCE_API_TOKEN"])
        self.parent_page_id = os.environ["CONFLUENCE_PARENT_PAGE_ID"]
        self.session = requests.Session()
        self.session.auth = self.auth
        self.session.headers.update({
            "Accept": "application/json",
            "Content-Type": "application/json",
        })

    def _get(self, path, params=None):
        resp = self.session.get(f"{self.base_url}{path}", params=params, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path, json_body):
        resp = self.session.post(f"{self.base_url}{path}", json=json_body, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def _put(self, path, json_body):
        resp = self.session.put(f"{self.base_url}{path}", json=json_body, timeout=30)
        resp.raise_for_status()
        return resp.json()

    def find_page(self, title, space_key=None):
        """Return existing page dict or None."""
        params = {"title": title, "expand": "version"}
        if space_key:
            params["spaceKey"] = space_key
        data = self._get("/rest/api/content", params=params)
        results = data.get("results", [])
        return results[0] if results else None

    def create_or_update_page(self, title, body_storage, space_key=None):
        """Create a new Confluence page or update it if one with the same title already exists."""
        existing = self.find_page(title, space_key)
        if existing:
            page_id = existing["id"]
            current_version = existing["version"]["number"]
            payload = {
                "version": {"number": current_version + 1},
                "title": title,
                "type": "page",
                "body": {"storage": {"value": body_storage, "representation": "storage"}},
            }
            result = self._put(f"/rest/api/content/{page_id}", payload)
            return result["_links"]["base"] + result["_links"]["webui"], "updated"

        payload = {
            "type": "page",
            "title": title,
            "ancestors": [{"id": self.parent_page_id}],
            "body": {"storage": {"value": body_storage, "representation": "storage"}},
        }
        if space_key:
            payload["space"] = {"key": space_key}
        result = self._post("/rest/api/content", payload)
        return result["_links"]["base"] + result["_links"]["webui"], "created"
