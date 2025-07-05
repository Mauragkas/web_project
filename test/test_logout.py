import requests

BASE_URL = "http://localhost:3000"

def login_and_get_session(username, password):
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    assert resp.status_code == 200
    assert resp.json()["success"] is True
    return session

def test_logout_student():
    session = login_and_get_session("student1", "student123")
    resp = session.post(f"{BASE_URL}/auth/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "Logout successful" in data["message"]
    check = session.get(f"{BASE_URL}/auth/check-auth")
    assert check.status_code == 200
    assert check.json()["isLoggedIn"] is False

def test_logout_instructor():
    session = login_and_get_session("instructor1", "instructor123")
    resp = session.post(f"{BASE_URL}/auth/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    check = session.get(f"{BASE_URL}/auth/check-auth")
    assert check.status_code == 200
    assert check.json()["isLoggedIn"] is False

def test_logout_secretariat():
    session = login_and_get_session("secretariat1", "secretariat123")
    resp = session.post(f"{BASE_URL}/auth/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    check = session.get(f"{BASE_URL}/auth/check-auth")
    assert check.status_code == 200
    assert check.json()["isLoggedIn"] is False

def test_logout_without_login():
    session = requests.Session()
    resp = session.post(f"{BASE_URL}/auth/logout")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    check = session.get(f"{BASE_URL}/auth/check-auth")
    assert check.status_code == 200
    assert check.json()["isLoggedIn"] is False
