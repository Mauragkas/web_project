import requests
import os

BASE_URL = "http://localhost:3000"

def login_instructor():
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/auth/login", json={
        "username": "instructor1",
        "password": "instructor123"
    })
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    return session

def test_create_topic_without_pdf():
    session = login_instructor()
    payload = {
        "title": "Test Topic Without PDF",
        "description": "A short description for a topic without PDF."
    }
    resp = session.post(f"{BASE_URL}/instructor/api/instructor/topics/create", data=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    topic_id = data["topicId"]

    resp2 = session.get(f"{BASE_URL}/instructor/api/instructor/topics")
    assert resp2.status_code == 200
    topics = resp2.json()["topics"]
    assert any(t["id"] == topic_id for t in topics)

def test_create_topic_with_pdf(tmp_path):
    session = login_instructor()
    pdf_path = tmp_path / "dummy.pdf"
    with open(pdf_path, "wb") as f:
        f.write(b"%PDF-1.4\n%Dummy PDF content\n%%EOF")

    payload = {
        "title": "Test Topic With PDF",
        "description": "A short description for a topic with PDF."
    }
    files = {
        "document": ("dummy.pdf", open(pdf_path, "rb"), "application/pdf")
    }
    resp = session.post(
        f"{BASE_URL}/instructor/api/instructor/topics/create",
        data=payload,
        files=files
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    topic_id = data["topicId"]

    resp2 = session.get(f"{BASE_URL}/instructor/api/instructor/topics")
    assert resp2.status_code == 200
    topics = resp2.json()["topics"]
    topic = next((t for t in topics if t["id"] == topic_id), None)
    assert topic is not None
    assert topic["document_path"] is not None and topic["document_path"].endswith(".pdf")

def test_create_topic_missing_title():
    session = login_instructor()
    payload = {
        "title": "",
        "description": "Missing title"
    }
    resp = session.post(f"{BASE_URL}/instructor/api/instructor/topics/create", data=payload)
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False

def test_create_topic_missing_description():
    session = login_instructor()
    payload = {
        "title": "Missing Description",
        "description": ""
    }
    resp = session.post(f"{BASE_URL}/instructor/api/instructor/topics/create", data=payload)
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False

def test_create_topic_unauthenticated():
    # Should fail if not logged in as instructor
    resp = requests.post(
        f"{BASE_URL}/instructor/api/instructor/topics/create",
        data={
            "title": "Should Fail",
            "description": "No session"
        },
        headers={"Accept": "application/json"}
    )
    assert resp.status_code in (401, 403)
    data = resp.json()
    assert data["success"] is False
