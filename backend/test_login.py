import requests
resp = requests.post('http://127.0.0.1:8000/api/auth/login/', json={'email':'alice@example.com','password':'pass123'})
print(resp.status_code)
print(resp.text)
