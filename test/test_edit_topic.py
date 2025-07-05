import requests
import pytest

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

def create_topic(session, title="Edit Me", description="Original description"):
    resp = session.post(f"{BASE_URL}/instructor/api/instructor/topics/create", data={
        "title": title,
        "description": description
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["success"] is True
    return data["topicId"]

def test_edit_topic_title_and_description():
    session = login_instructor()
    topic_id = create_topic(session)

    # Get topic details for editing
    resp = session.get(f"{BASE_URL}/instructor/api/instructor/topics/{topic_id}/edit")
    assert resp.status_code == 200
    topic = resp.json()["topic"]
    assert topic["id"] == topic_id

    # Edit the topic
    new_title = "Edited Title"
    new_description = "Edited description"
    resp2 = session.post(
        f"{BASE_URL}/instructor/api/instructor/topics/{topic_id}/update",
        data={
            "title": new_title,
            "description": new_description,
            "existingDocumentPath": topic.get("document_path") or ""
        }
    )
    assert resp2.status_code == 200
    data = resp2.json()
    assert data["success"] is True

    # Verify changes in topic list
    resp3 = session.get(f"{BASE_URL}/instructor/api/instructor/topics")
    topics = resp3.json()["topics"]
    edited = next((t for t in topics if t["id"] == topic_id), None)
    assert edited is not None
    assert edited["title"] == new_title
    assert edited["description"] == new_description

def test_edit_topic_pdf(tmp_path):
    session = login_instructor()
    topic_id = create_topic(session)

    # Create a dummy new PDF
    pdf_path = tmp_path / "newfile.pdf"
    with open(pdf_path, "wb") as f:
        f.write(b"%PDF-1.4\n%New PDF content\n%%EOF")

    # Get topic details for editing
    resp = session.get(f"{BASE_URL}/instructor/api/instructor/topics/{topic_id}/edit")
    topic = resp.json()["topic"]

    files = {
        "document": ("newfile.pdf", open(pdf_path, "rb"), "application/pdf")
    }
    data = {
        "title": "PDF Updated",
        "description": "PDF changed",
        "existingDocumentPath": topic.get("document_path") or ""
    }
    resp2 = session.post(
        f"{BASE_URL}/instructor/api/instructor/topics/{topic_id}/update",
        data=data,
        files=files
    )
    assert resp2.status_code == 200
    assert resp2.json()["success"] is True

    # Verify document_path is updated and ends with .pdf
    resp3 = session.get(f"{BASE_URL}/instructor/api/instructor/topics")
    topics = resp3.json()["topics"]
    edited = next((t for t in topics if t["id"] == topic_id), None)
    assert edited is not None
    assert edited["document_path"] is not None
    assert edited["document_path"].endswith(".pdf")

def test_edit_topic_unauthenticated():
    # Try to edit a topic without logging in
    resp = requests.post(
        f"{BASE_URL}/instructor/api/instructor/topics/1/update",
        data={
            "title": "Should Fail",
            "description": "No session",
            "existingDocumentPath": ""
        },
        headers={"Accept": "application/json"}
    )
    assert resp.status_code in (401, 403)
    data = resp.json()
    assert data["success"] is False

def test_edit_topic_invalid_id():
    session = login_instructor()
    # Try to edit a topic that doesn't exist
    resp = session.post(
        f"{BASE_URL}/instructor/api/instructor/topics/999999/update",
        data={
            "title": "Doesn't exist",
            "description": "Should fail",
            "existingDocumentPath": ""
        }
    )
    assert resp.status_code == 404
    data = resp.json()
    assert data["success"] is False

def test_edit_topic_missing_fields():
    session = login_instructor()
    topic_id = create_topic(session)
    # Missing title
    resp = session.post(
        f"{BASE_URL}/instructor/api/instructor/topics/{topic_id}/update",
        data={
            "title": "",
            "description": "desc",
            "existingDocumentPath": ""
        }
    )
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False

    # Missing description
    resp2 = session.post(
        f"{BASE_URL}/instructor/api/instructor/topics/{topic_id}/update",
        data={
            "title": "title",
            "description": "",
            "existingDocumentPath": ""
        }
    )
    assert resp2.status_code == 400
    data2 = resp2.json()
    assert data2["success"] is False
