curl -X POST http://localhost:9000/forward_request -H "Content-Type: application/json" -d '{
    "token": "your_generated_token",
    "url": "https://jsonplaceholder.typicode.com/posts/1",
    "method": "GET",
    "data": {}
}'