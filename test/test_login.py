import requests

BASE_URL = "http://localhost:3000"

def test_login_success_student():
    payload = {
        "username": "student1",
        "password": "student123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["userRole"] == "student"
    assert "Login successful" in data["message"]

def test_login_success_instructor():
    payload = {
        "username": "instructor1",
        "password": "instructor123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["userRole"] == "instructor"
    assert "Login successful" in data["message"]

def test_login_success_secretariat():
    payload = {
        "username": "secretariat1",
        "password": "secretariat123"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["userRole"] == "secretariat"
    assert "Login successful" in data["message"]

def test_login_invalid_password():
    payload = {
        "username": "student1",
        "password": "wrongpassword"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert resp.status_code == 401
    data = resp.json()
    assert data["success"] is False
    assert "Invalid username or password" in data["message"]

def test_login_missing_fields():
    payload = {
        "username": ""
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert resp.status_code == 400
    data = resp.json()
    assert data["success"] is False
    assert "Username and password are required" in data["message"]

def test_login_nonexistent_user():
    payload = {
        "username": "notarealuser",
        "password": "irrelevant"
    }
    resp = requests.post(f"{BASE_URL}/auth/login", json=payload)
    assert resp.status_code == 401
    data = resp.json()
    assert data["success"] is False
    assert "Invalid username or password" in data["message"]
