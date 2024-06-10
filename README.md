# AuthifyJS

AuthifyJS is a Node.js application designed for user authentication, utilizing MongoDB for data storage. This repository contains the application code, utility functions, and Docker configuration for easy deployment.

## Project Overview

AuthifyJS provides user authentication functionalities, including user signup, login, password update, and more. It leverages MongoDB for storing user information and includes routes for both standard and admin operations.

## Getting Started

### Prerequisites

To run this project, you'll need:

- Docker installed on your machine.
- A MongoDB server running (can be hosted elsewhere).

### Installation

1. Clone this repository:
    ```sh
    git clone https://github.com/your-username/AuthifyJS.git
    cd AuthifyJS
    ```

2. Build and run the Docker container:
    ```sh
    docker build -t authifyjs .
    docker run -d -p 9000:9000 --name authifyjs -e PORT=9000 -e MONGO_URL="<Your MongoDB URL>" -e DB_NAME="AuthifyJS" -e ADMIN_KEY="<Your Admin Key>" authifyjs
    ```

## Application Structure

### `index.js`

This file contains the main application logic, including route handlers for user authentication and admin operations.

### `utils.js`

This file contains utility functions for hashing passwords and generating random tokens.

### `Dockerfile`

The Dockerfile sets up the Node.js environment, installs dependencies, and runs the application.

## Configuration

Environment variables are used to configure the application:

- `PORT`: The port the application will run on.
- `MONGO_URL`: The URL of the MongoDB server.
- `DB_NAME`: The name of the MongoDB database.
- `ADMIN_KEY`: The key used for admin operations.

### Example Dockerfile

```dockerfile
FROM node:16

RUN mkdir -p /AuthifyJS/src

WORKDIR /AuthifyJS

COPY src/index.js src/utils.js ./src

COPY package.json package-lock.json ./

RUN npm install

EXPOSE 9000

ENV PORT=9000
ENV MONGO_URL=""
ENV DB_NAME=""
ENV ADMIN_KEY=""

CMD ["node", "src/index.js"]
```

## Usage

Once the Docker container is running, the application will be available on the specified port. You can interact with the API using tools like `curl` or Postman.

### Example API Calls

#### Signup

```bash
curl -X POST http://localhost:9000/signup -H "Content-Type: application/json" -d '{"username":"testuser","password":"password"}'
```

#### Login

```bash
curl -X POST http://localhost:9000/login -H "Content-Type: application/json" -d '{"username":"testuser","password":"password"}'
```

#### Update Password

```bash
curl -X POST http://localhost:9000/update_password -H "Content-Type: application/json" -d '{"token":"<user-token>","newPassword":"newpassword"}'
```

#### Admin Delete User

```bash
curl -X POST http://localhost:9000/admin/delete_user -H "Content-Type: application/json" -d '{"adminKey":"<admin-key>","username":"testuser"}'
```

## Contributing

Contributions are welcome! Please fork this repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.