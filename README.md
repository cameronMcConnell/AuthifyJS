# AuthifyJS
AuthifyJS is a Node.js application designed for user authentication, utilizing MongoDB for data storage. This repository contains the application code, utility functions, and Docker configuration for easy deployment.

## Project Overview
AuthifyJS provides comprehensive user authentication functionalities, including user signup, login, password update, and email verification. It supports both standard user operations and advanced admin operations, all leveraging MongoDB for storing user data.

## Getting Started

### Prerequisites
To run this project, you'll need:

* Docker installed on your machine.
* A MongoDB server running (can be hosted elsewhere).
* AWS SES (Simple Email Service) credentials for email verification.

### Installation
Clone this repository:

```sh
git clone https://github.com/cameronMcConnell/AuthifyJS.git
cd AuthifyJS
```

### Build and run the Docker container:

```sh
docker build -t authifyjs .
docker run -d -p 9000:9000 --name authifyjs \
    -e PORT=9000 \
    -e MONGO_URL="<Your MongoDB URL>" \
    -e DB_NAME="AuthifyJS" \
    -e ADMIN_KEY="<Your Admin Key>" \
    -e AWS_ACCESS_KEY_ID="<Your AWS Access Key>" \
    -e AWS_SECRET_ACCESS_KEY="<Your AWS Secret Key>" \
    -e AWS_REGION="<Your AWS Region>" \
    -e SES_VERIFIED_EMAIL="<Your Verified SES Email>" \
    -e SERVICE_NAME="<Your Service Name>" \
    authifyjs
```

## Application Structure
`src/index.js`
This file contains the main application logic, including route handlers for user authentication and admin operations.

`src/utils.js`
This file contains utility functions for hashing passwords, generating random tokens, and generating verification codes.

`Dockerfile`
The Dockerfile sets up the Node.js environment, installs dependencies, and runs the application.

## Configuration
Environment variables are used to configure the application:

* `PORT`: The port the application will run on.
* `MONGO_URL`: The URL of the MongoDB server.
* `DB_NAME`: The name of the MongoDB database.
* `ADMIN_KEY`: The key used for admin operations.
* `AWS_ACCESS_KEY_ID`: AWS access key for SES.
* `AWS_SECRET_ACCESS_KEY`: AWS secret key for SES.
* `AWS_REGION`: AWS region where SES is configured.
* `SES_VERIFIED_EMAIL`: Verified email address for sending verification emails.
* `SERVICE_NAME`: Name of the service used in email templates.

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
ENV AWS_ACCESS_KEY_ID=""
ENV AWS_SECRET_ACCESS_KEY=""
ENV AWS_REGION=""
ENV SES_VERIFIED_EMAIL=""
ENV SERVICE_NAME=""

CMD ["node", "src/index.js"]
```

## Usage
Once the Docker container is running, the application will be available on the specified port. You can interact with the API using tools like curl or Postman.

### Example API Calls

#### Verify User
```bash
curl -X POST http://localhost:9000/verify -H "Content-Type: application/json" -d '{"username":"testuser","password":"password","verificationCode":"<verification-code>"}'
```

#### Request New Verification Code
```bash
curl -X POST http://localhost:9000/new_verification_code -H "Content-Type: application/json" -d '{"username":"testuser","password":"password","email":"testuser@example.com"}'
```

#### Forward Request
```bash
curl -X POST http://localhost:9000/forward_request -H "Content-Type: application/json" -d '{"token":"<user-token>","url":"http://example.com","method":"GET","data":{}}'
```

#### Update User Data
```bash
curl -X POST http://localhost:9000/update_user_data -H "Content-Type: application/json" -d '{"token":"<user-token>","data":{"key":"value"}}'
```

#### Admin Delete Unverified Users
```bash
curl -X POST http://localhost:9000/admin/delete_unverified_users -H "Content-Type: application/json" -d '{"adminKey":"<admin-key>","usernames":["testuser"]}'
```

#### Admin Get Users
```bash
curl -X POST http://localhost:9000/admin/get_users -H "Content-Type: application/json" -d '{"adminKey":"<admin-key>"}'
```

#### Admin Get Unverified Users
```bash
curl -X POST http://localhost:9000/admin/get_unverified_users -H "Content-Type: application/json" -d '{"adminKey":"<admin-key>"}'
```

#### Admin Update User Data
```bash
curl -X POST http://localhost:9000/admin/update_user_data -H "Content-Type: application/json" -d '{"adminKey":"<admin-key>","username":"testuser","data":{"key":"value"}}'
```

## Contributing
Contributions are welcome! Please fork this repository and submit a pull request for any improvements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.