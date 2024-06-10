curl -X POST http://localhost:9000/update_password -H "Content-Type: application/json" -d '{
    "token": "your_generated_token",
    "newPassword": "newpassword123"
}'