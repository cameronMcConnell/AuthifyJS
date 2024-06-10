curl -X POST http://localhost:3000/admin/delete_user -H "Content-Type: application/json" -d '{
    "adminKey": "your_admin_key",
    "username": "testuser"
}'