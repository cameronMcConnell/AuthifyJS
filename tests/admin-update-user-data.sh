curl -X POST http://localhost:9000/admin/update_user_data -H "Content-Type: application/json" -d '{
    "adminKey": "your_admin_key",
    "username": "testuser",
    "data": {
        "email": "updatedemail@example.com"
    }
}'