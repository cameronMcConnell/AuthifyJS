curl -X POST http://localhost:3000/delete_user -H "Content-Type: application/json" -d '{
    "token": "your_generated_token",
    "username": "testuser"
}'