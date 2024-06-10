curl -X POST http://localhost:3000/update_user_data -H "Content-Type: application/json" -d '{
    "token": "your_generated_token",
    "data": {
        "email": "newemail@example.com"
    }
}'