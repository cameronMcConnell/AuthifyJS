curl -X POST http://localhost:3000/signup -H "Content-Type: application/json" -d '{
    "username": "testuser",
    "password": "password123",
    "data": {
        "email": "testuser@example.com"
    }
}'