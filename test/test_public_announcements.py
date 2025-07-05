import requests
import datetime

BASE_URL = "http://localhost:3000"

def test_public_announcements_default():
    resp = requests.get(f"{BASE_URL}/public/api/announcements")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["announcements"], list)

def test_public_announcements_with_date_range():
    today = datetime.date.today()
    start = today.strftime("%Y-%m-%d")
    end = (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    resp = requests.get(f"{BASE_URL}/public/api/announcements", params={
        "start": start,
        "end": end
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["announcements"], list)

def test_public_announcements_json_feed():
    today = datetime.date.today()
    start = today.strftime("%Y-%m-%d")
    end = (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    resp = requests.get(f"{BASE_URL}/public/api/announcements/feed", params={
        "format": "json",
        "start": start,
        "end": end
    })
    assert resp.status_code == 200
    assert resp.headers["Content-Type"].startswith("application/json")
    data = resp.json()
    assert isinstance(data, list)

def test_public_announcements_xml_feed():
    today = datetime.date.today()
    start = today.strftime("%Y-%m-%d")
    end = (today + datetime.timedelta(days=30)).strftime("%Y-%m-%d")
    resp = requests.get(f"{BASE_URL}/public/api/announcements/feed", params={
        "format": "xml",
        "start": start,
        "end": end
    })
    assert resp.status_code == 200
    assert resp.headers["Content-Type"].startswith("application/xml")
    assert resp.text.startswith("<?xml") or "<announcements>" in resp.text

def test_public_announcements_unauthenticated():
    resp = requests.get(f"{BASE_URL}/public/api/announcements")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True

def test_public_announcements_invalid_range():
    resp = requests.get(f"{BASE_URL}/public/api/announcements", params={
        "start": "1900-01-01",
        "end": "1900-01-02"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert isinstance(data["announcements"], list)
    # Likely empty
    assert len(data["announcements"]) == 0
